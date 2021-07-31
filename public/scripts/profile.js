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
      if (j == i) {
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
const markingPriceInterval = (maxPrice - minPrice) / (NUM_VERTICAL_MARKINGS - 1);

const SVG_NAMESPACE_URI = "http://www.w3.org/2000/svg";

const topMarkingYCoord = graphY1 + 20;
const bottomMarkingYCoord = graphY2;

for (let i = 0; i < NUM_VERTICAL_MARKINGS; i++) {
  // marking line
  const markingLine = document.createElementNS(SVG_NAMESPACE_URI, "line");
  markingLine.classList.add("price-marking-line");

  markingLine.setAttribute("x1", graphX1);
  markingLine.setAttribute("x2", "100%");

  const markingLineYCoord = topMarkingYCoord +
      (bottomMarkingYCoord - topMarkingYCoord) * i / (NUM_VERTICAL_MARKINGS - 1);
  markingLine.setAttribute("y1", markingLineYCoord);
  markingLine.setAttribute("y2", markingLineYCoord);

  // marking price text box
  const markingText = document.createElementNS(SVG_NAMESPACE_URI, "text");
  markingText.classList.add("price-marking-text");

  markingText.setAttribute("x", graphX1 - 10);
  markingText.setAttribute("y", markingLineYCoord + 4);

  markingText.textContent = (maxPrice - markingPriceInterval * i).toFixed(2);

  priceGraphSVG.append(markingLine, markingText);
}

// const ctx = priceGraphCanvas.getContext("2d");

// priceGraphCanvas.width = 3840;
// priceGraphCanvas.height = 2160;

// vertical axis label
// ctx.font = "100px Segoe UI";
// ctx.fillText("Price (S$)", 0, 100);

// // vertical axis
// ctx.beginPath();
// ctx.moveTo(0, 0);
// ctx.lineTo(0, 400);
// ctx.stroke();

// ctx.fillStyle ="#00ff00";
// ctx.fillRect(0, 0, 300, 400);
