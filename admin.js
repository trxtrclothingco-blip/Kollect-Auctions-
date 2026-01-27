import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ---------- Firebase Auth Admin Login ---------- */
const passwordForm = document.getElementById("password-form");
const passwordScreen = document.getElementById("password-screen");
const adminPanel = document.getElementById("admin-panel");

const ADMIN_EMAIL = "peterjames-barrett@outlook.com";
const ADMIN_UID = "gBrbEobcS5RCG47acE5ySqxO8yB2";

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const passwordInput = document.getElementById("admin-password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, passwordInput);
    if (cred.user.uid !== ADMIN_UID) {
      alert("Not authorised");
      await auth.signOut();
      return;
    }

    passwordScreen.style.display = "none";
    adminPanel.style.display = "block";
    loadItems();
    loadBids();
  } catch (err) {
    alert(err.message);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user && user.uid === ADMIN_UID) {
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

    let collectionName =
      saleType === "private_sales" ? "privatesales" : "listings";

    const data = {
      name: formData.get("item_name"),
      description: formData.get("item_description"),
      price: Number(formData.get("item_price")),
      priceType: formData.get("price_type"),
      saleType,
      createdAt: serverTimestamp()
    };

    const file = formData.get("item_image");
    if (file && file.name) {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("upload_preset", "Profile_pictures");
      uploadForm.append("folder", "itemPics");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/def0sfrxq/image/upload",
        { method: "POST", body: uploadForm }
      );

      const img = await res.json();
      if (!img.secure_url) throw new Error("Image upload failed");
      data.image = img.secure_url;
    }

    const itemId = document.getElementById("item_id").value;

    if (itemId) {
      await updateDoc(doc(db, collectionName, itemId), data);
    } else {
      await addDoc(collection(db, collectionName), data);
    }

    itemForm.reset();
    document.getElementById("item_id").value = "";
    alert("Item saved ✅");

  } catch (err) {
    alert(err.message);
  }
});

/* ---------- Load Items ---------- */
const itemsList = document.getElementById("items-list");

function loadItems() {
  itemsList.innerHTML = "";

  const sections = [
    { title: "PRIVATE SALES", col: "privatesales" },
    { title: "LISTINGS (AUCTIONS / KOLLECT)", col: "listings" }
  ];

  sections.forEach(({ title, col }) => {
    const section = document.createElement("div");
    section.innerHTML = `<h4>${title}</h4>`;
    itemsList.appendChild(section);

    onSnapshot(collection(db, col), snapshot => {
      section.innerHTML = `<h4>${title}</h4>`;

      snapshot.forEach(d => {
        const item = d.data();
        section.innerHTML += `
          <p>${item.name} – £${item.price}</p>
          <button onclick="editItem('${d.id}','${col}')">Edit</button>
          <button onclick="deleteItem('${d.id}','${col}')">Delete</button>
        `;
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
  document.querySelector('[name="sale_type"]').value = d.saleType || "";
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
