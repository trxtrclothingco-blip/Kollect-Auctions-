// Toggle burger menu
window.toggleMenu = () => {
  const navMenu = document.getElementById("navMenu");
  navMenu?.classList.toggle("open");
};

// Toggle light/dark mode
window.toggleMode = () => {
  const isLight = document.body.classList.toggle("light-mode");
  localStorage.setItem("lightMode", isLight); // saves true/false
};

// Apply saved mode on load
window.addEventListener("load", () => {
  const lightMode = localStorage.getItem("lightMode") === "true";
  if (lightMode) {
    document.body.classList.add("light-mode");
  }
});
