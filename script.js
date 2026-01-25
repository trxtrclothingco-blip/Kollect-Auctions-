// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ---------- Firebase App ----------
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------- User Status ----------
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (userStatus) userStatus.textContent = `Logged in as ${user.email}`;
    if (logoutButton) logoutButton.style.display = "inline-block";
  } else {
    if (userStatus) userStatus.textContent = "Not logged in";
    if (logoutButton) logoutButton.style.display = "none";
  }
});

window.logoutUser = () => {
  signOut(auth)
    .then(() => {
      if (userStatus) userStatus.textContent = "Logged out";
      if (logoutButton) logoutButton.style.display = "none";
    })
    .catch((error) => console.error("Logout error:", error));
};

// ---------- Burger Menu ----------
window.toggleMenu = () => {
  const navMenu = document.getElementById("navMenu");
  navMenu?.classList.toggle("open"); // matches CSS
};

// ---------- Light/Dark Mode ----------
const body = document.body;

// Load saved mode from localStorage
if (localStorage.getItem("lightMode") === "true") {
  body.classList.add("light-mode");
} else {
  body.classList.remove("light-mode");
}

window.toggleMode = () => {
  const isLight = body.classList.toggle("light-mode");
  localStorage.setItem("lightMode", isLight); // saves true/false
};

// ---------- Forms (Optional Firebase or Contact) ----------
document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formId = form.id;

    if (formId === "contact-form") {
      alert("Contact form submitted! (You can add Firebase Firestore logic here)");
      form.reset();
    }

    // Extend for signup/login forms if needed
    // e.g., create-account-form, login-form
  });
});
