// script.js

// ---------- Firebase / Auth Imports ----------
import { auth, db, storage } from "./firebase.js";
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  doc, setDoc 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ---------- DOM Elements ----------
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const body = document.body;
const contactForm = document.getElementById("contact-form");

// ---------- Light/Dark Mode ----------
if (localStorage.getItem("lightMode") === "true") body.classList.add("light-mode");
window.toggleMode = () => {
  const isLight = body.classList.toggle("light-mode");
  localStorage.setItem("lightMode", isLight);
};

// ---------- Burger Menu ----------
window.toggleMenu = () => document.getElementById("navMenu")?.classList.toggle("open");

// ---------- Logout ----------
window.logoutUser = async () => {
  try {
    await signOut(auth);
    window.location.href = "create_account.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
};

// ---------- Auth State ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    userStatus.textContent = `Logged in as ${user.email}`;
    logoutButton.style.display = "inline-block";
  } else {
    userStatus.textContent = "Not logged in";
    logoutButton.style.display = "none";
  }
});

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
      setTimeout(() => window.location.href = "dashboard.html", 1000);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        firstName: signupForm["signup-firstname"].value.trim(),
        lastName: signupForm["signup-lastname"].value.trim(),
        contact: signupForm["signup-contact"].value.trim(),
        address1: signupForm["signup-address1"].value.trim(),
        address2: signupForm["signup-address2"].value.trim(),
        city: signupForm["signup-city"].value.trim(),
        postcode: signupForm["signup-postcode"].value.trim(),
        email: email,
        profilepicurl: "https://via.placeholder.com/150",
        createdAt: new Date()
      });

      signupForm.reset();
      signupMessage.style.color = "green";
      signupMessage.textContent = "Account created! Redirecting…";
      setTimeout(() => window.location.href = "dashboard.html", 1500);
    } catch (err) {
      signupMessage.style.color = "red";
      signupMessage.textContent = err.message;
    }
  });
}

// ---------- Contact Form Submission ----------
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Set timestamp
    document.getElementById("time").value = new Date().toLocaleString();

    // Optional social media URL handling
    const urlInput = contactForm.querySelector('input[name="item_social_url"]');
    if (!urlInput.value.trim()) {
      urlInput.value = ""; // send empty string if not provided
    }

    // Send form via EmailJS
    emailjs.sendForm(
      "service_899s2nl", // replace with your EmailJS service ID
      "template_2sqqyrk", // replace with your EmailJS template ID
      contactForm
    ).then(
      () => {
        alert("Submission sent successfully!");
        contactForm.reset();
      },
      (error) => {
        console.error("EmailJS error:", error);
        alert("Failed to send submission.");
      }
    );
  });
}
