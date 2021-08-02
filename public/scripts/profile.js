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

let graphLoaded = false;
function loadGraph() {
  if (graphLoaded) {
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
  if (prices.length !== ((graphEndDate - graphStartDate) / 1000 / 60 / 60 / 24) + 1) {
    throw Error("Number of prices does not match difference between start and end date");
  }
  const numDays = prices.length;
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  const priceGraphSVG = document.getElementById("price-graph");
  const verticalAxis = document.getElementById("vertical-axis");
  const horizontalAxis = document.getElementById("horizontal-axis");

  const graphX1 = maxPrice.toFixed(2).length * 9;
  verticalAxis.x1.baseVal.value = graphX1;
  verticalAxis.x2.baseVal.value = graphX1;
  horizontalAxis.x1.baseVal.value = graphX1;
  // verticalAxis.x1 = verticalAxis.x2 = `${Math.round(maxPrice).toString().length}em`;

  // const graphX1 = verticalAxis.x1.baseVal.value;
  const graphY1 = verticalAxis.y1.baseVal.value;
  const graphX2 = horizontalAxis.x2.baseVal.value;
  const graphY2 = horizontalAxis.y2.baseVal.value;

  const NUM_VERTICAL_MARKINGS = 6;
  const priceMarkingInterval = (maxPrice - minPrice) / (NUM_VERTICAL_MARKINGS - 1);

  const SVG_NAMESPACE_URI = "http://www.w3.org/2000/svg";

  const topPriceMarkingYCoord = graphY1 + 20;
  const bottomPriceMarkingYCoord = graphY2;

  for (let i = 0; i < NUM_VERTICAL_MARKINGS; i++) {
    const priceMarkingLine = document.createElementNS(SVG_NAMESPACE_URI, "line");
    priceMarkingLine.classList.add("price-marking-line");

    priceMarkingLine.setAttribute("x1", graphX1);
    priceMarkingLine.setAttribute("x2", "100%");

    const priceMarkingYCoord = topPriceMarkingYCoord +
        (bottomPriceMarkingYCoord - topPriceMarkingYCoord) *
        i / (NUM_VERTICAL_MARKINGS - 1);
    priceMarkingLine.setAttribute("y1", priceMarkingYCoord);
    priceMarkingLine.setAttribute("y2", priceMarkingYCoord);

    const priceMarkingText = document.createElementNS(SVG_NAMESPACE_URI, "text");
    priceMarkingText.classList.add("price-marking-text");

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
    dataPoint.classList.add("price-data-point");

    const dataPointXCoord = leftDateMarkingXCoord +
        (rightDateMarkingXCoord - leftDateMarkingXCoord) *
        i / (numDays - 1);
    const dataPointYCoord = topPriceMarkingYCoord + (bottomPriceMarkingYCoord - topPriceMarkingYCoord) * (maxPrice - prices[i]) / (maxPrice - minPrice);

    dataPoint.setAttribute("cx", dataPointXCoord);
    dataPoint.setAttribute("cy", dataPointYCoord);
    dataPoint.setAttribute("r", 5);

    const lineToPrevDataPoint = document.createElementNS(SVG_NAMESPACE_URI,
        "line");
    lineToPrevDataPoint.classList.add("price-data-line");
    
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

  graphLoaded = true;
};

document.getElementById("analytics-profile-tab-switcher")
    .addEventListener("click", () => {
      setTimeout(loadGraph, 0);
    });
