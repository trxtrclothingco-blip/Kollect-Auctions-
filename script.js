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
    userStatus.textContent = `Logged in as ${user.email}`;
    logoutButton.style.display = "inline-block";
  } else {
    userStatus.textContent = "Not logged in";
    logoutButton.style.display = "none";
  }
});

window.logoutUser = () => {
  signOut(auth).then(() => {
    userStatus.textContent = "Logged out";
    logoutButton.style.display = "none";
  }).catch((error) => console.error("Logout error:", error));
};

// ---------- Burger Menu ----------
window.toggleMenu = () => {
  const menu = document.getElementById("navMenu");
  menu.classList.toggle("show");
};

// ---------- Light/Dark Mode ----------
const modeToggle = document.getElementById("modeToggle");
const body = document.body;

// Load saved mode from localStorage
if (localStorage.getItem("mode") === "dark") {
  body.classList.add("dark-mode");
} else {
  body.classList.remove("dark-mode");
}

window.toggleMode = () => {
  body.classList.toggle("dark-mode");
  if (body.classList.contains("dark-mode")) {
    localStorage.setItem("mode", "dark");
  } else {
    localStorage.setItem("mode", "light");
  }
};

// ---------- Optional: Forms (Contact / Signup / Login) ----------
// You can extend this part for Firebase auth forms
document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formId = form.id;

    if (formId === "contact-form") {
      alert("Contact form submitted! (You can add Firebase Firestore logic here)");
      form.reset();
    }

    // Add signup/login handling if you have forms with IDs like create-account-form, login-form
  });
});
