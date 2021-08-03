const profileTabSwitchers = document.getElementsByClassName("profile-tab-switcher");
const profileTabContentDivs = document.getElementsByClassName("profile-tab-content");
for (let i = 0; i < profileTabSwitchers.length; i++) {
  const profileTabSwitcher = profileTabSwitchers[i];
  profileTabSwitcher.addEventListener("click", () => {
    for (const otherProfileTabSwitcher of profileTabSwitchers) {
      if (otherProfileTabSwitcher === profileTabSwitcher) {
        otherProfileTabSwitcher.classList.add("profile-tab-switcher-selected");
      } else {
        otherProfileTabSwitcher.classList.remove("profile-tab-switcher-selected");
      }
    }

    for (let j = 0; j < profileTabContentDivs.length; j++) {
      if (j === i) {
        profileTabContentDivs[j].classList.add("profile-tab-content-selected");
      } else {
        profileTabContentDivs[j].classList
            .remove("profile-tab-content-selected");
      }
    }
  });
}

let searchResults = ``;

(async () => {
  // 
  document.querySelector("#username").innerText = user["user"];

  // get listings
  let form = new FormData();
  form.set("user", user["user"]);

  searchResults = await fetch(`${API_ENDPOINT}/item/user-list`, {
    body: form,
    method: "post",
  }).then(res => res.json());
  
  renderSearchResults();
})();

(async () => {
  // get profile
  let form = new FormData();
  form.set("jwt", localStorage.getItem("session"));

  let profileData = await fetch(`${API_ENDPOINT}/profile/get`, {
    body: form,
    method: "post",
  }).then(res => res.json());
  
  document.querySelector("#green-points-count").innerText = profileData.greenPts;
  document.querySelector("#green-pts-hist").innerHTML = ``;

  for (let item of profileData.sales) {
    document.querySelector("#green-pts-hist").innerHTML += `<tr>
  <td>${item.name}</td>
  <td>${new Date(item.time).toLocaleString()}</td>
  <td>
    <span>
      ${item.pts}
      <img src="/media/green-points.svg" alt="Green points logo">
    </span>
  </td>
</tr>`;
  }
})();

function renderSearchResults() {
  let resultsHTML = ``;

  if (searchResults.length == 0) {
    resultsHTML = `<div style="grid-column: 1 / -1; text-align: center; display: block; padding-bottom: 24px;"><h1 style="font-weight: bold; color: grey;">Oh no! No items were found!</h1><p>Try searching using less specific search terms, or remove filters.</p></div>`
  }

  searchResults.forEach((item) => {
    // i know that this is bad practice, but we really don't have time!!!
    resultsHTML += SaferHTML`<div class="listing">
  <div class="listing-info-top">
    <img src="/media/placeholder-profile-picture.jpeg" alt="Seller profile picture" class="profile-picture-small">
    <div class="listing-info-top-text">
      <div class="seller-username">${item.user}</div>
      <div class="listing-age">1 day ago</div>
    </div>
  </div>
  <div class="item-image-wrapper">
    <img src="${ (item.img.includes("http")) ? item.img : `https://miko-user-img.s3.amazonaws.com/user-img/${item.img}` }" alt="Product image" class="item-image">
  </div>
  <div class="listing-info-bottom">
    <div class="item-name">${item.name}</div>
    <div class="item-price">${item.cash}</div>
    <div class="item-description">${item.txt}</div>
  </div>
  <div class="listing-action-buttons">
    <button class="like-button liked material-icons"></button>
    <span class="like-count">${ item.up ? item.up : 0 }</span>
  </div>
</div>`;
  });

  document.querySelector("#listings").innerHTML = resultsHTML;
}

const categoryOptionsDiv = document.getElementById("category-options");
const categorySearchDiv = document.getElementById("category-search");
const categorySearchInputWrapper = document
    .getElementById("category-search-input-wrapper");
const categorySearchInput = categorySearchInputWrapper
    .querySelector("input[type='text']");
const categorySearchResultsDiv = document
    .getElementById("category-search-results");
// let setSearchResultsDisplayTimeout = null;

const displayPriceGraph = (categoryId) => {
  
};

const onCategorySelected = (selectedCategory) => {
  categorySearchDiv.classList.remove("search-active");

  categorySearchInput.value = selectedCategory.name;
  displayPriceGraph(selectedCategory.id);
};

const renderCategories = () => {
  const categoryOptionsDiv = document.getElementById("category-options");
  for (const category of categoryData.categories) {
    const categoryOptionDiv = document.createElement("div");
    categoryOptionDiv.className = "category-option";
    categoryOptionDiv.addEventListener("click", () => {
      onCategorySelected(category);
    });

    const categoryNameSpan = document.createElement("span");
    categoryNameSpan.className = "category-name";
    categoryNameSpan.textContent = category.name;

    const rightArrowIconSpan = document.createElement("span");
    rightArrowIconSpan.className = "material-icons";
    rightArrowIconSpan.textContent = "chevron_right";

    const subcategoriesDiv = document.createElement("div");
    subcategoriesDiv.className = "subcategories";

    if (category.sub === undefined) category.sub = [];

    for (const subcategory of category.sub) {
      const subcategoryDiv = document.createElement("div");
      subcategoryDiv.textContent = subcategory.name;
      subcategoryDiv.addEventListener("click", (event) => {
        event.stopPropagation();
        onCategorySelected(subcategory);
      });

      subcategoriesDiv.append(subcategoryDiv);
    }

    categoryOptionDiv.append(categoryNameSpan, rightArrowIconSpan, subcategoriesDiv);
    categoryOptionsDiv.append(categoryOptionDiv);
  }
};

let categoryData = [];
(async () => {
  categoryData = await fetch("https://miko-user-img.s3.amazonaws.com/categories.json").then((res) => res.json());
  renderCategories();
})();

categorySearchInput.addEventListener("focus", () => {
  categorySearchDiv.classList.add("search-active");
  // clearTimeout(setSearchResultsDisplayTimeout);
  // // setSearchResultsDisplayTimeout = setTimeout(() => {
  // categorySearchResultsDiv.style.pointerEvents = "all";
  // categorySearchResultsDiv.style.opacity = "1";
  // categorySearchInputWrapper.style.borderRadius = "7px 7px 0 0";
  // // }, 200);
});

document.addEventListener("click", (event) => {
  // const categorySearchResultsDivRect = categorySearchResultsDiv
  //     .getBoundingClientRect();
  // const categorySearchDivRect = categorySearchResultsDiv.parentElement
  //     .getBoundingClientRect();
  for (const elem of [categorySearchDiv, ...categorySearchDiv
    .getElementsByTagName("*")]) {
    if (mouseEventIsWithinDOMRect(event, elem.getBoundingClientRect())) {
      return;
    }
  }


  categorySearchDiv.classList.remove("search-active");
  // categorySearchResultsDiv.style.opacity = "0";
  // setSearchResultsDisplayTimeout = setTimeout(() => {
  //   categorySearchResultsDiv.style.pointerEvents = "none";
  // }, 200);
  // categorySearchInputWrapper.style.borderRadius = "7px";
});

categorySearchInput.addEventListener("input", () => {
  for (const categorySearchResultDiv of document.querySelectorAll(".category-search-result")) {
    categorySearchResultDiv.remove();
  }

  const searchQuery = categorySearchInput.value.toLowerCase();
  const categoryOptionDivs = document.getElementsByClassName("category-option");
  if (searchQuery === "") {
    categorySearchResultsDiv.style.display = "none";
    for (const filterOption of categoryOptionDivs) {
      filterOption.style.display = "flex";
    }
  } else {
    categorySearchResultsDiv.style.display = "block";
    for (const filterOption of categoryOptionDivs) {
      filterOption.style.display = "none";
    }

    const categoryMatches = [];
    const subcategoryMatches = [];
    for (const category of categoryData.categories) {
      if (category.name.toLowerCase().includes(searchQuery)) {
        categoryMatches.push(category);
      }

      if (typeof category.sub !== "undefined") {
        for (const subcategory of category.sub) {
          if (subcategory.name.toLowerCase().includes(searchQuery)) {
            subcategoryMatches.push({
              subcategoryMatch: subcategory,
              parentCategory: category,
            });
          }
        }
      }
    }

    const noCategorySearchResultsDiv = document
        .getElementById("no-category-search-results");
    if (categoryMatches.length === 0 && subcategoryMatches.length === 0) {
      noCategorySearchResultsDiv.style.display = "block";
    } else {
      noCategorySearchResultsDiv.style.display = "none";
    }

    for (const { subcategoryMatch, parentCategory } of subcategoryMatches) {
      // const subcategoryUrl =
      //     `/categories/${parentCategoryName}/${subcategoryMatch.name}`;
      // const parentCategoryUrl =
      //     `/categories/${parentCategoryName}`;

      const subcategorySearchResultDiv = document.createElement("div");
      subcategorySearchResultDiv.className = "category-search-result";
      subcategorySearchResultDiv.addEventListener("click", () => {
        onCategorySelected(subcategoryMatch);
      });
      
      const subcategoryLink = document.createElement("a");
      subcategoryLink.className = "result-name";
      subcategoryLink.addEventListener("click", (event) => {
        event.stopPropagation();
        onCategorySelected(subcategoryMatch);
      });
      subcategoryLink.textContent = subcategoryMatch.name;

      const parentCategorySpan = document.createElement("span");
      parentCategorySpan.className = "result-parent-category";

      const parentCategoryLink = document.createElement("a");
      parentCategoryLink.addEventListener("click", (event) => {
        event.stopPropagation();
        onCategorySelected(parentCategory);
      });
      parentCategoryLink.textContent = parentCategory.name;
      
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
        onCategorySelected(categoryMatch);
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

let graphsLoaded = false;
function loadGraph() {
  if (graphsLoaded) {
    return;
  }

  const graphStartDate = new Date("2021-07-17T00:00:00");
  const graphEndDate = new Date("2021-07-30T00:00:00");
  const prices = [
    132,
    143,
    169,
    232,
    218,
    233,
    322.3913,
    193,
    18,
    209,
    4,
    237,
    244,
    255,
  ];
  const sales = [
    137,
    294,
    123,
    120,
    438,
    134,
    405,
    482,
    144,
    239,
    305,
    586,
    321,
    342,
  ];
  if (sales.length !== prices.length ||
    prices.length !== ((graphEndDate - graphStartDate) / 1000 / 60 / 60 / 24) + 1) {
    throw Error("Number of prices does not match difference between start and end date");
  }
  const numDays = prices.length;
  
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  const priceGraphSVG = document.getElementById("price-graph");
  const priceVerticalAxis = priceGraphSVG.getElementsByClassName("vertical-axis")[0];
  const priceHorizontalAxis = priceGraphSVG.getElementsByClassName("horizontal-axis")[0];

  const graphX1 = maxPrice.toFixed(2).length * 9;
  priceVerticalAxis.x1.baseVal.value = graphX1;
  priceVerticalAxis.x2.baseVal.value = graphX1;
  priceHorizontalAxis.x1.baseVal.value = graphX1;
  // verticalAxis.x1 = verticalAxis.x2 = `${Math.round(maxPrice).toString().length}em`;

  // const graphX1 = verticalAxis.x1.baseVal.value;
  const graphY1 = priceVerticalAxis.y1.baseVal.value;
  const graphX2 = priceHorizontalAxis.x2.baseVal.value;
  const graphY2 = priceHorizontalAxis.y2.baseVal.value;

  const NUM_VERTICAL_PRICE_MARKINGS = 6;
  const priceMarkingInterval = (maxPrice - minPrice) / (NUM_VERTICAL_PRICE_MARKINGS - 1);

  const SVG_NAMESPACE_URI = "http://www.w3.org/2000/svg";

  const topPriceMarkingYCoord = graphY1 + 20;
  const bottomPriceMarkingYCoord = graphY2;

  for (let i = 0; i < NUM_VERTICAL_PRICE_MARKINGS; i++) {
    const priceMarkingLine = document.createElementNS(SVG_NAMESPACE_URI, "line");
    priceMarkingLine.classList.add("vertical-marking-line");

    priceMarkingLine.setAttribute("x1", graphX1);
    priceMarkingLine.setAttribute("x2", "100%");

    const priceMarkingYCoord = topPriceMarkingYCoord +
        (bottomPriceMarkingYCoord - topPriceMarkingYCoord) *
        i / (NUM_VERTICAL_PRICE_MARKINGS - 1);
    priceMarkingLine.setAttribute("y1", priceMarkingYCoord);
    priceMarkingLine.setAttribute("y2", priceMarkingYCoord);

    const priceMarkingText = document.createElementNS(SVG_NAMESPACE_URI, "text");
    priceMarkingText.classList.add("vertical-marking-text");

    priceMarkingText.setAttribute("x", graphX1 - 10);
    priceMarkingText.setAttribute("y", priceMarkingYCoord + 4);

    priceMarkingText.textContent = (maxPrice - priceMarkingInterval * i).toFixed(2);

    priceGraphSVG.append(priceMarkingLine, priceMarkingText);
  }

  const leftDateMarkingXCoord = graphX1 + 20;
  const rightDateMarkingXCoord = graphX2 - 50;

  const maxDatesShown = 7;
  for (let i = 0; i < numDays; i++) { 
    if ((numDays - i - 1) % Math.ceil(numDays / maxDatesShown) !== 0) {
      continue;
    }

    const dateMarkingLine = document.createElementNS(SVG_NAMESPACE_URI, "line");
    dateMarkingLine.classList.add("date-marking-line");

    dateMarkingLine.setAttribute("y1", graphY2);
    dateMarkingLine.setAttribute("y2", graphY2 + 10);

    const dateMarkingXCoord = leftDateMarkingXCoord +
        (rightDateMarkingXCoord - leftDateMarkingXCoord) *
        i / (numDays - 1);
    dateMarkingLine.setAttribute("x1", dateMarkingXCoord);
    dateMarkingLine.setAttribute("x2", dateMarkingXCoord);

    const dateMarkingText = document.createElementNS(SVG_NAMESPACE_URI, "text");
    dateMarkingText.classList.add("date-marking-text");

    dateMarkingText.setAttribute("x", dateMarkingXCoord);
    dateMarkingText.setAttribute("y", graphY2 + 25);

    const dateMarkingDate = new Date(graphStartDate);
    dateMarkingDate.setDate(dateMarkingDate.getDate() + i);
    dateMarkingText.textContent = new Intl.DateTimeFormat("en-GB")
        .format(dateMarkingDate);

    priceGraphSVG.append(dateMarkingLine, dateMarkingText);
  }

  let prevDataPointXCoord = null;
  let prevDataPointYCoord = null;
  for (let i = 0; i < prices.length; i++) {
    const dataPoint = document.createElementNS(SVG_NAMESPACE_URI, "circle");
    dataPoint.classList.add("graph-data-point");

    const dataPointXCoord = leftDateMarkingXCoord +
        (rightDateMarkingXCoord - leftDateMarkingXCoord) *
        i / (numDays - 1);
    const dataPointYCoord = topPriceMarkingYCoord + (bottomPriceMarkingYCoord - topPriceMarkingYCoord) * (maxPrice - prices[i]) / (maxPrice - minPrice);

    dataPoint.setAttribute("cx", dataPointXCoord);
    dataPoint.setAttribute("cy", dataPointYCoord);
    dataPoint.setAttribute("r", 5);

    const lineToPrevDataPoint = document.createElementNS(SVG_NAMESPACE_URI,
        "line");
    lineToPrevDataPoint.classList.add("graph-data-line");
    
    if (prevDataPointXCoord !== null && prevDataPointYCoord !== null) {
      lineToPrevDataPoint.setAttribute("x1", dataPointXCoord);
      lineToPrevDataPoint.setAttribute("y1", dataPointYCoord);
      lineToPrevDataPoint.setAttribute("x2", prevDataPointXCoord);
      lineToPrevDataPoint.setAttribute("y2", prevDataPointYCoord);
    }

    priceGraphSVG.append(dataPoint, lineToPrevDataPoint);

    prevDataPointXCoord = dataPointXCoord;
    prevDataPointYCoord = dataPointYCoord;
  }

  const maxSales = Math.max(...sales);
  const minSales = Math.min(...sales);

  const salesGraphSVG = document.getElementById("sales-graph");
  const salesVerticalAxis = salesGraphSVG.getElementsByClassName("vertical-axis")[0];
  const salesHorizontalAxis = salesGraphSVG.getElementsByClassName("horizontal-axis")[0];

  const salesGraphX1 = maxSales.toFixed(2).length * 9;
  salesVerticalAxis.x1.baseVal.value = salesGraphX1;
  salesVerticalAxis.x2.baseVal.value = salesGraphX1;
  salesHorizontalAxis.x1.baseVal.value = salesGraphX1;
  // verticalAxis.x1 = verticalAxis.x2 = `${Math.round(maxPrice).toString().length}em`;

  // const graphX1 = verticalAxis.x1.baseVal.value;
  const salesGraphY1 = salesVerticalAxis.y1.baseVal.value;
  const salesGraphX2 = salesHorizontalAxis.x2.baseVal.value;
  const salesGraphY2 = salesHorizontalAxis.y2.baseVal.value;

  const NUM_VERTICAL_SALES_MARKINGS = 10;
  const salesMarkingInterval = (maxSales - minSales) / (NUM_VERTICAL_SALES_MARKINGS - 1);

  const topSalesMarkingYCoord = salesGraphY1 + 20;
  const bottomSalesMarkingYCoord = salesGraphY2;

  for (let i = 0; i < NUM_VERTICAL_SALES_MARKINGS; i++) {
    const salesMarkingLine = document.createElementNS(SVG_NAMESPACE_URI, "line");
    salesMarkingLine.classList.add("vertical-marking-line");

    salesMarkingLine.setAttribute("x1", salesGraphX1);
    salesMarkingLine.setAttribute("x2", "100%");

    const salesMarkingYCoord = topSalesMarkingYCoord +
        (bottomSalesMarkingYCoord - topSalesMarkingYCoord) *
        i / (NUM_VERTICAL_SALES_MARKINGS - 1);
    salesMarkingLine.setAttribute("y1", salesMarkingYCoord);
    salesMarkingLine.setAttribute("y2", salesMarkingYCoord);

    const salesMarkingText = document.createElementNS(SVG_NAMESPACE_URI, "text");
    salesMarkingText.classList.add("vertical-marking-text");

    salesMarkingText.setAttribute("x", salesGraphX1 - 10);
    salesMarkingText.setAttribute("y", salesMarkingYCoord + 4);

    salesMarkingText.textContent = (maxSales - salesMarkingInterval * i).toFixed(2);

    salesGraphSVG.append(salesMarkingLine, salesMarkingText);
  }

  const salesGraphLeftDateMarkingXCoord = salesGraphX1 + 20;
  const salesGraphRightDateMarkingXCoord = salesGraphX2 - 50;

  const salesGraphMaxDatesShown = 7;
  for (let i = 0; i < numDays; i++) { 
    if ((numDays - i - 1) % Math.ceil(numDays / salesGraphMaxDatesShown) !== 0) {
      continue;
    }

    const salesGraphDateMarkingLine = document.createElementNS(SVG_NAMESPACE_URI, "line");
    salesGraphDateMarkingLine.classList.add("date-marking-line");

    salesGraphDateMarkingLine.setAttribute("y1", salesGraphY2);
    salesGraphDateMarkingLine.setAttribute("y2", salesGraphY2 + 10);

    const salesGraphDateMarkingXCoord = salesGraphLeftDateMarkingXCoord +
        (salesGraphRightDateMarkingXCoord - salesGraphLeftDateMarkingXCoord) *
        i / (numDays - 1);
    salesGraphDateMarkingLine.setAttribute("x1", salesGraphDateMarkingXCoord);
    salesGraphDateMarkingLine.setAttribute("x2", salesGraphDateMarkingXCoord);

    const salesGraphDateMarkingText = document.createElementNS(SVG_NAMESPACE_URI, "text");
    salesGraphDateMarkingText.classList.add("date-marking-text");

    salesGraphDateMarkingText.setAttribute("x", salesGraphDateMarkingXCoord);
    salesGraphDateMarkingText.setAttribute("y", salesGraphY2 + 25);

    const salesGraphDateMarkingDate = new Date(graphStartDate);
    salesGraphDateMarkingDate.setDate(salesGraphDateMarkingDate.getDate() + i);
    salesGraphDateMarkingText.textContent = new Intl.DateTimeFormat("en-GB")
        .format(salesGraphDateMarkingDate);

    salesGraphSVG.append(salesGraphDateMarkingLine, salesGraphDateMarkingText);
  }

  let salesGraphPrevDataPointXCoord = null;
  let salesGraphPrevDataPointYCoord = null;
  for (let i = 0; i < sales.length; i++) {
    const salesGraphDataPoint = document.createElementNS(SVG_NAMESPACE_URI, "circle");
    salesGraphDataPoint.classList.add("graph-data-point");

    const salesGraphDataPointXCoord = salesGraphLeftDateMarkingXCoord +
        (salesGraphRightDateMarkingXCoord - salesGraphLeftDateMarkingXCoord) *
        i / (numDays - 1);
    const salesGraphDataPointYCoord = topSalesMarkingYCoord + (bottomSalesMarkingYCoord - topSalesMarkingYCoord) * (maxSales - sales[i]) / (maxSales - minSales);

    salesGraphDataPoint.setAttribute("cx", salesGraphDataPointXCoord);
    salesGraphDataPoint.setAttribute("cy", salesGraphDataPointYCoord);
    salesGraphDataPoint.setAttribute("r", 5);

    const salesGraphLineToPrevDataPoint = document.createElementNS(SVG_NAMESPACE_URI,
        "line");
    salesGraphLineToPrevDataPoint.classList.add("graph-data-line");
    
    if (salesGraphPrevDataPointXCoord !== null && salesGraphPrevDataPointYCoord !== null) {
      salesGraphLineToPrevDataPoint.setAttribute("x1", salesGraphDataPointXCoord);
      salesGraphLineToPrevDataPoint.setAttribute("y1", salesGraphDataPointYCoord);
      salesGraphLineToPrevDataPoint.setAttribute("x2", salesGraphPrevDataPointXCoord);
      salesGraphLineToPrevDataPoint.setAttribute("y2", salesGraphPrevDataPointYCoord);
    }

    salesGraphSVG.append(salesGraphDataPoint, salesGraphLineToPrevDataPoint);

    salesGraphPrevDataPointXCoord = salesGraphDataPointXCoord;
    salesGraphPrevDataPointYCoord = salesGraphDataPointYCoord;
  }

  graphsLoaded = true;
};

document.getElementById("analytics-profile-tab-switcher")
    .addEventListener("click", () => {
      setTimeout(loadGraph, 0);
    });
