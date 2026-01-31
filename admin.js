import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  query,
  orderBy
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
    loadEndedAuctions();
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
    loadEndedAuctions();
  }
});

/* ---------- AUCTION FIELD TOGGLE ---------- */
const saleTypeSelect = document.getElementById("sale_type");
const auctionFields = document.getElementById("auction-fields");
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard – Kollect Auctions</title>
<link rel="stylesheet" href="style.css">

<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, collection, query, where, orderBy, getDoc, getDocs, limit } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase.js";

// ---------- Firebase Initialization ----------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- DOM Elements ----------
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");
const body = document.body;
const editBtn = document.getElementById("edit-btn");
const saveBtn = document.getElementById("save-btn");
const profilePicEl = document.getElementById("profile-pic");
const profileUpload = document.getElementById("profile-upload");
const liveBidsContainer = document.getElementById("live-bids-container");
const wonBidsContainer = document.getElementById("won-bids-container");
const salesContainer = document.getElementById("purchase-history-container");
const welcomeName = document.getElementById("welcome-name");

// Updated input IDs
const fields = ["first-name-input","last-name-input","email-input","contact-input","address1-input","address2-input","city-input","postcode-input"];
const inputs = fields.map(f => document.getElementById(f));

// ---------- Burger Menu & Light/Dark Mode ----------
window.toggleMenu = () => document.getElementById("navMenu")?.classList.toggle("open");
if(localStorage.getItem("lightMode")==="true") body.classList.add("light-mode");
window.toggleMode = () => {
  const isLight = body.classList.toggle("light-mode");
  localStorage.setItem("lightMode", isLight);
};

if (saleTypeSelect && auctionFields) {
  saleTypeSelect.addEventListener("change", () => {
    auctionFields.style.display =
      saleTypeSelect.value === "live_auctions" ? "block" : "none";
  });
}
// ---------- Logout ----------
window.logoutUser = async () => {
  try { 
    await signOut(auth); 
    window.location.href = "create_account.html";
  } catch(e) { console.error("Logout failed:", e); }
};

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
      pricetype: formData.get("price_type"),
      saletype: saleType,
      createdat: serverTimestamp()
    };

    if (saleType === "live_auctions") {
      const auctionStart = formData.get("auctionstart");
      const auctionEnd = formData.get("auctionend");

      data.auctionstart = auctionStart ? new Date(auctionStart) : null;
      data.auctionend = auctionEnd ? new Date(auctionEnd) : null;
      data.status = "live";
      data.winnerid = null;
      data.winningbid = null;
      data.endedat = auctionEnd ? new Date(auctionEnd) : null;
    }
// ---------- Helper: format price ----------
const formatPrice = (price) => {
  if(!price && price !== 0) return "£0";
  return "£" + Number(price).toLocaleString();
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
// ---------- Auth & Dashboard ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "create_account.html";

  userStatus.textContent = `Logged in as ${user.email}`;
  logoutButton.style.display = "inline-block";

  const docRef = doc(db, "users", user.uid);

  // ---------- Load profile info ----------
  onSnapshot(docRef, (docSnap) => {
    if(docSnap.exists()){
      const data = docSnap.data();
      document.getElementById("first-name-input").value = data.firstName || "";
      document.getElementById("last-name-input").value = data.lastName || "";
      document.getElementById("email-input").value = data.email || "";
      document.getElementById("contact-input").value = data.contact || "";
      document.getElementById("address1-input").value = data.address1 || "";
      document.getElementById("address2-input").value = data.address2 || "";
      document.getElementById("city-input").value = data.city || "";
      document.getElementById("postcode-input").value = data.postcode || "";
      welcomeName.textContent = data.firstName || "User";
      if(data.profilepicurl) profilePicEl.src = data.profilepicurl;
    }
  });

    const itemId = document.getElementById("item_id").value;
  // ---------- Enable editing ----------
  editBtn.addEventListener("click", () => {
    inputs.forEach(i => i.removeAttribute("readonly"));
    profileUpload.style.display = "block";
    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
  });

    if (itemId) {
      await updateDoc(doc(db, collectionName, itemId), data);
    } else {
      await addDoc(collection(db, collectionName), data);
  // ---------- Save changes ----------
  saveBtn.addEventListener("click", async () => {
    let profilepicurl = profilePicEl.src;

    if(profileUpload.files.length > 0){
      const file = profileUpload.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "Profile_pictures"); 
      formData.append("folder", "profilePics");

      const cloudName = "def0sfrxq";
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();
      profilepicurl = data.secure_url;
      profilePicEl.src = profilepicurl;
    }

    itemForm.reset();
    document.getElementById("item_id").value = "";
    auctionFields.style.display = "none";
    alert("Item saved ✅");

  } catch (err) {
    alert(err.message);
  }
});

/* ---------- Load Items ---------- */
const itemsList = document.getElementById("items-list");
    await updateDoc(docRef, {
      firstName: document.getElementById("first-name-input").value.trim(),
      lastName: document.getElementById("last-name-input").value.trim(),
      email: document.getElementById("email-input").value.trim(),
      contact: document.getElementById("contact-input").value.trim(),
      address1: document.getElementById("address1-input").value.trim(),
      address2: document.getElementById("address2-input").value.trim(),
      city: document.getElementById("city-input").value.trim(),
      postcode: document.getElementById("postcode-input").value.trim(),
      profilepicurl
    });

function loadItems() {
  itemsList.innerHTML = "";
    inputs.forEach(i => i.setAttribute("readonly",""));
    profileUpload.style.display = "none";
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";

  const sections = [
    { title: "PRIVATE SALES", col: "privatesales" },
    { title: "LISTINGS (AUCTIONS / KOLLECT)", col: "listings" }
  ];
    welcomeName.textContent = document.getElementById("first-name-input").value.trim() || "User";
    alert("Profile updated!");
  });

  sections.forEach(({ title, col }) => {
    const section = document.createElement("div");
    section.innerHTML = `<h4>${title}</h4>`;
    itemsList.appendChild(section);
  // ---------- Profile picture preview ----------
  profileUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if(file) profilePicEl.src = URL.createObjectURL(file);
  });

    onSnapshot(collection(db, col), snapshot => {
      section.innerHTML = `<h4>${title}</h4>`;
  // ---------- Live Bids Live Update ----------
  let allLiveBids = [];
  let livePage = 1;
  const bidsPerPage = 10;

      snapshot.forEach(d => {
        const item = d.data();
        section.innerHTML += `
          <p>${item.name} – £${item.price}</p>
          <button onclick="editItem('${d.id}','${col}')">Edit</button>
          <button onclick="deleteItem('${d.id}','${col}')">Delete</button>
        `;
      });
  function renderLiveBidsPage(page) {
    if (!liveBidsContainer) return;
    liveBidsContainer.innerHTML = "<h2>Live Bids</h2>";
    if (!allLiveBids.length) {
      liveBidsContainer.innerHTML += "<p>No live bids yet.</p>";
      return;
    }
    const start = (page - 1) * bidsPerPage;
    const end = start + bidsPerPage;
    const pageBids = allLiveBids.slice(start, end);
    pageBids.forEach(b => {
      const bidEl = document.createElement("div");
      bidEl.className = "bid-card";
      bidEl.innerHTML = `
        <p>
          <strong><a href="item.html?id=${b.listingid}">${b.itemName}</a></strong><br>
          Live Price: ${formatPrice(b.livePrice)}<br>
          Bid: ${formatPrice(b.bidAmount)}<br>
        </p>
      `;
      liveBidsContainer.appendChild(bidEl);
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
  document.querySelector('[name="price_type"]').value = d.pricetype || "fixed";
  document.querySelector('[name="sale_type"]').value = d.saletype || "";
  document.getElementById("item_id").value = id;

  if (d.saletype === "live_auctions") {
    auctionFields.style.display = "block";
    if (d.auctionstart)
      document.querySelector('[name="auctionstart"]').value =
        d.auctionstart.toDate().toISOString().slice(0, 16);
    if (d.auctionend)
      document.querySelector('[name="auctionend"]').value =
        d.auctionend.toDate().toISOString().slice(0, 16);
    renderLivePagination();
  }
};

window.deleteItem = async (id, col) => {
  if (!confirm("Delete this item?")) return;
  await deleteDoc(doc(db, col, id));
  alert("Deleted");
};

/* ---------- Load Live Auctions with Timer ---------- */
let auctionsAll = [];
let auctionsPage = 1;
const auctionsPerPage = 3; // Show 3 auctions per page
const auctionsContainerHeight = 650; // px, container fixed height

function renderAuctionsPage(page) {
  const container = document.getElementById("ended-auctions-list");

  // Make container scrollable with fixed height
  container.style.maxHeight = auctionsContainerHeight + "px";
  container.style.overflowY = "auto";
  container.style.paddingRight = "10px";
  container.innerHTML = "";

  const start = (page - 1) * auctionsPerPage;
  const end = start + auctionsPerPage;
  const pageAuctions = auctionsAll.slice(start, end);

  pageAuctions.forEach((a, index) => {
    container.innerHTML += `
      <div class="ended-auction bid-item" data-index="${start + index}" style="margin-bottom:20px;">
        <p><strong>${a.name}</strong></p>
        ${a.image ? `<img src="${a.image}" style="width:100%;max-width:200px;">` : ""}
        <p>Current Price: £${(a.winningbid || a.price).toLocaleString()}</p>
        <p>Highest Bidder: ${a.winneremail || "No bids"}</p>
        <p class="auction-timer">Status: </p>
        <p>Ends At: ${a.auctionend.toLocaleString()}</p>
        <hr>
      </div>
    `;
  });

  renderAuctionPagination();
}
  function renderLivePagination() {
    let controls = document.getElementById("live-pagination-controls");
    if (!controls) {
      controls = document.createElement("div");
      controls.id = "live-pagination-controls";
      controls.style.marginTop = "10px";
      liveBidsContainer.appendChild(controls);
    }
    controls.innerHTML = "";
    const totalPages = Math.ceil(allLiveBids.length / bidsPerPage);
    if (livePage > 1) {
      const prevBtn = document.createElement("button");
      prevBtn.textContent = "Previous";
      prevBtn.onclick = () => { livePage--; renderLiveBidsPage(livePage); };
      controls.appendChild(prevBtn);
    }
    if (livePage < totalPages) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next";
      nextBtn.onclick = () => { livePage++; renderLiveBidsPage(livePage); };
      controls.appendChild(nextBtn);
    }
  }

// Update timers every second
setInterval(() => {
  const timerElems = document.querySelectorAll(".ended-auction.bid-item");
  timerElems.forEach(elem => {
    const index = Number(elem.getAttribute("data-index"));
    const a = auctionsAll[index];
    if (!a) return;

    const remainingTime = Math.max(0, a.auctionend - new Date());
    const timerText = remainingTime > 0
      ? formatCountdown(remainingTime)
      : "Auction Ended";

    const timerP = elem.querySelector(".auction-timer");
    if (timerP) timerP.textContent = "Status: " + timerText;
  onSnapshot(collection(db, "bids"), async snapshot => {
    allLiveBids = [];
    for (const d of snapshot.docs) {
      const b = d.data();
      if (b.userid !== user.uid) continue;
      if (!b.listingid) continue;
      const listingSnap = await getDoc(doc(db, "listings", b.listingid));
      if (!listingSnap.exists()) continue;
      const listing = listingSnap.data();
      if (listing.status !== "live") continue;
      allLiveBids.push({
        itemName: listing.name,
        livePrice: listing.price,
        bidAmount: b.bidamount,
        listingid: b.listingid
      });
    }
    livePage = 1;
    renderLiveBidsPage(livePage);
  });
}, 1000);

function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function renderAuctionPagination() {
  let controls = document.getElementById("auction-pagination-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.id = "auction-pagination-controls";
    document.getElementById("ended-auctions-list").after(controls);
  }
  controls.innerHTML = "";
  controls.style.marginTop = "10px";

  const totalPages = Math.ceil(auctionsAll.length / auctionsPerPage);
  // ---------- Won Bids Live Update ----------
  let allWonAuctions = [];
  let wonPage = 1;
  const auctionsPerPage = 3;

  if (auctionsPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.onclick = () => { auctionsPage--; renderAuctionsPage(auctionsPage); };
    controls.appendChild(prevBtn);
  function renderWonPage(page) {
    if (!wonBidsContainer) return;
    wonBidsContainer.innerHTML = "<h2>Won Bids</h2>";
    if (!allWonAuctions.length) {
      wonBidsContainer.innerHTML += "<p>No won bids yet.</p>";
      return;
    }
    const start = (page - 1) * auctionsPerPage;
    const end = start + auctionsPerPage;
    const pageAuctions = allWonAuctions.slice(start, end);
    pageAuctions.forEach(a => {
      const bidEl = document.createElement("div");
      bidEl.className = "bid-card";
      bidEl.innerHTML = `
        <p><strong><a href="item.html?id=${a.id}">${a.name}</a></strong></p>
        ${a.image ? `<img src="${a.image}" style="width:100%;max-width:200px;">` : ""}
        <p>Current Price: ${formatPrice(a.winningbid)}</p>
        <p>Highest Bidder: ${a.winneremail || "You"}</p>
        <p>Status: Auction Ended</p>
        <p>Ended At: ${a.auctionend.toLocaleString()}</p>
      `;
      wonBidsContainer.appendChild(bidEl);
    });
    renderWonPagination();
  }

  if (auctionsPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.onclick = () => { auctionsPage++; renderAuctionsPage(auctionsPage); };
    controls.appendChild(nextBtn);
  function renderWonPagination() {
    let controls = document.getElementById("won-pagination-controls");
    if (!controls) {
      controls = document.createElement("div");
      controls.id = "won-pagination-controls";
      controls.style.marginTop = "10px";
      wonBidsContainer.appendChild(controls);
    }
    controls.innerHTML = "";
    const totalPages = Math.ceil(allWonAuctions.length / auctionsPerPage);
    if (wonPage > 1) {
      const prevBtn = document.createElement("button");
      prevBtn.textContent = "Previous";
      prevBtn.onclick = () => { wonPage--; renderWonPage(wonPage); };
      controls.appendChild(prevBtn);
    }
    if (wonPage < totalPages) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next";
      nextBtn.onclick = () => { wonPage++; renderWonPage(wonPage); };
      controls.appendChild(nextBtn);
    }
  }
}

function loadEndedAuctions() {
  onSnapshot(query(collection(db, "listings"), orderBy("auctionend", "asc")), snapshot => {
    auctionsAll = [];
    allWonAuctions = [];

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      if (d.pricetype !== "auction") return;
      auctionsAll.push({
      if (d.winnerid !== user.uid) return;
      allWonAuctions.push({
        ...d,
        auctionend: d.auctionend?.toDate(),
        winningbid: d.winningbid || d.price,
        winneremail: d.winneremail || "No bids"
        winneremail: d.winneremail || "You",
        id: docSnap.id
      });
    });

    auctionsAll.sort((a, b) => a.auctionend - b.auctionend);
    auctionsPage = 1;
    renderAuctionsPage(auctionsPage);
    allWonAuctions.sort((a, b) => a.auctionend - b.auctionend);
    wonPage = 1;
    renderWonPage(wonPage);
  });
}

/* ---------- Load Bids with Pagination ---------- */
let allBids = [];
let currentPage = 1;
const bidsPerPage = 10;

function renderBidsPage(page) {
  const bidsList = document.getElementById("bids-list");
  bidsList.innerHTML = "";

  const startIndex = (page - 1) * bidsPerPage;
  const endIndex = startIndex + bidsPerPage;
  const pageBids = allBids.slice(startIndex, endIndex);

  pageBids.forEach(b => {
    bidsList.innerHTML += `
      <p>
        <strong>${b.itemName}</strong><br>
        Live Price: £${b.livePrice}<br>
        Bid: £${b.bidAmount}<br>
        User: ${b.userEmail || "Unknown"}
      </p>
    `;
  // ---------- Purchase History Live Update ----------
  const purchaseQuery = query(
    collection(db, "successfulsales"),
    where("buyerId", "==", user.uid),
    orderBy("date", "desc")
  );

  onSnapshot(purchaseQuery, (snapshot) => {
    if (!salesContainer) return;
    salesContainer.innerHTML = "<h2>Purchase History</h2>";
    if(snapshot.empty){
      salesContainer.innerHTML += "<p>No purchases yet.</p>";
      return;
    }
    snapshot.forEach(doc => {
      const sale = doc.data();
      const dateStr = sale.date?.seconds ? new Date(sale.date.seconds * 1000).toLocaleDateString() : "Unknown date";
      const saleEl = document.createElement("div");
      saleEl.className = "bid-card";
      const link = document.createElement("a");
      link.href = `item.html?id=${sale.itemId}`;
      link.textContent = `${sale.itemName} – ${formatPrice(sale.price)} (${sale.purchaseType}) on ${dateStr}`;
      saleEl.appendChild(link);
      salesContainer.appendChild(saleEl);
    });
  });
});
</script>

<style>
.container input {
  background-color: #1e1e1e;
  border: 2px solid #FFD700;
  color: #fff;
  padding: 8px;
  border-radius: 4px;
  width: 100%;
  margin: 5px 0;
  list-style: none;
}

  renderPaginationControls();
.container ul {
  padding-left: 0;
  list-style: none;
}

function renderPaginationControls() {
  let controls = document.getElementById("pagination-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.id = "pagination-controls";
    document.getElementById("bids-list").after(controls);
  }
  controls.innerHTML = "";
.dashboard-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 20px;
}

  const totalPages = Math.ceil(allBids.length / bidsPerPage);
.dashboard-cards .card {
  flex: 1 1 300px;
  min-width: 280px;
}

  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.onclick = () => { currentPage--; renderBidsPage(currentPage); };
    controls.appendChild(prevBtn);
  }
#bids-container, #purchase-history-container {
  padding:15px;
  background:#1e1e1e;
  border:2px solid #FFD700;
  border-radius:5px;
}

  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.onclick = () => { currentPage++; renderBidsPage(currentPage); };
    controls.appendChild(nextBtn);
  }
.bid-card {
  background:#2a2a2a;
  border:1px solid #FFD700;
  padding:8px;
  margin-bottom:5px;
  border-radius:4px;
}

function loadBids() {
  allBids = [];
.bid-card a {
  color:#FFD700;
  text-decoration:none;
  display:block;
}

  onSnapshot(collection(db, "bids"), async snapshot => {
    allBids = [];
.bid-card a:hover {
  text-decoration:underline;
}

    for (const d of snapshot.docs) {
      const b = d.data();
      if (!b.listingid) continue;
#welcome-name {
  font-weight: normal;
  color: inherit;
  font-size: inherit;
}

      const listingSnap = await getDoc(doc(db, "listings", b.listingid));
      if (!listingSnap.exists()) continue;
#logout-button {
  background-color: #FFD700;
  color: #1e1e1e;
  font-weight: bold;
  border: 2px solid #1e1e1e;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

      const listing = listingSnap.data();
#logout-button:hover {
  background-color: #fff;
  color: #FFD700;
  border: 2px solid #FFD700;
  transform: scale(1.05);
}

      allBids.push({
        itemName: listing.name,
        livePrice: listing.price,
        bidAmount: b.bidamount,
        userEmail: b.useremail || "Unknown"
      });
    }
.consign-btn {
  display: inline-block;
  background-color: #FFD700;
  color: #1e1e1e;
  font-weight: bold;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 8px;
  border: 2px solid #1e1e1e;
  transition: all 0.3s ease;
}

    currentPage = 1;
    renderBidsPage(currentPage);
  });
.consign-btn:hover {
  background-color: #fff;
  color: #FFD700;
  border: 2px solid #FFD700;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .dashboard-cards {
    flex-direction: column;
  }
}
