import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const page = document.body.dataset.page;

let collectionName = null;
if (page === "private_sales") collectionName = "private_sales";
else if (page === "live_auctions") collectionName = "live_auctions";
else if (page === "kollect_100") collectionName = "kollect_100";

if (!collectionName) return;

const container = document.getElementById("products-container");
if (!container) return;

const q = query(
  collection(db, collectionName),
  orderBy("createdAt", "desc")
);

onSnapshot(q, snapshot => {
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = "<p>No items available yet.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const imageSrc = data.image || "placeholder.jpg";
    const description = data.description || "";

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${imageSrc}" alt="${data.name}" />
      <h3>${data.name}</h3>
      <p>${description}</p>
      <p>Price: £${data.price} (${data.priceType})</p>
    `;

    container.appendChild(card);
  });
});
