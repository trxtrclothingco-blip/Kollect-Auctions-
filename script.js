import { db, auth } from "./firebase.js";
import { 
  collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { 
  onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ---------- Cloudinary Config ----------
const CLOUD_NAME = "def0sfrxq"; // your Cloudinary cloud name
const UPLOAD_PRESET = "Profile_pictures"; // your unsigned upload preset

async function uploadToCloudinary(file) {
  if(!file) return null;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url; // uploaded image URL
}

// ---------- Auth & User Status ----------
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");

onAuthStateChanged(auth, (user) => {
  if(user){
    userStatus.textContent = `Logged in as ${user.email}`;
    if(logoutButton) logoutButton.style.display = "inline-block";
  } else {
    userStatus.textContent = `Not logged in`;
    if(logoutButton) logoutButton.style.display = "none";
  }
});

window.logoutUser = async () => {
  try {
    await signOut(auth);
    window.location.href = "create_account.html";
  } catch(e) {
    console.error("Logout failed:", e);
  }
};

// ---------- Admin Password Protection ----------
const PASSWORD = "@PJL2025";
const passwordScreen = document.getElementById("password-screen");
const passwordForm = document.getElementById("password-form");
const adminPanel = document.getElementById("admin-panel");

if(passwordForm){
  passwordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = document.getElementById("admin-password").value;
    if(val === PASSWORD){
      if(passwordScreen) passwordScreen.style.display = "none";
      if(adminPanel) adminPanel.style.display = "block";
      loadItems();
      loadBids();
    } else {
      alert("Incorrect password");
    }
  });
}

// ---------- Add Item ----------
const itemForm = document.getElementById("item-form");
if(itemForm){
  itemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(itemForm);
    const file = formData.get("item_image");
    const imageUrl = await uploadToCloudinary(file);
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
}

// ---------- Load Items for Admin ----------
const itemsList = document.getElementById("items-list");
function loadItems(){
  if(!itemsList) return;
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

      // Delete buttons
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
  if(!bidsList) return;
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

// ---------- Dynamic Product Pages ----------
const productsContainer = document.getElementById("products-container");
if(productsContainer){
  let collectionName;
  const page = document.body.dataset.page; // <body data-page="kollect_100">
  if(page === "private_sales") collectionName = "private_sales";
  else if(page === "live_auctions") collectionName = "live_auctions";
  else if(page === "kollect_100") collectionName = "kollect_100";

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
        card.classList.add("product-card");
        let priceText = data.priceType === "auction" ? `Current Bid: £${data.price}` : `Price: £${data.price}`;
        card.innerHTML = `
          <img src="${data.image}" alt="${data.name}" />
          <h3>${data.name}</h3>
          <p>${data.description}</p>
          <p>${priceText}</p>
        `;
        productsContainer.appendChild(card);
      });
    });
  }
}
