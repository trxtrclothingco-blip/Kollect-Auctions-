// script.js
import { auth, db, storage } from "./firebase.js"; // <-- make sure storage is exported in firebase.js
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  doc, setDoc, updateDoc, onSnapshot, collection, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// ---------- Cloudinary Config ----------
const CLOUD_NAME = "def0sfrxq"; 
const UPLOAD_PRESET = "Profile_pictures"; 

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}

// ---------- Contact Form Upload to Firebase & EmailJS ----------
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const form = this;

    // Set timestamp
    document.getElementById("time").value = new Date().toLocaleString();

    const files = document.getElementById("item_image").files;
    if (!files.length) {
      alert("Please upload at least one image.");
      return;
    }

    try {
      const urls = [];

      // Upload files to Firebase Storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageReference = storageRef(storage, `contact_uploads/${Date.now()}_${file.name}`);
        await uploadBytes(storageReference, file);
        const downloadURL = await getDownloadURL(storageReference);
        urls.push(downloadURL);
      }

      // Add URLs to hidden input for EmailJS
      document.getElementById("file_urls").value = urls.join(", ");

      // Send via EmailJS
      emailjs.sendForm(
        "service_899s2nl",      // Your Service ID
        "template_2sqqyrk",     // Your Template ID
        form
      ).then(
        function() {
          alert("Submission sent successfully!");
          form.reset();
        },
        function(error) {
          alert("FAILED... " + error.text);
        }
      );

    } catch (err) {
      console.error(err);
      alert("Error uploading files: " + err.message);
    }
  });
}

// ---------- DOM Elements ----------
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const body = document.body;

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

// ---------- Login & Signup (unchanged) ----------
if (loginForm) { /* login code here */ }
if (signupForm) { /* signup code here */ }

// ---------- Dashboard / Profile Update (unchanged) ----------
