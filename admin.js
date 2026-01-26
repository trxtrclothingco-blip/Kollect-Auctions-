import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ---------- Firebase Auth Admin Login ---------- */
const passwordForm = document.getElementById("password-form");
const passwordScreen = document.getElementById("password-screen");
const adminPanel = document.getElementById("admin-panel");

const ADMIN_EMAIL = "peterjames-barrett@outlook.com";

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const emailInput = ADMIN_EMAIL; // fixed admin email
  const passwordInput = document.getElementById("admin-password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    // Ensure only the correct UID can access
    if (userCredential.user.uid !== "gBrbEobcS5RCG47acE5ySqxO8yB2") {
      alert("You are not authorized to access this panel.");
      await auth.signOut();
      return;
    }

    passwordScreen.style.display = "none";
    adminPanel.style.display = "block";
    loadItems();
    loadBids();

  } catch (err) {
    console.error(err);
    alert("Login failed: " + err.message);
  }
});

/* ---------- Persist login ---------- */
onAuthStateChanged(auth, (user) => {
  if (user && user.uid === "gBrbEobcS5RCG47acE5ySqxO8yB2") {
    passwordScreen.style.display = "none";
    adminPanel.style.display = "block";
    loadItems();
    loadBids();
  }
});

/* ---------- Add / Update Item ---------- */
const itemForm = document.getElementById("item-form");

itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData(itemForm);
    const saleType = formData.get("sale_type");
    if (!saleType) return alert("Select sale type");

    const data = {
      name: formData.get("item_name"),
      description: formData.get("item_description"),
      price: Number(formData.get("item_price")),
      priceType: formData.get("price_type"),
      createdAt: new Date()
    };

    const file = formData.get("item_image");
    if (file && file.name) {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("upload_preset", "Profile_pictures");
      uploadForm.append("folder", "itemPics");

      const cloudName = "def0sfrxq";
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: uploadForm }
      );
      const img = await res.json();
      if (!img.secure_url) throw new Error("Image upload failed");
      data.image = img.secure_url;
    }

    const itemId = document.getElementById("item_id").value;
    if (itemId) {
      await updateDoc(doc(db, saleType, itemId), data);
    } else {
      await addDoc(collection(db, saleType), data);
    }

    itemForm.reset();
    document.getElementById("item_id").value = "";
    alert("Item saved ✅");

  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
});

/* ---------- Load Items ---------- */
const itemsList = document.getElementById("items-list");

function loadItems() {
  const collections = ["private_sales", "live_auctions", "kollect_100"];
  itemsList.innerHTML = "";

  collections.forEach(col => {
    const section = document.createElement("div");
    section.innerHTML = `<h4>${col.replace("_"," ").toUpperCase()}</h4>`;
    itemsList.appendChild(section);

    onSnapshot(collection(db, col), snapshot => {
      section.innerHTML = `<h4>${col.replace("_"," ").toUpperCase()}</h4>`;
      snapshot.forEach(d => {
        const item = d.data();
        const div = document.createElement("div");
        div.innerHTML = `
          <p>${item.name} – £${item.price}</p>
          <button onclick="editItem('${d.id}','${col}')">Edit</button>
          <button onclick="deleteItem('${d.id}','${col}')">Delete</button>
        `;
        section.appendChild(div);
      });
    });
  });
}

/* ---------- Edit / Delete ---------- */
window.editItem = async (id, col) => {
  const snap = await getDoc(doc(db, col, id));
  if (!snap.exists()) return;

  const d = snap.data();
  document.querySelector('[name="item_name"]').value = d.name || "";
  document.querySelector('[name="item_description"]').value = d.description || "";
  document.querySelector('[name="item_price"]').value = d.price || "";
  document.querySelector('[name="price_type"]').value = d.priceType || "fixed";
  document.querySelector('[name="sale_type"]').value = col;
  document.getElementById("item_id").value = id;
};

window.deleteItem = async (id, col) => {
  if (!confirm("Delete this item?")) return;
  await deleteDoc(doc(db, col, id));
  alert("Deleted");
};

/* ---------- Load Bids ---------- */
function loadBids() {
  const bidsList = document.getElementById("bids-list");
  bidsList.innerHTML = "";

  onSnapshot(collection(db, "bids"), snapshot => {
    bidsList.innerHTML = "";
    snapshot.forEach(d => {
      const b = d.data();
      bidsList.innerHTML += `
        <p>${b.itemName} – £${b.bidAmount} (${b.userEmail || "Unknown"})</p>
      `;
    });
  });
}
