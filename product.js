import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Only run on private sales page
if (document.body.dataset.page === "privatesales") {

  const container = document.getElementById("private-sales-list");

  if (!container) {
    console.error("private-sales-list container not found");
    return;
  }

  const privatesalesRef = collection(db, "privatesales");

  onSnapshot(privatesalesRef, (snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = "<p>No private sale items available.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const item = doc.data();

      container.innerHTML += `
        <div class="card">
          <img src="${item.imageUrl || ''}" alt="${item.item_name || 'Item'}">
          <h3>${item.item_name}</h3>
          <p>${item.item_description || ""}</p>
          <p><strong>£${item.item_price}</strong></p>
          <button class="button">Make Offer</button>
        </div>
      `;
    });
  });
}
