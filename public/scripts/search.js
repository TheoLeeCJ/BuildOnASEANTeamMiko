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
