const API_ENDPOINT = "https://xdpj2nme28.execute-api.us-east-1.amazonaws.com";

let user = (localStorage.getItem("session") == null) ? null : JSON.parse(atob(localStorage.getItem("session").split(".")[1]));
let notificationsEnabled = (localStorage.getItem("notifications") == null) ? false : true;

function SaferHTML(templateData) {
  var s = templateData[0];
  for (var i = 1; i < arguments.length; i++) {
    var arg = String(arguments[i]);

    // Escape special characters in the substitution.
    s += arg.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Don't escape special characters in the template.
    s += templateData[i];
  }
  return s;
}

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
    .then(async (topBarHtml) => {
      document.body.insertAdjacentHTML("afterbegin", topBarHtml);

      // show logged in vs logged out menu?!
      if (user !== null) {
        [...document.querySelectorAll(".dropdown-for-logged-out")].forEach((elephant) => {
          elephant.style.display = "none";
        });
      }
      else {
        [...document.querySelectorAll(".dropdown-for-login")].forEach((elephant) => {
          elephant.style.display = "none";
        });
      }

      // install username
      (user !== null) ? document.querySelector("#top-bar-username").innerText = user["user"] : document.querySelector("#top-bar-username").innerText = "Anonymous";

      for (const callback of topBarLoadCallbacks) {
        await callback();
      }
    })
    .catch((err) => {
      console.error("Failed to fetch/insert top bar HTML:", err);
    });

for (const likeButton of document.querySelectorAll(".listing .like-button")) {
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
}