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
