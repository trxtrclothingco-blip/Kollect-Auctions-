// script.js
import { auth, db, storage } from "./firebase.js";
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  doc, setDoc, updateDoc, getDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { 
  ref as storageRef, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// ---------- DOM Elements ----------
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const body = document.body;

// ---------- Profile Inputs ----------
const profileInputs = {
  firstName: document.getElementById("first-name-input"),
  lastName: document.getElementById("last-name-input"),
  contact: document.getElementById("contact-input"),
  address1: document.getElementById("address1-input"),
  address2: document.getElementById("address2-input"),
  city: document.getElementById("city-input"),
  postcode: document.getElementById("postcode-input")
};
const profilePicEl = document.getElementById("profile-pic");
const profileUpload = document.getElementById("profile-upload");
const editBtn = document.getElementById("edit-btn");
const saveBtn = document.getElementById("save-btn");
const welcomeNameEl = document.getElementById("welcome-name");
const bidsContainer = document.getElementById("bids-container");

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

// ---------- Auth & Dashboard ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    userStatus.textContent = "Not logged in";
    logoutButton.style.display = "none";
    if (window.location.pathname.includes("dashboard")) window.location.href = "create_account.html";
    return;
  }

  // Set user status
  userStatus.textContent = `Logged in as ${user.email}`;
  logoutButton.style.display = "inline-block";

  const docRef = doc(db, "users", user.uid);

  // ---------- Load Profile Data ----------
  onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();

    // Populate profile form
    profileInputs.firstName.value = data.firstName || "";
    profileInputs.lastName.value = data.lastName || "";
    profileInputs.contact.value = data.contact || "";
    profileInputs.address1.value = data.address1 || "";
    profileInputs.address2.value = data.address2 || "";
    profileInputs.city.value = data.city || "";
    profileInputs.postcode.value = data.postcode || "";
    if (data.profilePicUrl) profilePicEl.src = data.profilePicUrl;

    // Update Welcome name (not editable)
    if (welcomeNameEl) welcomeNameEl.textContent = data.firstName || "";
  });

  // ---------- Profile Editing ----------
  if (editBtn && saveBtn) {
    Object.values(profileInputs).forEach(i => i.setAttribute("readonly", ""));
    profileUpload.style.display = "none";
    saveBtn.style.display = "none";

    editBtn.addEventListener("click", () => {
      Object.values(profileInputs).forEach(i => i.removeAttribute("readonly"));
      profileUpload.style.display = "block";
      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
    });

    saveBtn.addEventListener("click", async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return alert("Not logged in");

      let profilePicUrl = profilePicEl.src;

      // Upload new image if selected
      if (profileUpload.files.length > 0) {
        const file = profileUpload.files[0];
        const storageReference = storageRef(storage, `profilePics/${currentUser.uid}`);
        await uploadBytes(storageReference, file);
        profilePicUrl = await getDownloadURL(storageReference);
        profilePicEl.src = profilePicUrl;
      }

      // Save updated data
      await updateDoc(docRef, {
        firstName: profileInputs.firstName.value.trim(),
        lastName: profileInputs.lastName.value.trim(),
        contact: profileInputs.contact.value.trim(),
        address1: profileInputs.address1.value.trim(),
        address2: profileInputs.address2.value.trim(),
        city: profileInputs.city.value.trim(),
        postcode: profileInputs.postcode.value.trim(),
        profilePicUrl
      });

      // Update welcome name
      if (welcomeNameEl) welcomeNameEl.textContent = profileInputs.firstName.value.trim();

      // Reset form state
      Object.values(profileInputs).forEach(i => i.setAttribute("readonly", ""));
      profileUpload.style.display = "none";
      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
      alert("Profile updated successfully!");
    });

    // Live preview for new profile picture
    profileUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) profilePicEl.src = URL.createObjectURL(file);
    });
  }

  // ---------- My Bids Live Update ----------
  const { collection, query, where, orderBy, onSnapshot } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");
  const bidsQuery = query(collection(db, "bids"), where("userId", "==", user.uid), orderBy("bidAmount", "desc"));
  onSnapshot(bidsQuery, (snapshot) => {
    bidsContainer.innerHTML = "<h2>My Bids</h2>";
    if (snapshot.empty) {
      bidsContainer.innerHTML += "<p>No active bids yet.</p>";
      return;
    }
    snapshot.forEach(doc => {
      const bid = doc.data();
      const bidEl = document.createElement("div");
      bidEl.className = "bid-card";
      const itemLink = document.createElement("a");
      itemLink.href = `item.html?id=${bid.itemId}`;
      itemLink.textContent = `${bid.itemName} – £${bid.bidAmount}`;
      if (bid.outbid) itemLink.innerHTML += " <span style='color:red;'>(Outbid!)</span>";
      bidEl.appendChild(itemLink);
      bidsContainer.appendChild(bidEl);
    });
  });
});
