const profileTabSwitchers = document.getElementsByClassName("profile-tab-switcher");
for (const profileTabSwitcher of profileTabSwitchers) {
  profileTabSwitcher.addEventListener("click", () => {
    for (const otherProfileTabSwitcher of profileTabSwitchers) {
      if (otherProfileTabSwitcher === profileTabSwitcher) {
        otherProfileTabSwitcher.classList.add("profile-tab-switcher-selected");
      } else {
        otherProfileTabSwitcher.classList.remove("profile-tab-switcher-selected");
      }
    }
  });
}
