const NUM_STEPS = 4
let imgUrls = [];
let fields = [];
let imgPickersData = { "itemImg": [], 'field-1': [] };

const filePickers = document.querySelectorAll(".attach-photos input[type=file]");
for (const filePicker of filePickers) {
  filePicker.addEventListener("change", addPhoto);
}

function submitFirstPhotoForAnalysis() {
  // 1. AWS Rekognition if product is in supported categories (Digital Storage, Clothes)
  //    - reveal auto-populated additional fields with VIGOUR and STYLE.
  // 2. Reverse Image Search API (shh) to check if cover image is a stock image, and suggest the user take their own picture if so
  // That's all, then the seller experience page shld be ready so submit to the endpoint
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

const performStepActions = (stepNum) => {
  if (stepNum === 2) {
    if (imgPickersData["itemImg"].length === 0) {
      alert("Please attach images of your product.");
      return false;
    }

    submitFirstPhotoForAnalysis();
  } else if (stepNum === 4) {
    const listingFieldElementMappings = [
      ["listing-title", "summary-title"],
      ["listing-category", "summary-category"],
      ["listing-price", "summary-price"],
      ["listing-description", "summary-description"],
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

topBarLoadCallbacks.push(async () => {
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
});

function renderCategories() {
  const categoryOptionsDiv = document.querySelector("#category-filter .filter-options");
  for (const category of categoryData.categories) {
    const categoryOptionDiv = document.createElement("div");
    categoryOptionDiv.className = "filter-option";
    categoryOptionDiv.addEventListener("click", () => {
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
    // use querySelectorAll instead of getElementsByClassName
    // because getElementsByClassName returns a **live** list of elements which shortens when an element is removed
    // decreasing the length of the element list during iteration will result in some elements not being removed
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
        // const subcategoryUrl =
        //     `/categories/${parentCategoryName}/${subcategoryMatch.name}`;
        // const parentCategoryUrl =
        //     `/categories/${parentCategoryName}`;

        const subcategorySearchResultDiv = document.createElement("div");
        subcategorySearchResultDiv.className = "category-search-result";
        subcategorySearchResultDiv.addEventListener("click", () => {
          location.href = location.href.substring(0, location.href.indexOf("&cat") == -1 ? location.href.length : location.href.indexOf("&cat")) + "&cat=" + subcategoryMatch.id;
        });
        
        const subcategoryLink = document.createElement("a");
        subcategoryLink.className = "result-name";
        // subcategoryLink.href = subcategoryUrl;
        subcategoryLink.textContent = subcategoryMatch.name;

        const parentCategorySpan = document.createElement("span");
        parentCategorySpan.className = "result-parent-category";

        const parentCategoryLink = document.createElement("a");
        // parentCategoryLink.href = parentCategoryUrl;
        parentCategoryLink.textContent = parentCategoryName;
        
        parentCategorySpan.append("in ", parentCategoryLink);

        // const rightArrowIconDiv = document.createElement("div");
        // rightArrowIconDiv.className = "material-icons";
        // const rightArrowIconSpan = document.createElement("span");
        // rightArrowIconSpan.textContent = "chevron_right";
        // rightArrowIconDiv.append(rightArrowIconSpan);

        subcategorySearchResultDiv.append(subcategoryLink, parentCategorySpan);
        
        categorySearchResultsDiv.append(subcategorySearchResultDiv);
      }
      for (const categoryMatch of categoryMatches) {
        // const categoryUrl = `/categories/${categoryMatch.name}`;

        const categorySearchResultDiv = document.createElement("div");
        categorySearchResultDiv.className = "category-search-result";
        categorySearchResultDiv.addEventListener("click", () => {
          location.href = location.href.substring(0, location.href.indexOf("&cat") == -1 ? location.href.length : location.href.indexOf("&cat")) + "&cat=" + categoryMatch.id;
        });

        const categoryLink = document.createElement("a");
        categoryLink.className = "result-name";
        // categoryLink.href = categoryUrl;
        categoryLink.textContent = categoryMatch.name;

        // const rightArrowIconDiv = document.createElement("div");
        // rightArrowIconDiv.className = "material-icons";
        // const rightArrowIconSpan = document.createElement("span");
        // rightArrowIconSpan.textContent = "chevron_right";
        // rightArrowIconDiv.append(rightArrowIconSpan);

        categorySearchResultDiv.append(categoryLink);

        categorySearchResultsDiv.append(categorySearchResultDiv);
      }
    }
  });
}

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
addFieldButton.addEventListener("click", () => {
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
});

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

document.getElementById("next-button").addEventListener("click", () => {
  if (currentStep < NUM_STEPS) {
    currentStep++;
    if (performStepActions(currentStep) === false) {
      currentStep--;
      return;
    }
    showStep(currentStep);
  }
});
