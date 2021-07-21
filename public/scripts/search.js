const queryParams = new URLSearchParams(location.search);
const searchTerm = queryParams.get("searchTerm");
const searchCat = queryParams.get("cat");

let searchResults = [];
let resultCount = 0n;

let categoryData = JSON.parse("{\"largest\":9,\"categories\":[{\"id\":0,\"name\":\"Electronic Devices\",\"sub\":[{\"id\":1,\"name\":\"Digital Storage\"},{\"id\":2,\"name\":\"Laptops and PCs\"}]},{\"id\":3,\"name\":\"Toys\",\"sub\":[{\"id\":4,\"name\":\"Kids' Toys\"},{\"id\":5,\"name\":\"Water Toys\"}]},{\"id\":6,\"name\":\"Everything Else\"},{\"id\":7,\"name\":\"Clothes\",\"sub\":[{\"id\":8,\"name\":\"Leggings\"},{\"id\":9,\"name\":\"Shirts\"}]},{\"id\":10,\"name\":\"Figurines\"}]}");

topBarLoadCallbacks.push(async () => {
  categoryData = await fetch("https://miko-user-img.s3.amazonaws.com/categories.json").then((res) => res.json());
});

topBarLoadCallbacks.push(() => {
  if (searchTerm !== null) {
    document.getElementById("search-bar").value = searchTerm;
  }
});

topBarLoadCallbacks.push(async () => {
  let searchFormData = new FormData();
  searchFormData.append("query", searchTerm);
  searchFormData.append("refresh", "none");
  searchFormData.append("page", 0);
  searchFormData.append("category", searchCat === null ? -1 : parseInt(searchCat));

  searchResults = await (await fetch(`${API_ENDPOINT}/item/search`, {
    method: "post",
    body: searchFormData,
  })).json();

  resultCount = searchResults.length;

  renderSearchResults();
});

function renderSearchResults() {
  // render search results
  const searchResultsOverviewDiv = document.getElementById("search-results-overview");
  if (searchTerm !== null) {
    searchResultsOverviewDiv.textContent = `${separateThousands(resultCount)} results for "${searchTerm}"`;
    if (searchCat !== null) {
      let searchCatDisplay = "Non-Existent Items";
      let searchCatFilters = [];

      let filterHTML = ``;

      for (let i = 0; i < categoryData["categories"].length; i++) {
        if (categoryData["categories"][i]["id"] == searchCat) {
          searchCatDisplay = categoryData["categories"][i]["name"];
          break;
        }
        if (categoryData["categories"][i]["sub"] === undefined) continue;
        for (let i2 = 0; i2 < categoryData["categories"][i]["sub"].length; i2++) {
          if (categoryData["categories"][i]["sub"][i2]["id"] == searchCat) {
            searchCatDisplay = categoryData["categories"][i]["sub"][i2]["name"];
            
            let filters = categoryData["categories"][i]["sub"][i2]["filters"];
            searchCatFilters = filters == null ? [] : filters;
            break;
          }
        }
      }

      for (let i = 0; i < searchCatFilters.length; i++) {
        filterHTML += `<div class="filter-option">
  <input type="checkbox" id="special-filter-value-1">
  <label for="special-filter-value-1">${searchCatFilters[i]}</label>
</div>`;
      }

      if (searchCatFilters.length == 0) {
        filterHTML += `<div class="filter-option">
  <label>No filters for this category.</label>
</div>`;
      }

      let filterContainer = document.createElement("div");
      filterContainer.innerHTML = `<div class="filter">
  <button class="filter-button">
    <span>Product Condition Filters</span>
    <i class="material-icons"></i>
  </button>
  <div class="filter-options">${filterHTML}</div>
</div>`;

      document.querySelector("#filters").appendChild(filterContainer);

      searchResultsOverviewDiv.textContent += ` in ${searchCatDisplay}`;
    }
  } else {
    location.href = "";
    // searchResultsOverviewDiv.textContent = "Enter a search term to get started.";
  }

  for (const filterButton of document.getElementsByClassName("filter-button")) {
    const setFilterInputsTabIndex = () => {
      for (const elem of filterButton.nextElementSibling.querySelectorAll("button, input")) {
        if (filterButton.parentElement.classList.contains("filter-dropdown-expanded")) {
          elem.tabIndex = 0;
        } else {
          elem.tabIndex = -1;
        }
      }
    };

    setFilterInputsTabIndex();

    document.addEventListener("click", (event) => {
      const filterOptionsDivRect = filterButton.nextElementSibling
          .getBoundingClientRect();
      const filterButtonRect = filterButton.getBoundingClientRect();

      if (!mouseEventIsWithinDOMRect(event, filterOptionsDivRect) &&
          !mouseEventIsWithinDOMRect(event, filterButtonRect)) {
        filterButton.parentElement.classList.remove("filter-dropdown-expanded");
        setFilterInputsTabIndex();
      }
    });

    filterButton.addEventListener("click", () => {
      filterButton.parentElement.classList.toggle("filter-dropdown-expanded");
      setFilterInputsTabIndex();
    });

    {
      // // prevent filter options menu from closing when
      // // space key is used to toggle checkbox
      // for (const input of filterButton.nextElementSibling.querySelectorAll("button, input[type='checkbox']")) {
      //   document.addEventListener("keyup", (event) => {
      //     if (document.activeElement === input &&
      //         event.key === " " &&
      //         !filterButton.parentElement.classList.contains("filter-dropdown-expanded")) {
      //       console.log(input);
      //       filterButton.parentElement.classList.add("filter-dropdown-expanded");
      //       setFilterInputsTabIndex();
      //     }
      //   });
      // }
    }
  }

  {
    // for (const filterOptionsDiv of document.getElementsByClassName("filter-options")) {
    //   document.addEventListener("click", (event) => {
    //     const filterOptionsDivRect = filterOptionsDiv.getBoundingClientRect();
    //     const filterButtonRect = filterOptionsDiv.previousElementSibling
    //         .getBoundingClientRect();

    //     if (!mouseEventIsWithinDOMRect(event, filterOptionsDivRect) &&
    //         !mouseEventIsWithinDOMRect(event, filterButtonRect)) {
    //       filterOptionsDiv.parentElement.classList.remove("filter-dropdown-expanded");
    //     }
    //   });
    // }
  }

  const categoryFilterButton = document
      .querySelector("#category-filter .filter-button");
  categoryFilterButton.addEventListener("click", (event) => {
    if (categoryFilterButton.parentElement.classList.contains("filter-dropdown-expanded")) {
      document.getElementById("category-search").focus();
    }
  });

  let resultsHTML = ``;

  if (searchResults.length == 0) {
    resultsHTML = `<div style="width: calc(85vw - 20px); text-align: center; display: block; padding-bottom: 24px;"><h1 style="font-weight: bold; color: grey;">Oh no! No items were found!</h1><p>Try searching using less specific search terms, or remove filters.</p></div>`
  }

  searchResults.forEach((item) => {
    // i know that this is bad practice, but we really don't have time!!!
    resultsHTML += `<div class="listing">
  <div class="listing-info-top">
    <img src="/media/placeholder-profile-picture.jpeg" alt="Seller profile picture" class="profile-picture-small">
    <div class="listing-info-top-text">
      <div class="seller-username">${item.user}</div>
      <div class="listing-age">7 hours ago</div>
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
    <button class="start-chat primary-button"></button>
    <button class="report-button material-icons">outlined_flag</button>
  </div>
</div>`;
  });

  document.querySelector("#search-results").innerHTML = resultsHTML;
}

const categoryOptionsDiv = document.querySelector("#category-filter .filter-options");
for (const category of categoryData.categories) {
  const categoryOptionDiv = document.createElement("div");
  categoryOptionDiv.className = "filter-option";
  categoryOptionDiv.addEventListener("click", () => {
    location.href = location.href.substring(0, location.href.indexOf("&cat") == -1 ? location.href.length : location.href.indexOf("&cat")) + "&cat=" + category.id;
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
      console.log(location.href);
      location.href = location.href.substring(0, location.href.indexOf("&cat") == -1 ? location.href.length : location.href.indexOf("&cat")) + "&cat=" + subcategory.id;
    });

    subcategoriesDiv.append(subcategoryDiv);
  }

  categoryOptionDiv.append(categoryNameSpan, rightArrowIconSpan, subcategoriesDiv);
  categoryOptionsDiv.append(categoryOptionDiv);
}

const categorySearchResultsDiv = document.getElementById("category-search-results");
document.getElementById("category-search").addEventListener("input", (event) => {
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

    const noCategorySearchResultsDiv = document
        .getElementById("no-category-search-results");
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
      console.log(subcategoryMatch);

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
      console.log(categoryMatch);

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
