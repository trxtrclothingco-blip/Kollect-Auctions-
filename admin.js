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
  orderBy,
  setDoc
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

  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid !== ADMIN_UID) {
    alert("You are already signed in with another account. Sign out first.");
    return;
  }

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
      saleTypeSelect.value === "live_auctions" || saleTypeSelect.value === "kollect_100"
        ? "block"
        : "none";
  });
}

/* ---------- Add / Update Item ---------- */
const itemForm = document.getElementById("item-form");

itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData(itemForm);
    const saleType = formData.get("sale_type");
    const kollect100Ticked = formData.get("kollect100") === "on";

    let collectionName =
      saleType === "private_sales" ? "privatesales" : "listings";

    const data = {
      name: formData.get("item_name"),
      description: formData.get("item_description"),
      price: Number(formData.get("item_price")),
      pricetype: formData.get("price_type"),
      saletype: saleType,
      kollect100: kollect100Ticked,
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

    if (saleType === "kollect_100") {
      const kollectRef = doc(collection(db, "kollect100"));
      await setDoc(kollectRef, {
        "name:": formData.get("item_name") || "",
        "description:": formData.get("item_description") || "",
        "image:": data.image || "",
        "price:": Number(formData.get("item_price")) || null,
        "pricetype:": formData.get("price_type") || "",
        "saletype:": "kollect_100",
        "status:": "active",
        "createdat:": serverTimestamp(),
        "auctionstart:": formData.get("auctionstart") ? new Date(formData.get("auctionstart")) : null,
        "auctionend:": formData.get("auctionend") ? new Date(formData.get("auctionend")) : null,
        "endedat:": null,
        "winnerid:": "",
        "winneremail:": "",
        "winningbid:": null
      });
      console.log("Kollect100 item added ✅");
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

        let kollectHeader = "";
        if (item.kollect100) kollectHeader = `<h5>Kollect 100</h5>`;

        section.innerHTML += `
          ${kollectHeader}
          <p>${item.name} – £${item.price}</p>
          <button onclick="editItem('${d.id}','${col}')">Edit</button>
          <button onclick="deleteItem('${d.id}','${col}')">Delete</button>
        `;
      });
    });
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
        ${
          item.winnerid
            ? `<p><a href="#" class="winner-info-link" data-uid="${item.winnerid}">View Info</a></p>`
            : ""
        }
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

/* ---------- Winner Info Click Handler (ADDED) ---------- */
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("winner-info-link")) {
    e.preventDefault();

    const uid = e.target.getAttribute("data-uid");

    try {
      const userSnap = await getDoc(doc(db, "users", uid));

      if (!userSnap.exists()) {
        alert("User not found.");
        return;
      }

      const user = userSnap.data();

      alert(
`Winner Information:

Name: ${user.firstName || ""} ${user.lastName || ""}
Phone: ${user.contact || "N/A"}
Email: ${user.email || "N/A"}`
      );

    } catch (err) {
      console.error(err);
      alert("Error fetching winner info.");
    }
  }
});
