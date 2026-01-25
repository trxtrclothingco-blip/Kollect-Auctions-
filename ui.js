window.toggleMenu = () => {
  document.getElementById("navMenu")?.classList.toggle("open");
};

window.toggleMode = () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem(
    "lightMode",
    document.body.classList.contains("light-mode")
  );
};

window.addEventListener("load", () => {
  if (localStorage.getItem("lightMode") === "true") {
    document.body.classList.add("light-mode");
  }
});
