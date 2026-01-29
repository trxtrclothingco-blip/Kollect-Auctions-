import { db } from "./firebase.js";
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ---------- Pagination Settings ----------
let auctionsAll = [];
let auctionsPage = 1;
const auctionsPerPage = 3; // show 3 per page

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
        <p>Final Price: £${(a.winningbid || a.price).toLocaleString()}</p>
        <p>Winner: ${a.winneremail || "No bids"}</p>
        <p>Ended At: ${a.auctionend.toLocaleString()}</p>
        <hr>
      </div>
    `;
  });

  renderAuctionPagination();
}

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

// ---------- Load Ended Auctions ----------
function loadEndedAuctions() {
  const q = query(collection(db, "listings"), orderBy("auctionend", "asc"));
  onSnapshot(q, snapshot => {
    auctionsAll = [];

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      if (d.pricetype !== "auction") return; // only auctions
      if (!d.winningbid) return; // only ended auctions

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

loadEndedAuctions();
