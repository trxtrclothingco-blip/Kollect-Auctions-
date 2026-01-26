import { db } from "./firebase.js";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ---------- Cloudinary Config ----------
const CLOUD_NAME = "def0sfrxq"; // your Cloudinary cloud name
const UPLOAD_PRESET = "Profile_pictures"; // your unsigned upload preset

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url; // this is the uploaded image URL
}

// ---------- Password Protection ----------
const PASSWORD = "@PJL2025";
const passwordScreen = document.getElementById("password-screen");
const passwordForm = document.getElementById("password-form");
const adminPanel = document.getElementById("admin-panel");

passwordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = document.getElementById("admin-password").value;
  if(val === PASSWORD){
    passwordScreen.style.display = "none";
    adminPanel.style.display = "block";
    loadItems();
    loadBids();
  } else {
    alert("Incorrect password");
  }
});

// ---------- Add Item ----------
const itemForm = document.getElementById("item-form");

itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(itemForm);
  const file = formData.get("item_image");

  // Upload to Cloudinary
  const imageUrl = await uploadToCloudinary(file);

  // Add item to Firestore collection based on sale type
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

  alert("Item added successfully!");
  itemForm.reset();
});

// ---------- Load Items for Management ----------
const itemsList = document.getElementById("items-list");

function loadItems(){
  const collections = ["private_sales","live_auctions","kollect_100"];
  itemsList.innerHTML = "";
  collections.forEach(col => {
    const q = query(collection(db, col), orderBy("createdAt","desc"));
    onSnapshot(q, (snapshot) => {
      const header = document.createElement("h4");
      header.textContent = col.replace("_"," ");
      itemsList.appendChild(header);

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("item-card");
        itemDiv.innerHTML = `
          <img src="${data.image}" style="width:100px;height:100px;">
          <p><strong>${data.name}</strong></p>
          <p>${data.description}</p>
          <p>Price: £${data.price} (${data.priceType})</p>
          <button data-id="${docSnap.id}" data-collection="${col}" class="delete-item">Delete</button>
        `;
        itemsList.appendChild(itemDiv);
      });

      // Delete functionality
      document.querySelectorAll(".delete-item").forEach(btn => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          const collectionName = btn.dataset.collection;
          await deleteDoc(doc(db, collectionName, id));
          alert("Item deleted");
        };
      });
    });
  });
}

// ---------- Load Bids ----------
const bidsList = document.getElementById("bids-list");

function loadBids(){
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
