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
  filterButton.addEventListener("click", () => {
    filterButton.parentElement.classList.toggle("filter-dropdown-expanded");
    if (filterButton.parentElement.classList.contains("filter-dropdown-expanded")) {
      setTimeout(() => {
        filterButton.nextElementSibling.style.display = "block";
      }, 200);
    } else {
      setTimeout(() => {
        filterButton.nextElementSibling.style.display = "none";
      }, 200);
    }
  });
}

for (const filterOptionsDiv of document.getElementsByClassName("filter-options")) {
  document.addEventListener("click", (event) => {
    const filterOptionsDivRect = filterOptionsDiv.getBoundingClientRect();
    const filterButtonRect = filterOptionsDiv.previousElementSibling
        .getBoundingClientRect();

    if (!mouseEventIsWithinDOMRect(event, filterOptionsDivRect) &&
        !mouseEventIsWithinDOMRect(event, filterButtonRect)) {
      filterOptionsDiv.parentElement.classList.remove("filter-dropdown-expanded");
    }
  });
}
