// ---------- script.js ----------
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, query, orderBy, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ---------- DOM Elements ----------
const body = document.body;
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");
const productsContainer = document.getElementById("products-container");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const contactForm = document.getElementById("contact-form");

// ---------- Burger Menu ----------
window.toggleMenu = () => document.getElementById("navMenu")?.classList.toggle("open");

// ---------- Light/Dark Mode ----------
if(localStorage.getItem("lightMode")==="true") body.classList.add("light-mode");
window.toggleMode = () => {
  const isLight = body.classList.toggle("light-mode");
  localStorage.setItem("lightMode", isLight);
};

// ---------- Logout ----------
window.logoutUser = async () => {
  try {
    await signOut(auth);
    window.location.href = "create_account.html";
  } catch(e) {
    console.error("Logout failed:", e);
  }
};

// ---------- Auth State Listener ----------
onAuthStateChanged(auth, user => {
  if(user){
    if(userStatus) userStatus.textContent = `Logged in as ${user.email}`;
    if(logoutButton) logoutButton.style.display = "inline-block";
  } else {
    if(userStatus) userStatus.textContent = "Not logged in";
    if(logoutButton) logoutButton.style.display = "none";
    // Redirect if on admin/dashboard page
    if(window.location.pathname.includes("dashboard") || window.location.pathname.includes("admin")) {
      window.location.href = "create_account.html";
    }
  }
});

// ---------- Login Form ----------
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    loginForm.reset();
    window.location.href = "index.html"; // Redirect after login
  } catch(err) {
    alert("Login failed: " + err.message);
  }
});

// ---------- Signup Form ----------
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const firstName = document.getElementById("signup-firstname").value;
  const lastName = document.getElementById("signup-lastname").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("signup-confirm-password").value;
  const contact = document.getElementById("signup-contact").value;
  const address1 = document.getElementById("signup-address1").value;
  const address2 = document.getElementById("signup-address2").value;
  const city = document.getElementById("signup-city").value;
  const postcode = document.getElementById("signup-postcode").value;

  if(password !== confirmPassword){
    return alert("Passwords do not match!");
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: `${firstName} ${lastName}` });

    // Save extra user info in Firestore
    await addDoc(collection(db, "users"), {
      uid: user.uid,
      firstName,
      lastName,
      email,
      contact,
      address1,
      address2,
      city,
      postcode,
      createdAt: new Date()
    });

    alert("Account created successfully!");
    signupForm.reset();
    window.location.href = "index.html"; // Redirect after signup
  } catch(err) {
    alert("Signup failed: " + err.message);
  }
});

// ---------- Dynamic Products ----------
if(productsContainer){
  const page = body.dataset.page;
  let collectionName;
  if(page==="private_sales") collectionName="private_sales";
  else if(page==="live_auctions") collectionName="live_auctions";
  else if(page==="kollect_100") collectionName="kollect_100";

  if(collectionName){
    const q = query(collection(db, collectionName), orderBy("createdAt","desc"));
    onSnapshot(q, snapshot => {
      productsContainer.innerHTML = "";
      if(snapshot.empty){
        productsContainer.innerHTML = "<p>No items available yet.</p>";
        return;
      }

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const card = document.createElement("div");
        card.classList.add("card");
        const priceLabel = data.priceType === "auction"
          ? `Current Bid: £${data.price}`
          : `Price: £${data.price}`;
        card.innerHTML = `
          <img src="${data.image}" alt="${data.name}">
          <h3>${data.name}</h3>
          <p>${data.description}</p>
          <p>${priceLabel}</p>
          ${data.priceType === "auction" 
            ? `<button class="button">Bid</button>` 
            : `<button class="button">Buy Now</button>`}
        `;
        productsContainer.appendChild(card);
      });
    });
  }
}

// ---------- Contact Form EmailJS ----------
if(contactForm){
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const dataObj = {};
    formData.forEach((value, key) => dataObj[key] = value);

    try {
      await emailjs.send(
        "service_899s2nl",
        "template_2sqqyrk",
        dataObj,
        "Fx2CfwymZU9f86Gfl"
      );
      alert("Message sent successfully!");
      contactForm.reset();
    } catch(err){
      console.error(err);
      alert("Failed to send message, please try again.");
    }
  });
}
