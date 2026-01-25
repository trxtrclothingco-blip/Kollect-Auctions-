// script.js
import { auth, db, storage } from "./firebase.js";
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  doc, setDoc, updateDoc, onSnapshot, collection, query, where, orderBy 
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

// ---------- Dashboard ----------
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

if (profilePicEl && editBtn && saveBtn && welcomeNameEl) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "create_account.html";
      return;
    }

    const docRef = doc(db, "users", user.uid);

    // Load profile
    onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      profileInputs.firstName.value = data.firstName || "";
      profileInputs.lastName.value = data.lastName || "";
      profileInputs.contact.value = data.contact || "";
      profileInputs.address1.value = data.address1 || "";
      profileInputs.address2.value = data.address2 || "";
      profileInputs.city.value = data.city || "";
      profileInputs.postcode.value = data.postcode || "";
      if (data.profilepicurl) profilePicEl.src = data.profilepicurl;

      welcomeNameEl.textContent = data.firstName || "";
    });

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
      let profilepicurl = profilePicEl.src;

      if (profileUpload.files.length > 0) {
        const file = profileUpload.files[0];
        const storageReference = storageRef(storage, `profilePics/${user.uid}`);
        await uploadBytes(storageReference, file);
        profilepicurl = await getDownloadURL(storageReference);
        profilePicEl.src = profilepicurl;
      }

      await updateDoc(docRef, {
        firstName: profileInputs.firstName.value.trim(),
        lastName: profileInputs.lastName.value.trim(),
        contact: profileInputs.contact.value.trim(),
        address1: profileInputs.address1.value.trim(),
        address2: profileInputs.address2.value.trim(),
        city: profileInputs.city.value.trim(),
        postcode: profileInputs.postcode.value.trim(),
        profilepicurl
      });

      welcomeNameEl.textContent = profileInputs.firstName.value.trim();

      Object.values(profileInputs).forEach(i => i.setAttribute("readonly", ""));
      profileUpload.style.display = "none";
      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
      alert("Profile updated successfully!");
    });

    profileUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) profilePicEl.src = URL.createObjectURL(file);
    });

    // Load bids
    const bidsQuery = query(
      collection(db, "bids"),
      where("userId", "==", user.uid),
      orderBy("bidAmount", "desc")
    );

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

        if (bid.outbid) {
          itemLink.innerHTML += " <span style='color:red;'>(Outbid!)</span>";
        }

        bidEl.appendChild(itemLink);
        bidsContainer.appendChild(bidEl);
      });
    });
  });
}
