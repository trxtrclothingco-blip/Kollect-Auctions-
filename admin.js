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
  where,
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

if (saleTypeSelect && auctionFields) {
  saleTypeSelect.addEventListener("change", () => {
    auctionFields.style.display =
      saleTypeSelect.value === "live_auctions" ? "block" : "none";
  });
}

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
    }

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
    auctionFields.style.display = "none";
    alert("Item saved ✅");

  } catch (err) {
    alert(err.message);
  }
});

/* ---------- Load Items (LIVE ONLY) ---------- */
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

        if (col === "listings" && item.status === "ended") return;

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
  }
};

window.deleteItem = async (id, col) => {
  if (!confirm("Delete this item?")) return;
  await deleteDoc(doc(db, col, id));
  alert("Deleted");
};

/* ---------- Load Bids (Highest & Most Recent First) ---------- */
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
  });

  renderPaginationControls();
}

function renderPaginationControls() {
  let controls = document.getElementById("pagination-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.id = "pagination-controls";
    document.getElementById("bids-list").after(controls);
  }
  controls.innerHTML = "";

  const totalPages = Math.ceil(allBids.length / bidsPerPage);

  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.onclick = () => { currentPage--; renderBidsPage(currentPage); };
    controls.appendChild(prevBtn);
  }

  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.onclick = () => { currentPage++; renderBidsPage(currentPage); };
    controls.appendChild(nextBtn);
  }
}

function loadBids() {
  const q = query(
    collection(db, "bids"),
    orderBy("bidamount", "desc"),
    orderBy("createdat", "desc")
  );

  onSnapshot(q, async snapshot => {
    allBids = [];

    for (const d of snapshot.docs) {
      const b = d.data();
      if (!b.listingid) continue;

      const listingSnap = await getDoc(doc(db, "listings", b.listingid));
      if (!listingSnap.exists()) continue;

      const listing = listingSnap.data();

      allBids.push({
        itemName: listing.name,
        livePrice: listing.price,
        bidAmount: b.bidamount,
        userEmail: b.useremail || "Unknown",
        createdat: b.createdat?.seconds || 0
      });
    }

    currentPage = 1;
    renderBidsPage(currentPage);
  });
}

/* ---------- Ended Auctions Pagination (3 per page) ---------- */
const endedAuctionsContainer = document.getElementById("ended-auctions-container");
let endedAuctions = [];
let endedPage = 1;
const endedPerPage = 3;

function renderEndedPage() {
  endedAuctionsContainer.innerHTML = "";

  const start = (endedPage - 1) * endedPerPage;
  const pageItems = endedAuctions.slice(start, start + endedPerPage);

  pageItems.forEach(item => {
    endedAuctionsContainer.innerHTML += `
      <div class="ended-auction-item">
        <h5>${item.name}</h5>
        <img src="${item.image || ''}" width="100">
        <p>${item.description || ''}</p>
        <p>Winner: ${item.winneremail || "No winner"}</p>
        <p>Winning Bid: £${item.winningbid || "N/A"}</p>
      </div>
    `;
  });

  const controls = document.createElement("div");
  if (endedPage > 1) {
    const prev = document.createElement("button");
    prev.textContent = "Previous";
    prev.onclick = () => { endedPage--; renderEndedPage(); };
    controls.appendChild(prev);
  }

  if (endedPage * endedPerPage < endedAuctions.length) {
    const next = document.createElement("button");
    next.textContent = "Next";
    next.onclick = () => { endedPage++; renderEndedPage(); };
    controls.appendChild(next);
  }

  endedAuctionsContainer.appendChild(controls);
}

function loadEndedAuctions() {
  const q = query(
    collection(db, "listings"),
    where("status", "==", "ended"),
    orderBy("endedat", "desc")
  );

  onSnapshot(q, snapshot => {
    endedAuctions = [];
    snapshot.forEach(d => endedAuctions.push(d.data()));
    endedPage = 1;
    renderEndedPage();
  });
}
