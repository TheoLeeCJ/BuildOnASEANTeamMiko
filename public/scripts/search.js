const queryParams = new URLSearchParams(window.location.search);
const searchTerm = queryParams.get("searchTerm");

topBarLoadCallbacks.push(() => {
  if (searchTerm !== null) {
    document.getElementById("search-bar").value = searchTerm;
  }
});

const resultCount = 111094800000938311n;
const resultCountString = resultCount.toString();
let resultCountStringFormatted = "";
for (let i = resultCountString.length - 1; i >= 0; i--) {
  resultCountStringFormatted = resultCountString[i] + resultCountStringFormatted;
  if (i !== 0 && (resultCountString.length - i) % 3 === 0) {
    resultCountStringFormatted = "," + resultCountStringFormatted;
  }
}

document.getElementById("search-results-overview").textContent =
    `${resultCountStringFormatted} results for "${searchTerm}"`;

for (const filterButton of document.getElementsByClassName("filter-button")) {
  filterButton.addEventListener("click", () => {
    filterButton.parentElement.classList.toggle("filter-dropdown-expanded");
  });
}
