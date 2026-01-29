import { db } from "./firebase.js";
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ---------- Pagination Settings ----------
let auctionsAll = [];
let auctionsPage = 1;
const auctionsPerPage = 10; // show 10 per page now

// ---------- Render Auctions ----------
function renderAuctionsPage(page) {
  const container = document.getElementById("ended-auctions-list");
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
        <p class="auction-timer">Time Left: </p>
        <p>Ends At: ${a.auctionend.toLocaleString()}</p>
        <hr>
      </div>
    `;
  });

  renderAuctionPagination();
}

// ---------- Countdown Timer ----------
setInterval(() => {
  const timerElems = document.querySelectorAll(".ended-auction.bid-item");
  timerElems.forEach(elem => {
    const index = Number(elem.getAttribute("data-index"));
    const a = auctionsAll[index];
    if (!a) return;

    const remainingTime = a.auctionend - new Date();
    const timerText = remainingTime > 0
      ? formatCountdown(remainingTime)
      : "Auction Ended";

    const timerP = elem.querySelector(".auction-timer");
    if (timerP) timerP.textContent = "Status: " + timerText;
  });
}, 1000);

function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

// ---------- Pagination ----------
function renderAuctionPagination() {
  const controls = document.getElementById("auction-pagination-controls");
  controls.innerHTML = "";

  const totalPages = Math.ceil(auctionsAll.length / auctionsPerPage);

  if (auctionsPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.onclick = () => { auctionsPage--; renderAuctionsPage(auctionsPage); };
    controls.appendChild(prevBtn);
  }

  if (auctionsPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.onclick = () => { auctionsPage++; renderAuctionsPage(auctionsPage); };
    controls.appendChild(nextBtn);
  }
}

// ---------- Load Live Auctions ----------
function loadLiveAuctions() {
  const q = query(collection(db, "listings"), orderBy("auctionend", "asc"));
  onSnapshot(q, snapshot => {
    auctionsAll = [];

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      if (d.pricetype !== "auction") return; // only auctions

      auctionsAll.push({
        ...d,
        auctionend: d.auctionend?.toDate(),
        winningbid: d.winningbid || d.price,
        winneremail: d.winneremail || "No bids"
      });
    });

    auctionsAll.sort((a, b) => a.auctionend - b.auctionend);
    auctionsPage = 1;
    renderAuctionsPage(auctionsPage);
  });
}

loadLiveAuctions();
