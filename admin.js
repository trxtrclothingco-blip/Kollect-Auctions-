import { db, auth, storage } from "./firebase.js";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ---------- Admin Auth ----------
const adminEmail = "admin@yourdomain.com"; // replace with your admin email
const adminPassword = "yourStrongAdminPassword"; // replace with secure password
const passwordScreen = document.getElementById("password-screen");
const passwordForm = document.getElementById("password-form");
const adminPanel = document.getElementById("admin-panel");

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const emailInput = document.getElementById("admin-email").value;
  const passwordInput = document.getElementById("admin-password").value;

  try {
    await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    passwordScreen.style.display = "none";
    adminPanel.style.display = "block";
    loadItems();
    loadBids();
  } catch (error) {
    alert("Login failed: " + error.message);
  }
});

// ---------- Add Item ----------
const itemForm = document.getElementById("item-form");
itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(itemForm);
  const file = formData.get("item_image");
  if(!file) return alert("Select an image");

  // Upload to Firebase Storage
  const storageRef = ref(storage, `items/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(snapshot.ref);

  const saleType = formData.get("sale_type");
  const priceType = formData.get("price_type");

  await addDoc(collection(db, saleType), {
    name: formData.get("item_name"),
    description: formData.get("item_description"),
    price: parseFloat(formData.get("item_price")),
    priceType,
    image: imageUrl,
    createdAt: new Date()
  });

  alert("Item added!");
  itemForm.reset();
});

// ---------- Load Items ----------
const itemsList = document.getElementById("items-list");
function loadItems() {
  const collections = ["private_sales","live_auctions","kollect_100"];
  itemsList.innerHTML = "";
  collections.forEach(col => {
    const q = query(collection(db, col), orderBy("createdAt","desc"));
    onSnapshot(q, snapshot => {
      if(snapshot.docs.length){
        const header = document.createElement("h4");
        header.textContent = col.replace("_"," ");
        itemsList.appendChild(header);
      }
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.classList.add("item-card");
        div.innerHTML = `
          <img src="${data.image}" style="width:100px;height:100px;">
          <p><strong>${data.name}</strong></p>
          <p>${data.description}</p>
          <p>Price: £${data.price} (${data.priceType})</p>
          <button data-id="${docSnap.id}" data-collection="${col}" class="delete-item">Delete</button>
        `;
        itemsList.appendChild(div);
      });

      document.querySelectorAll(".delete-item").forEach(btn => {
        btn.onclick = async () => {
          await deleteDoc(doc(db, btn.dataset.collection, btn.dataset.id));
          alert("Deleted");
        };
      });
    });
  });
}

// ---------- Load Bids ----------
const bidsList = document.getElementById("bids-list");
function loadBids() {
  const bidCollections = ["private_sales_bids","live_auctions_bids","kollect_100_bids"];
  bidsList.innerHTML = "";
  bidCollections.forEach(col => {
    const q = query(collection(db, col), orderBy("bidAmount","desc"));
    onSnapshot(q, snapshot => {
      snapshot.docs.forEach(docSnap => {
        const bid = docSnap.data();
        const div = document.createElement("div");
        div.innerHTML = `<p>Item: ${bid.itemName} | Bidder: ${bid.bidder} | Amount: £${bid.bidAmount}</p>`;
        bidsList.appendChild(div);
      });
    });
  });
}
