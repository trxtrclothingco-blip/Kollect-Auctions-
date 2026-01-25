// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ---------- Firebase App ----------
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- DOM Elements ----------
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const body = document.body;

// ---------- Auth State ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (userStatus) userStatus.textContent = `Logged in as ${user.email}`;
    if (logoutButton) logoutButton.style.display = "inline-block";
  } else {
    if (userStatus) userStatus.textContent = "Not logged in";
    if (logoutButton) logoutButton.style.display = "none";
  }
});

// ---------- Logout ----------
window.logoutUser = async () => {
  try {
    await signOut(auth);
    if (userStatus) userStatus.textContent = "Logged out";
    if (logoutButton) logoutButton.style.display = "none";
  } catch (err) {
    console.error("Logout error:", err);
  }
};

// ---------- Burger Menu ----------
window.toggleMenu = () => {
  const navMenu = document.getElementById("navMenu");
  navMenu?.classList.toggle("open"); // matches CSS
};

// ---------- Light/Dark Mode ----------
if (localStorage.getItem("lightMode") === "true") {
  body.classList.add("light-mode");
} else {
  body.classList.remove("light-mode");
}

window.toggleMode = () => {
  const isLight = body.classList.toggle("light-mode");
  localStorage.setItem("lightMode", isLight);
};

// ---------- Login ----------
if (loginForm) {
  const loginMessage = document.createElement("div");
  loginMessage.className = "form-message";
  loginForm.prepend(loginMessage);

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMessage.textContent = "";

    const email = loginForm["login-email"].value.trim();
    const password = loginForm["login-password"].value.trim();

    if (!email || !password) {
      loginMessage.textContent = "Please enter both email and password.";
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginForm.reset();
      loginMessage.style.color = "green";
      loginMessage.textContent = "Login successful! Redirecting…";
      setTimeout(() => window.location.href = "index.html", 1000);
    } catch (err) {
      loginMessage.style.color = "red";
      loginMessage.textContent = err.message;
    }
  });
}

// ---------- Signup ----------
if (signupForm) {
  const signupMessage = document.createElement("div");
  signupMessage.className = "form-message";
  signupForm.prepend(signupMessage);

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    signupMessage.textContent = "";

    const email = signupForm["signup-email"].value.trim();
    const password = signupForm["signup-password"].value.trim();
    const confirmPassword = signupForm["signup-confirm-password"].value.trim();

    if (!email || !password || !confirmPassword) {
      signupMessage.style.color = "red";
      signupMessage.textContent = "Please fill in all required fields.";
      return;
    }

    if (password !== confirmPassword) {
      signupMessage.style.color = "red";
      signupMessage.textContent = "Passwords do not match.";
      return;
    }

    if (password.length < 6) {
      signupMessage.style.color = "red";
      signupMessage.textContent = "Password must be at least 6 characters.";
      return;
    }

    try {
      // Create Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save extra fields to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: signupForm["signup-firstname"].value.trim(),
        lastName: signupForm["signup-lastname"].value.trim(),
        contact: signupForm["signup-contact"].value.trim(),
        address1: signupForm["signup-address1"].value.trim(),
        address2: signupForm["signup-address2"].value.trim(),
        city: signupForm["signup-city"].value.trim(),
        postcode: signupForm["signup-postcode"].value.trim(),
        email: email,
        createdAt: new Date()
      });

      signupForm.reset();
      signupMessage.style.color = "green";
      signupMessage.textContent = "Account created! Redirecting…";
      setTimeout(() => window.location.href = "index.html", 1500);
    } catch (err) {
      signupMessage.style.color = "red";
      signupMessage.textContent = err.message;
    }
  });
}

// ---------- Contact / Other Forms ----------
document.querySelectorAll("form").forEach((form) => {
  if (!["login-form", "signup-form"].includes(form.id)) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Form submitted! Add your Firestore logic here.");
      form.reset();
    });
  }
});
