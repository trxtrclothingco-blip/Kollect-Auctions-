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

  onAuthStateChanged(auth, user => {
    if (user) {
      if (userStatus) userStatus.textContent = `Logged in as ${user.email}`;
      if (logoutBtn) logoutBtn.style.display = "block";
    } else {
      if (userStatus) userStatus.textContent = "Not logged in";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
  });

  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      signInWithEmailAndPassword(
        auth,
        loginForm.email.value,
        loginForm.password.value
      ).catch(err => alert(err.message));
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", e => {
      e.preventDefault();
      createUserWithEmailAndPassword(
        auth,
        signupForm.email.value,
        signupForm.password.value
      ).catch(err => alert(err.message));
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => signOut(auth));
  }
});
