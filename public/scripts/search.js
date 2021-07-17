const queryParams = new URLSearchParams(window.location.search);
const searchTerm = queryParams.get("searchTerm");

topBarLoadCallbacks.push(() => {
  if (searchTerm !== null) {
    document.getElementById("search-bar").value = searchTerm;
  }
});

const resultCount = 111094800000938311n;
document.getElementById("search-results-overview").textContent =
    `${separateThousands(resultCount)} results for "${searchTerm}"`;

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

const categoryFilterButton = document
    .querySelector("#category-filter .filter-button");
categoryFilterButton.addEventListener("click", (event) => {
  if (categoryFilterButton.parentElement.classList.contains("filter-dropdown-expanded")) {
    document.getElementById("category-search").focus();
  }
});

// const categoryData = await fetch("https://miko-user-img.s3.amazonaws.com/categories.json")
//     .then((res) => res.json());
const categoryData = {
  "largest": 6,
  "categories": [
    {
      "id": 0,
      "name": "Cat 1",
      "sub": [
        { "id": 1, "name": "Cat 1 Sub 1" },
        { "id": 4, "name": "Cat 1 Sub 2" },
        { "id": 5, "name": "Cat 1 Sub 3" },
      ],
    },
    {
      "id": 2,
      "name": "Cat 2",
      "sub": [
        { "id": 3, "name": "Cat 2 Sub 1" },
        { "id": 6, "name": "Cat 2 Sub 2" },
      ],
    },
  ],
};

const categoryOptionsDiv = document.querySelector("#category-filter .filter-options");
for (const category of categoryData.categories) {
  const categoryOptionDiv = document.createElement("div");
  categoryOptionDiv.className = "filter-option";

  const categoryNameSpan = document.createElement("span");
  categoryNameSpan.className = "category-name";
  categoryNameSpan.textContent = category.name;

  const rightArrowIconSpan = document.createElement("span");
  rightArrowIconSpan.className = "material-icons";
  rightArrowIconSpan.textContent = "chevron_right";

  const subcategoriesDiv = document.createElement("div");
  subcategoriesDiv.className = "subcategories";
  for (const subcategory of category.sub) {
    const subcategoryDiv = document.createElement("div");
    subcategoryDiv.textContent = subcategory.name;

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

      const subcategorySearchResultDiv = document.createElement("div");
      subcategorySearchResultDiv.className = "category-search-result";
      // subcategorySearchResultDiv.addEventListener("click", () => {
      //   window.location.href = subcategoryUrl;
      // });
      
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
      // categorySearchResultDiv.addEventListener("click", () => {
      //   window.location.href = categoryUrl;
      // });

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
