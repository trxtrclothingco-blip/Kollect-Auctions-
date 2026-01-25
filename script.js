// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { 
  getStorage, ref as storageRef, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// ---------- Firebase App ----------
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ---------- DOM Elements ----------
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const body = document.body;

// ---------- Auth State ----------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    userStatus.textContent = `Logged in as ${user.email}`;
    logoutButton.style.display = "inline-block";

    // Live update dashboard fields if present
    const docRef = doc(db, "users", user.uid);
    const dashFields = [
      "first-name","last-name","user-email","contact",
      "address1","address2","city","postcode","profile-pic"
    ];
    dashFields.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.textContent = ""; // reset placeholders
    });

    try {
      const docSnap = await docRef.get ? await docRef.get() : null;
      if(docSnap && docSnap.exists()){
        const data = docSnap.data();
        if(document.getElementById("first-name")) document.getElementById("first-name").textContent = data.firstName || "—";
        if(document.getElementById("last-name")) document.getElementById("last-name").textContent = data.lastName || "—";
        if(document.getElementById("user-email")) document.getElementById("user-email").textContent = data.email || "—";
        if(document.getElementById("contact")) document.getElementById("contact").textContent = data.contact || "—";
        if(document.getElementById("address1")) document.getElementById("address1").textContent = data.address1 || "—";
        if(document.getElementById("address2")) document.getElementById("address2").textContent = data.address2 || "—";
        if(document.getElementById("city")) document.getElementById("city").textContent = data.city || "—";
        if(document.getElementById("postcode")) document.getElementById("postcode").textContent = data.postcode || "—";
        if(document.getElementById("profile-pic") && data.profilePicUrl) {
          document.getElementById("profile-pic").src = data.profilePicUrl;
        }
      }
    } catch(e) {
      console.error("Error fetching user data:", e);
    }

  } else {
    userStatus.textContent = "Not logged in";
    logoutButton.style.display = "none";
  }
});

// ---------- Logout ----------
window.logoutUser = async () => {
  try {
    await signOut(auth);
    userStatus.textContent = "Logged out";
    logoutButton.style.display = "none";
    window.location.href = "create_account.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
};

// ---------- Burger Menu ----------
window.toggleMenu = () => {
  const navMenu = document.getElementById("navMenu");
  navMenu?.classList.toggle("open");
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
      // Create Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save extra fields to Firestore with default profile picture
      await setDoc(doc(db, "users", user.uid), {
        firstName: signupForm["signup-firstname"].value.trim(),
        lastName: signupForm["signup-lastname"].value.trim(),
        contact: signupForm["signup-contact"].value.trim(),
        address1: signupForm["signup-address1"].value.trim(),
        address2: signupForm["signup-address2"].value.trim(),
        city: signupForm["signup-city"].value.trim(),
        postcode: signupForm["signup-postcode"].value.trim(),
        email: email,
        profilePicUrl: "https://via.placeholder.com/150", // default picture
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

// ---------- Profile Update Function ----------
window.updateProfile = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  const docRef = doc(db, "users", user.uid);

  const firstName = document.getElementById("first-name-input").value.trim();
  const lastName = document.getElementById("last-name-input").value.trim();
  const contact = document.getElementById("contact-input").value.trim();
  const address1 = document.getElementById("address1-input").value.trim();
  const address2 = document.getElementById("address2-input").value.trim();
  const city = document.getElementById("city-input").value.trim();
  const postcode = document.getElementById("postcode-input").value.trim();

  // Profile picture
  const fileInput = document.getElementById("profile-pic-input");
  let profilePicUrl = null;
  if(fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const storageReference = storageRef(storage, `profilePics/${user.uid}`);
    await uploadBytes(storageReference, file);
    profilePicUrl = await getDownloadURL(storageReference);
  }

  try {
    await updateDoc(docRef, {
      firstName, lastName, contact, address1, address2, city, postcode,
      ...(profilePicUrl ? { profilePicUrl } : {})
    });
    alert("Profile updated successfully!");
    location.reload(); // refresh dashboard
  } catch(e) {
    console.error("Profile update failed:", e);
    alert("Profile update failed: " + e.message);
  }
};
