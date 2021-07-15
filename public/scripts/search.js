topBarLoadCallbacks.push(() => {
  const queryParams = new URLSearchParams(window.location.search);
  const searchTerm = queryParams.get("searchTerm");
  if (searchTerm !== null) {
    document.getElementById("search-bar").value = searchTerm;
  }
});
