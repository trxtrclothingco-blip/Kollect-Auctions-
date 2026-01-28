import { auth, db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Only run on private sales page
if (document.body.dataset.page === "privatesales") {

  const container = document.getElementById("private-sales-list");

  if (!container) {
    console.error("private-sales-list container not found");
    return;
  }

  const privatesalesRef = collection(db, "privatesales");

  // Listen for live updates
  onSnapshot(privatesalesRef, (snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = "<p>No private sale items available.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();

      container.innerHTML += `
        <div class="card">
          <img src="${item.imageUrl || ''}" alt="${item.item_name || 'Item'}">
          <h3>${item.item_name}</h3>
          <p>${item.item_description || ""}</p>
          <p><strong>£${item.item_price}</strong></p>
          <button class="button make-offer">Make Offer</button>
          <button class="button buy-now" 
                  data-id="${docSnap.id}" 
                  data-price="${item.item_price}" 
                  data-name="${item.item_name}" 
                  data-seller="${item.sellerId || ''}">
            Buy Now
          </button>
        </div>
      `;
    });

    // Add Buy Now click listeners after cards are rendered
    container.querySelectorAll(".buy-now").forEach(btn => {
      btn.addEventListener("click", async () => {
        const itemId = btn.dataset.id;
        const price = parseFloat(btn.dataset.price);
        const itemName = btn.dataset.name;
        const sellerId = btn.dataset.seller;

        const user = auth.currentUser;
        if (!user) {
          alert("Please log in to buy this item.");
          return;
        }

        try {
          // Add sale to successfulsales collection (all lowercase)
          await addDoc(collection(db, "successfulsales"), {
            buyerId: user.uid,
            sellerId: sellerId,
            itemId: itemId,
            itemName: itemName,
            price: price,
            purchaseType: "buyNow",
            date: serverTimestamp()
          });

          alert(`You successfully bought ${itemName} for £${price}!`);

          // Remove item from privatesales so it can't be bought again
          await deleteDoc(doc(db, "privatesales", itemId));

        } catch (err) {
          console.error("Buy Now failed:", err);
          alert("Purchase failed, please try again.");
        }
      });
    });

    // Optional: make offer button listener (kept as-is)
    container.querySelectorAll(".make-offer").forEach(btn => {
      btn.addEventListener("click", () => {
        alert("Make Offer functionality not implemented yet.");
      });
    });
  });
}
