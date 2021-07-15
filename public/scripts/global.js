const topBarLoadCallbacks = [
  () => {
    document.getElementById("search-form").addEventListener("submit", (event) => {
      event.preventDefault();
  
      const searchTerm = document.getElementById("search-bar").value;
      window.location.href = `/search.html?searchTerm=${searchTerm}`;
    });
  },
];

fetch("/top-bar.html")
    .then((res) => res.text())
    .then((topBarHtml) => {
      document.body.insertAdjacentHTML("afterbegin", topBarHtml);
      for (const callback of topBarLoadCallbacks) {
        callback();
      }
    })
    .catch((err) => {
      console.error("Failed to fetch/insert top bar HTML:", err);
    });

[...document.querySelectorAll(".listing .like-button")].forEach((likeButton) => {
  for (const elem of [likeButton, likeButton.nextElementSibling]) {
    elem.addEventListener("click", () => {
      likeButton.classList.toggle("liked");
      if (likeButton.classList.contains("liked")) {
        // call API to like
      } else {
        // call API to un-like
      }
    });
  }
});
