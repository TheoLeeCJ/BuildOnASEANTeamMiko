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
