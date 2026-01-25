import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// HTML elements
const highestBidEl = document.getElementById("highestBid");
const bidInput = document.getElementById("bidInput");
const bidBtn = document.getElementById("bidBtn");
const bidList = document.getElementById("bidList");

// Auction ID
const AUCTION_ID = "auction-1";

let currentHighest = 0;
let currentUser = null;

// -----------------
// Auth state
// -----------------
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  bidBtn.disabled = !user;
  bidBtn.textContent = user ? "Place Bid" : "Login to bid";
});

// -----------------
// Live bids listener
// -----------------
const q = query(
  collection(db, "bids"),
  where("auctionId", "==", AUCTION_ID),
  orderBy("amount", "desc")
);

onSnapshot(q, (snapshot) => {
  bidList.innerHTML = "";

  if (snapshot.empty) {
    highestBidEl.textContent = "£0";
    currentHighest = 0;
    return;
  }

  snapshot.forEach((doc, index) => {
    const bid = doc.data();
    if (index === 0) {
      currentHighest = bid.amount;
      highestBidEl.textContent = `£${bid.amount}`;
    }

    const li = document.createElement("li");
    li.textContent = `£${bid.amount} — ${bid.email}`;
    bidList.appendChild(li);
  });
});

// -----------------
// Place a bid
// -----------------
bidBtn.addEventListener("click", async () => {
  const amount = Number(bidInput.value.trim());

  // Validation
  if (!currentUser) return alert("Login required to place a bid.");
  if (isNaN(amount) || amount <= 0) return alert("Enter a valid number greater than 0.");
  if (amount <= currentHighest) return alert(`Bid must be higher than the current highest (£${currentHighest}).`);

  // Disable button to prevent double clicks
  bidBtn.disabled = true;

  try {
    await addDoc(collection(db, "bids"), {
      auctionId: AUCTION_ID,
      amount,
      email: currentUser.email,
      createdAt: serverTimestamp()
    });

    bidInput.value = "";
  } catch (error) {
    console.error("Error placing bid:", error);
    alert("Failed to place bid. Please try again.");
  } finally {
    bidBtn.disabled = !currentUser;
  }
});
