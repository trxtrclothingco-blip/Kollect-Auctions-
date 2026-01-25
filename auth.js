import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const logoutBtn = document.getElementById("logout-button");
  const userStatus = document.getElementById("user-status");

  // -----------------
  // Track auth state
  // -----------------
  onAuthStateChanged(auth, user => {
    if (user) {
      if (userStatus) userStatus.textContent = `Logged in as ${user.email}`;
      if (logoutBtn) logoutBtn.style.display = "block";
    } else {
      if (userStatus) userStatus.textContent = "Not logged in";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
  });

  // -----------------
  // Login
  // -----------------
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value.trim();

      if (!email || !password) return alert("Enter email and password");

      try {
        await signInWithEmailAndPassword(auth, email, password);
        loginForm.reset();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // -----------------
  // Signup
  // -----------------
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = signupForm.email.value.trim();
      const password = signupForm.password.value.trim();

      if (!email || !password) return alert("Enter email and password");
      if (password.length < 6) return alert("Password must be at least 6 characters");

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        signupForm.reset();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // -----------------
  // Logout
  // -----------------
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (err) {
        alert("Failed to log out: " + err.message);
      }
    });
  }
});
