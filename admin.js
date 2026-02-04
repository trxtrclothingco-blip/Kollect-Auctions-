import { db, auth } from "./firebase.js";
import { 
  collection, query, orderBy, onSnapshot, serverTimestamp, doc, runTransaction
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Track logged-in user
let currentUser = null;
onAuthStateChanged(auth, (user) => { 
  currentUser = user; 
  updateBidButtons(); // Update bid button text based on login status
});

// Container for auction cards
const liveAuctionsList = document.getElementById("live-auctions-list");
const countdownIntervals = {}; // store intervals per listing

// --- Helper Functions ---

// Format milliseconds to d/h/m/s
function formatDiff(ms){
  const days = Math.floor(ms / (1000*60*60*24));
  const hours = Math.floor((ms % (1000*60*60*24)) / (1000*60*60));
  const minutes = Math.floor((ms % (1000*60*60)) / (1000*60));
  const seconds = Math.floor((ms % (1000*60)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Generate countdown text based on auction start and end
function getCountdownText(start, end){
  const now = new Date();
  const startTime = start?.toDate ? start.toDate() : new Date(start);
  const endTime = end?.toDate ? end.toDate() : new Date(end);

  if(now < startTime) return `Auction starts in: ${formatDiff(startTime - now)}`;
  if(now >= startTime && now <= endTime) return `Auction ends in: ${formatDiff(endTime - now)}`;
  return "Auction ended";
}

// Update bid buttons text based on currentUser
function updateBidButtons(){
  const buttons = liveAuctionsList.querySelectorAll(".bid-button");
  buttons.forEach(btn => {
    btn.textContent = currentUser ? "Place Bid" : "Login to bid";
    btn.disabled = !currentUser;
  });
}

// Place bid for a listing
async function placeBid(listingId, bidInput){
  if (!currentUser) return alert("Login required");

  const bidAmount = Number(bidInput.value.trim());
  if (isNaN(bidAmount)) return alert("Invalid bid");

  bidInput.disabled = true;

  try {
    const listingRef = doc(db, "listings", listingId);
    const bidsRef = collection(db, "bids");

    await runTransaction(db, async (transaction) => {
      const listingSnap = await transaction.get(listingRef);

      if (!listingSnap.exists()) {
        throw "Listing not found";
      }

      const listing = listingSnap.data();
      const currentPrice = Number(listing.price || 0);

      // 🔒 Auction rule: must be strictly higher
      if (bidAmount <= currentPrice) {
        throw `Bid must be higher than £${currentPrice}`;
      }

      // Update listing (single source of truth)
      transaction.update(listingRef, {
        price: bidAmount,
        winningbid: bidAmount,
        winnerid: currentUser.uid,
        winneremail: currentUser.email
      });

      // Record bid
      const bidRef = doc(bidsRef);
      transaction.set(bidRef, {
        listingid: listingId,
        bidamount: bidAmount,
        userid: currentUser.uid,
        useremail: currentUser.email,
        timestamp: serverTimestamp()
      });
    });

    bidInput.value = "";

    const msgDiv = document.getElementById("bid-success-msg");
    if (msgDiv) {
      msgDiv.style.display = "flex";
      setTimeout(() => (msgDiv.style.display = "none"), 2500);
    }

  } catch (err) {
    console.error(err);
    alert(typeof err === "string" ? err : "Bid failed");
  } finally {
    bidInput.disabled = false;
  }
}

// --- Load Listings from Firestore ---
function loadListings(){
  const listingsQuery = query(collection(db, "listings"), orderBy("createdat", "desc"));

  onSnapshot(listingsQuery, snapshot => {
    liveAuctionsList.innerHTML = ""; // clear container

    if(snapshot.empty){
      liveAuctionsList.innerHTML = "<p>No live auctions available.</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const { name, description, price, image, auctionstart, auctionend } = data;
      if(!name || !price || !image) return; // skip incomplete entries

      const card = document.createElement("div");
      card.classList.add("card", "auction-card");
      card.dataset.listingId = docSnap.id;

      card.innerHTML = `
        <img src="${image}" alt="${name}">
        <h3>${name}</h3>
        <p>${description || ""}</p>
        <p class="price-display">Price: £${Number(price).toLocaleString()}</p>
        ${(auctionstart && auctionend) ? '<p class="auction-timer"></p>' : ''}
        <div class="bid-container">
          <input type="number" placeholder="Enter bid amount" class="bid-input">
          <button class="button bid-button">${currentUser ? "Place Bid" : "Login to bid"}</button>
        </div>
      `;

      // Bid button event
      const bidInput = card.querySelector(".bid-input");
      const bidButton = card.querySelector(".bid-button");
      bidButton.addEventListener("click", () => placeBid(docSnap.id, bidInput));

      // Countdown timer
      if(auctionstart && auctionend){
        const timerEl = card.querySelector(".auction-timer");
        if(countdownIntervals[docSnap.id]) clearInterval(countdownIntervals[docSnap.id]);

        const updateTimer = () => {
          timerEl.textContent = getCountdownText(auctionstart, auctionend);
          const now = new Date();
          const endTime = auctionend?.toDate ? auctionend.toDate() : new Date(auctionend);
          if(now > endTime) clearInterval(countdownIntervals[docSnap.id]);
        };
        updateTimer();
        countdownIntervals[docSnap.id] = setInterval(updateTimer, 1000);
      }

      liveAuctionsList.appendChild(card);
    });

    updateBidButtons(); // ensure buttons are correct after loading
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", loadListings);
