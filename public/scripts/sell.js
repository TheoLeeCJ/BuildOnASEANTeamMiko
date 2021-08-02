const NUM_STEPS = 4
let imgUrls = [];
let fields = [];
let imgPickersData = { "itemImg": [], 'field-1': [] };
let selectedCat = -1;
let selectedCatQns = [];
let prevFileName = "";
let prevFileRes = {};
let autofieldsData = [];
let savedFileKey = "";

let categoryData = {};

// un-autofill category
setTimeout(() => { document.querySelector("#listing-category").value = ""; }, 1000);

const filePickers = document.querySelectorAll(".attach-photos input[type=file]");
for (const filePicker of filePickers) {
  filePicker.addEventListener("change", addPhoto);
}

async function submitItem() {
  let finalForm = new FormData();
  let conditionFields = {};
  let imgs = [];

  let fieldNames = document.querySelectorAll(".additional-field-title");
  let fieldTexts = document.querySelectorAll(".additional-field-text");

  let mappings = [
    ["listing-title", "name"],
    ["listing-price", "price"],
    ["listing-description", "description"],
    ["listing-location", "preferredLocations"],
  ];

  for (const [sourceEl, destForm] of mappings) {
    finalForm.set(destForm, document.querySelector(`#${sourceEl}`).value);
  }

  finalForm.set("jwt", localStorage.getItem("session"));
  finalForm.set("category", selectedCat);
  finalForm.set("multipleAvailable", 0);
  
  let pickerKeys = Object.keys(imgPickersData);
  let fieldIndex = 0;
  for (let key of pickerKeys) {
    if (key.includes("field")) {
      conditionFields[fieldNames[fieldIndex].value] = fieldTexts[fieldIndex].value;
      conditionFields[fieldNames[fieldIndex].value + "_IMG"] = [];
      fieldIndex++;
    }
    for (let file of imgPickersData[key]) {
      if (key === "itemImg") {
        if (imgPickersData[key].indexOf(file) === 0) { // re-use first image from the img analysis
          imgs.push(savedFileKey.replace("user-img/pending-", ""));
        }
        else {
          imgs.push((await uploadImg(file)).replace("user-img/pending-", ""));
        }
      }
      else {
        if (key.includes("field")) {
          let imgPath = (await uploadImg(file)).replace("user-img/pending-", "");
          imgs.push(imgPath);
          conditionFields[fieldNames[fieldIndex - 1].value + "_IMG"].push(imgPath);
        }
      }
    }
  }

  console.log(conditionFields);
  console.log(imgs);

  finalForm.set("images", JSON.stringify(imgs));
  finalForm.set("conditionFields", JSON.stringify(conditionFields));

  let res = await fetch(`${API_ENDPOINT}/item/create`, {
    method: "post",
    body: finalForm,
  }).then((res) => res.json());

  console.log(res);
}

async function uploadImg(file) {
  // get image upload key
  let searchFormData = new FormData();
  (user !== null) ? searchFormData.append("jwt", localStorage.getItem("session")) : "";
  let thingy = await (await fetch(`${API_ENDPOINT}/item/get-upload-key`, {
    method: "post",
    body: searchFormData,
  })).json();

  // post image to S3 bucket (temporary, pending-*)
  let formData = new FormData();
  formData.append("key", thingy.msg.imgKey);
  formData.append("acl", "public-read");
  formData.append("Content-Type", file.type);
  for (const field of Object.keys(thingy.msg.presignedPost.fields)) formData.append(field, thingy.msg.presignedPost.fields[field]);

  formData.append("file", file);

  try {
    // AWS S3 doesn't send CORS for img upload endpoint, hence try-catch
    await fetch(thingy.msg.presignedPost.url, {
      method: "post",
      mode: "cors",
      body: formData,
    });
  }
  catch (e) { }

  return thingy.msg.imgKey;
}

async function submitFirstPhotoForAnalysis() {
  let fileToSend = imgPickersData["itemImg"][0];
  if (fileToSend.name === prevFileName) {
    return prevFileRes;
  }
  prevFileName = fileToSend.name;

  let imgKey = await uploadImg(fileToSend);

  // request to analyse image
  let analyseForm = new FormData();
  savedFileKey = imgKey;
  (user !== null) ? analyseForm.append("jwt", localStorage.getItem("session")) : "";
  analyseForm.append("key", imgKey);
  analyseForm.append("category", selectedCat);
  let analyseRes = await (await fetch(`${API_ENDPOINT}/item/process-cover`, {
    method: "post",
    body: analyseForm,
  })).json();

  prevFileRes = analyseRes;
  return prevFileRes;
}

function addPhoto(event) {
  console.log(event.target);
  
  let files = event.target.files;
  let picker = event.target.getAttribute("data-target");

  if (files.length > 0 && imgPickersData[picker].length == 0) {
    document.querySelector(`#picker-${picker}`).parentElement.querySelector(".material-icons-outlined").style.display = "none";
    document.querySelector(`#picker-${picker}`).parentElement.classList.add("hide-desc");
  }

  let toRemove = document.querySelectorAll(`#picker-${picker} > div.add`);
  [...toRemove].forEach((el) => {
    document.querySelector(`#picker-${picker}`).removeChild(el);
  });

  for (let i = 0; i < files.length; i++) {
    let imgEl = document.createElement("div");
    imgEl.className = "img";
    imgEl.innerHTML = `<img src="${URL.createObjectURL(files[i])}" />
<div onclick="removePhoto(this);" data-target="${picker}" data-img="${i}">
  <div>
    <i class="material-icons">close</i>
    <div>Remove Photo</div>
  </div>
</div>`;
    document.querySelector(`#picker-${picker}`).appendChild(imgEl);

    files[i].__blobUrl = URL.createObjectURL(files[i]);
    imgPickersData[picker].push(files[i]);
  }

  let addEl = document.createElement("div");
  addEl.className = "add";
  addEl.innerHTML = `<i class="material-icons">add</i><div>Add Photo</div>`;
  document.querySelector(`#picker-${picker}`).appendChild(addEl);
}

function removePhoto(caller) {
  let picker = caller.getAttribute("data-target");
  let index = parseInt(caller.getAttribute("data-img"));
  imgPickersData[picker].splice(index, 1);

  let toRemove = document.querySelector(`#picker-${picker}`).children[index];
  document.querySelector(`#picker-${picker}`).removeChild(toRemove);

  // TODO: re-number img's data-img attributes to avoid a bug
}

const progressMarkersDiv = document.getElementById("progress-markers");
for (let i = 0; i < NUM_STEPS; i++) {
  const progressMarker = document.createElement("div");
  progressMarker.classList.add("progress-marker");
  if (i == 0) {
    progressMarker.classList.add("progress-marker-complete");
  }
  progressMarkersDiv.append(progressMarker);
}

async function locationSearch() {
  let search = document.querySelector("#listing-location").value;

  document.querySelector("#meetup-list").innerHTML = "<option>";
  document.querySelector("#meetup-list > option").value = `Press enter to see locations for '${search}'`;

  let results = await fetch(`https://nominatim.openstreetmap.org/search.php?q=${encodeURI(search)}&countrycodes=SG&format=jsonv2`).then((res) => res.json());
  results.map((el) => { return el.display_name + " - " + el.category; }).forEach((el) => {
    let itemElement = document.createElement("option");
    itemElement.value = search + ": " + el;
    document.querySelector("#meetup-list").appendChild(itemElement);
  });
}

function locationSearchPrompt() {
  setTimeout(() => {
    document.querySelector("#meetup-list > option").value = `Press enter to see locations for '${document.querySelector("#listing-location").value}'`;
  }, 100);
}

function truncateLocation() {
  let search = document.querySelector("#listing-location").value;
  if (!search.includes(":")) return;
  document.querySelector("#listing-location").value = search.substring(search.indexOf(":") + 1, search.length).trim();
}

function addField(fieldIndex) {
  addFieldUI();

  let fieldNames = document.querySelectorAll(".additional-field-title");
  let fieldTexts = document.querySelectorAll(".additional-field-text");

  fieldNames[fieldNames.length - 1].value = autofieldsData[fieldIndex][0];
  fieldTexts[fieldTexts.length - 1].value = autofieldsData[fieldIndex][1];

  // if time permits: show toast
}

const performStepActions = (stepNum) => {
  if (stepNum === 2) {
    if (document.querySelector("#listing-category").value.trim() === "") {
      alert("Please select a category.");
      return false;
    }
    if (imgPickersData["itemImg"].length === 0) {
      alert("Please attach images of your product.");
      return false;
    }

    // populate questions
    let qnsList = document.querySelector("#questions");
    qnsList.innerHTML = "";
    selectedCatQns.forEach((qn) => {
      let qnElement = document.createElement("option");
      qnElement.value = qn;
      qnsList.appendChild(qnElement);
    });

    // img analysis can be run outside (so that it doesn't delay the next step)
    setTimeout(async () => {
      document.querySelector("#recommendations-loading").style.display = "block";
      document.querySelector("#recommendations-content").style.display = "none";

      // img analysis
      let results = await submitFirstPhotoForAnalysis();

      // show content
      document.querySelector("#recommendations-content-rec").innerHTML = "";
      let autofields = ``;
      if (results.isOnlineImage) {
        document.querySelector("#recommendations-content-rec").innerHTML +=
`<li><b>Use your own image of the product</b> - you may be using an image of the product from the Internet, which may misrepresent its condition. Using your own picture will help it sell better as buyers know what to expect.</li>`;
      }
      else if (results.fields === undefined) {
        document.querySelector("#recommendations-content-rec").innerHTML += `<li><b>no recommendations.</b> nice!</li>`;
      }
      
      if (results.fields === undefined) {
        results.fields = [];
      }

      for (let i = 0; i < results.fields.length; i++) {
        let field = results.fields[i];
        autofields += SaferHTML`<div><b>${field[0]}: </b><span>${field[1]}</span> <a href='javascript:addField(${i});' onclick='this.innerText = "added!";'>add</a>`;
      }

      autofieldsData = results.fields;

      if (results.fields.length > 0) {
        document.querySelector("#recommendations-content-rec").innerHTML +=
`<li><b>Add auto-detected fields</b> - we've detected the following fields in your product image:<br><br>${autofields}<br><br>you can add these fields to help buyers find your product easier!</li>`;
      }

      document.querySelector("#recommendations-loading").style.display = "none";
      document.querySelector("#recommendations-content").style.display = "block";
    }, 0);
  }
  else if (stepNum === 4) {
    const listingFieldElementMappings = [
      ["listing-title", "summary-title"],
      ["listing-category", "summary-category"],
      ["listing-price", "summary-price"],
      ["listing-description", "summary-description"],
      ["listing-location", "summary-location"],
    ];

    for (const [srcElementId, summaryElementId] of listingFieldElementMappings) {
      if (document.getElementById(srcElementId).value === "") {
        alert("Please fill in all the required information to list your product.");
        return false;
      }
      document.querySelector(`#${summaryElementId} + div`).textContent = document.getElementById(srcElementId).value;
    }

    if (imgPickersData["itemImg"].length === 0) {
      alert("Please attach images of your product.");
      return false;
    }

    let imgOutput = "";
    for (let i = 0; i < imgPickersData["itemImg"].length; i++) {
      imgOutput += SaferHTML`<img src="${imgPickersData["itemImg"][i].__blobUrl}" />`;
    }
    document.querySelector(`#summary-img + div`).innerHTML = imgOutput;

    let fieldNames = document.querySelectorAll(".additional-field-title");
    let fieldTexts = document.querySelectorAll(".additional-field-text");
    let fieldIds = Object.keys(imgPickersData).filter((id) => { return id.includes("field"); });

    let fieldsOutput = ``;
    
    for (let i = 0; i < fieldIds.length; i++) {
      if (fieldNames[i] == "" || fieldTexts[i] == "") continue;
      fieldsOutput += SaferHTML`<h4>${fieldNames[i].value}</h4><p>${fieldTexts[i].value}</p>`;

      for (const img of imgPickersData[fieldIds[i]]) {
        console.log(img);
        fieldsOutput += SaferHTML`<img src="${img.__blobUrl}" />`;
      }
    }

    document.querySelector(`#summary-additional-fields + div`).innerHTML = fieldsOutput;
  }
};

const turnRedTimeoutIds = [];

const showStep = (stepNum) => {
  // moved performStepActions to button event handlers
  
  for (const stepElem of document.getElementsByClassName("sell-procedure-step")) {
    stepElem.style.display = "none";
  }
  document.getElementById(`sell-procedure-step-${stepNum}`).style.display = "flex";
      
  const progressBarFiller = document.getElementById("progress-bar-filler");
  progressBarFiller.style.width = `${(currentStep - 1) / (NUM_STEPS - 1) * 100}%`

  const progressMarkers = document.getElementsByClassName("progress-marker");
  for (let i = 0; i < progressMarkers.length; i++) {
    if (i < stepNum) {
      // delay turning red by 800ms
      turnRedTimeoutIds[i] = setTimeout(() => {
        progressMarkers[i].classList.add("progress-marker-complete");
      }, 800);
    } else {
      if (turnRedTimeoutIds[i] !== null) {
        clearTimeout(turnRedTimeoutIds[i]);
        turnRedTimeoutIds[i] = null;
      }
      progressMarkers[i].classList.remove("progress-marker-complete");
    }
  }

  const nextButtonText = document.querySelector("#next-button > span");
  if (stepNum === NUM_STEPS) {
    nextButtonText.textContent = "Post";
  } else {
    nextButtonText.textContent = "Next";
  }
};

async function loadCategories() {
  categoryData = await fetch("https://miko-user-img.s3.amazonaws.com/categories.json").then((res) => res.json());

  const filterButton = document.querySelector("#listing-category-wrapper");

  document.addEventListener("click", (event) => {
    const filterOptionsDivRect = filterButton.nextElementSibling.getBoundingClientRect();
    const filterButtonRect = filterButton.getBoundingClientRect();

    if (!mouseEventIsWithinDOMRect(event, filterOptionsDivRect) && !mouseEventIsWithinDOMRect(event, filterButtonRect)) {
      filterButton.parentElement.classList.remove("filter-dropdown-expanded");
    }
  });

  filterButton.addEventListener("click", () => {
    console.log(filterButton);
    filterButton.parentElement.classList.toggle("filter-dropdown-expanded");
  });

  renderCategories();
}

function renderCategories() {
  const categoryOptionsDiv = document.querySelector("#category-filter .filter-options");
  for (const category of categoryData.categories) {
    const categoryOptionDiv = document.createElement("div");
    categoryOptionDiv.className = "filter-option";
    categoryOptionDiv.addEventListener("click", () => {
      selectedCat = category.id;
      document.querySelector("#listing-category").value = category.name;
      document.querySelector("#listing-category-wrapper").parentElement.classList.remove("filter-dropdown-expanded");
    });

    const categoryNameSpan = document.createElement("span");
    categoryNameSpan.className = "category-name";
    categoryNameSpan.textContent = category.name;

    const rightArrowIconSpan = document.createElement("span");
    rightArrowIconSpan.className = "material-icons";
    rightArrowIconSpan.textContent = "chevron_right";

    const subcategoriesDiv = document.createElement("div");
    subcategoriesDiv.className = "subcategories";

    if (typeof category.sub === "undefined") category.sub = [];

    for (const subcategory of category.sub) {
      const subcategoryDiv = document.createElement("div");
      subcategoryDiv.textContent = subcategory.name;
      subcategoryDiv.addEventListener("click", (event) => {
        event.stopPropagation();
        selectedCat = subcategory.id;
        if (subcategory.questions !== undefined) selectedCatQns = subcategory.filters;
        document.querySelector("#listing-category").value = subcategory.name;
        document.querySelector("#listing-category-wrapper").parentElement.classList.remove("filter-dropdown-expanded");
      });

      subcategoriesDiv.append(subcategoryDiv);
    }

    categoryOptionDiv.append(categoryNameSpan, rightArrowIconSpan, subcategoriesDiv);
    categoryOptionsDiv.append(categoryOptionDiv);
  }

  const categorySearchResultsDiv = document.getElementById("category-search-results");
  document.getElementById("listing-category").addEventListener("input", (event) => {
    for (const categorySearchResultDiv of document.querySelectorAll(".category-search-result")) {
      categorySearchResultDiv.remove();
    }

    const searchQuery = event.target.value.toLowerCase();
    if (searchQuery === "") {
      categorySearchResultsDiv.style.display = "none";
      for (const filterOption of document.querySelectorAll("#category-search-results ~ .filter-option")) {
        filterOption.style.display = "flex";
      }
    } else {
      categorySearchResultsDiv.style.display = "block";
      for (const filterOption of document.querySelectorAll("#category-search-results ~ .filter-option")) {
        filterOption.style.display = "none";
      }

      const categoryMatches = [];
      const subcategoryMatches = [];
      for (const category of categoryData.categories) {
        if (category.name.toLowerCase().includes(searchQuery)) {
          categoryMatches.push(category);
        }

        for (const subcategory of category.sub) {
          if (subcategory.name.toLowerCase().includes(searchQuery)) {
            subcategoryMatches.push({
              subcategoryMatch: subcategory,
              parentCategoryName: category.name,
            });
          }
        }
      }

      const noCategorySearchResultsDiv = document.getElementById("no-category-search-results");
      if (categoryMatches.length === 0 && subcategoryMatches.length === 0) {
        noCategorySearchResultsDiv.style.display = "block";
      } else {
        noCategorySearchResultsDiv.style.display = "none";
      }

      for (const { subcategoryMatch, parentCategoryName } of subcategoryMatches) {
        const subcategorySearchResultDiv = document.createElement("div");
        subcategorySearchResultDiv.className = "category-search-result";
        subcategorySearchResultDiv.addEventListener("click", () => {
          selectedCat = subcategoryMatch.id;
          if (subcategoryMatch.questions !== undefined) selectedCatQns = subcategoryMatch.filters;
          document.querySelector("#listing-category").value = subcategoryMatch.name;
          document.querySelector("#listing-category-wrapper").parentElement.classList.remove("filter-dropdown-expanded");
        });
        
        const subcategoryLink = document.createElement("a");
        subcategoryLink.className = "result-name";
        subcategoryLink.textContent = subcategoryMatch.name;

        const parentCategorySpan = document.createElement("span");
        parentCategorySpan.className = "result-parent-category";

        const parentCategoryLink = document.createElement("a");
        parentCategoryLink.textContent = parentCategoryName;
        
        parentCategorySpan.append("in ", parentCategoryLink);

        subcategorySearchResultDiv.append(subcategoryLink, parentCategorySpan);
        
        categorySearchResultsDiv.append(subcategorySearchResultDiv);
      }
      for (const categoryMatch of categoryMatches) {
        const categorySearchResultDiv = document.createElement("div");
        categorySearchResultDiv.className = "category-search-result";
        categorySearchResultDiv.addEventListener("click", () => {
          selectedCat = categoryMatch.id;
          document.querySelector("#listing-category").value = categoryMatch.name;
          document.querySelector("#listing-category-wrapper").parentElement.classList.remove("filter-dropdown-expanded");
        });

        const categoryLink = document.createElement("a");
        categoryLink.className = "result-name";
        categoryLink.textContent = categoryMatch.name;

        categorySearchResultDiv.append(categoryLink);

        categorySearchResultsDiv.append(categorySearchResultDiv);
      }
    }
  });
}

loadCategories();

const priceInput = document.querySelector("#price-input-wrapper > input[type='text']");

priceInput.addEventListener("keypress", (event) => {
  if (event.key !== "." && (event.key < "0" || event.key > "9")) {
    event.preventDefault();
  }
});

priceInput.addEventListener("change", () => {
  const [integralPart, decimalPart] = priceInput.value.split(".");
  if (typeof decimalPart !== "undefined") {
    priceInput.value = `${integralPart}.${decimalPart.padEnd(2, "0").substring(0, 2)}`;
  }
});

let numAdditionalFields = 1;

function reNumberFields() {
  // re-number remaining fields
  let fieldNum = 1;
  for (const additionalFieldTitle of document.querySelectorAll(".additional-field > h2 > span")) {
    additionalFieldTitle.textContent = `Additional field ${fieldNum}`;
    fieldNum++;
  }
}

const removeAdditionalField = (removeFieldButton) => {
  removeFieldButton.closest(".additional-field").remove();
  delete imgPickersData[`field-${removeFieldButton.getAttribute("data-img-field")}`];
  // numAdditionalFields--; // i'm sorry,
  // but i've already stored all img picker data in a format that kinda relies on the index,
  // so we'll treat them like this internally.
  reNumberFields();
};

const addFieldButton = document.getElementById("add-field-button");
addFieldButton.addEventListener("click", addFieldUI);

function addFieldUI() {
  numAdditionalFields++;
  imgPickersData[`field-${numAdditionalFields}`] = [];
  addFieldButton.insertAdjacentHTML("beforebegin", `        
    <div class="additional-field">
      <h2>
        <span>Additional field ${numAdditionalFields}</span>
        <button onclick="removeAdditionalField(this)" data-img-field="${numAdditionalFields}" title="Delete this field" class="remove-field material-icons">delete_outline</button>
      </h2>
      <h3>Field title</h3>
      <input type="text" class="additional-field-title" placeholder="Name of the field you want to specify">
      <h3>Field value</h3>
      <input type="text" class="additional-field-text" placeholder="Value of the field you want to specify">
      <div class="attach-photos">
        <span class="material-icons-outlined"></span>
        <input onchange="addPhoto(event);" multiple data-target="field-${numAdditionalFields}" type="file" accept="image/*" />
        <div class="photos" id="picker-field-${numAdditionalFields}"></div>
      </div>
    </div>
  `);
  reNumberFields();
}

let currentStep = 1;
showStep(currentStep);

document.getElementById("back-button").addEventListener("click", () => {
  if (currentStep > 1) {
    currentStep--;
    if (performStepActions(currentStep) === false) {
      currentStep++;
      return;
    }
    showStep(currentStep);
  }
});

document.getElementById("next-button").addEventListener("click", async () => {
  if (currentStep < NUM_STEPS) {
    currentStep++;
    if (performStepActions(currentStep) === false) {
      currentStep--;
      return;
    }
    showStep(currentStep);
  }
  else {
    document.querySelector("#full-loader").classList.add("loading");
    await submitItem();
    document.querySelector("#full-loader").classList.remove("loading");
    alert("Your listing has been submitted!");
    window.location.href = "profile.html";
  }
});
