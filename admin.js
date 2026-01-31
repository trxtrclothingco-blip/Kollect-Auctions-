import { db, auth } from './firebase.js';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// DOM elements
const liveAuctionsContainer = document.getElementById('live-auctions-container'); // Show all live auctions
const allBidsContainer = document.getElementById('all-bids-container'); // Show all bids
const endedAuctionsContainer = document.getElementById('ended-auctions-container'); // Optional: ended auctions

function formatPrice(price) {
  if (!price && price !== 0) return '£0';
  return '£' + Number(price).toLocaleString();
}

// Function to edit a listing (listings or privatesales)
async function editItem(collectionName, itemId, updatedData) {
  try {
    const itemRef = doc(db, collectionName, itemId);
    await updateDoc(itemRef, updatedData);
    alert(`${collectionName} item ${itemId} updated successfully.`);
  } catch (err) {
    console.error('Error updating item:', err);
    alert('Failed to update item.');
  }
}

auth.onAuthStateChanged(user => {
  if (!user) {
    if (liveAuctionsContainer) liveAuctionsContainer.innerHTML = '<p>Please log in to see auctions.</p>';
    if (allBidsContainer) allBidsContainer.innerHTML = '<p>Please log in to see bids.</p>';
    if (endedAuctionsContainer) endedAuctionsContainer.innerHTML = '<p>Please log in to see ended auctions.</p>';
    return;
  }

  const userId = user.uid;
  const userEmail = user.email;

  // ========================
  // LIVE AUCTIONS (status = live)
  // ========================
  const liveAuctionsQuery = query(
    collection(db, 'listings'),
    where('status', '==', 'live'),
    orderBy('auctionstart', 'desc') // newest auctions first
  );

  onSnapshot(liveAuctionsQuery, snapshot => {
    if (!liveAuctionsContainer) return;
    liveAuctionsContainer.innerHTML = '<h2>Live Auctions</h2>';
    if (snapshot.empty) {
      liveAuctionsContainer.innerHTML += '<p>No live auctions currently.</p>';
      return;
    }

    snapshot.docs.forEach(docSnap => {
      const auction = docSnap.data();
      const auctionCard = document.createElement('div');
      auctionCard.className = 'auction-card';
      const startDate = auction.auctionstart?.seconds ? new Date(auction.auctionstart.seconds * 1000).toLocaleDateString() : 'Unknown';
      const endDate = auction.endedat?.seconds ? new Date(auction.endedat.seconds * 1000).toLocaleDateString() : 'Unknown';
      auctionCard.innerHTML = `
        <a href="item.html?id=${docSnap.id}">
          ${auction.name} – ${formatPrice(auction.price)} – ${startDate} to ${endDate}
        </a>
        <button onclick="editItem('listings', '${docSnap.id}', { name: '${auction.name}', saletype: '${auction.saletype}' })">Edit Item</button>
      `;
      liveAuctionsContainer.appendChild(auctionCard);
    });
  });

  // ========================
  // ALL BIDS (newest first)
  // ========================
  const allBidsQuery = query(
    collection(db, 'bids'),
    orderBy('timestamp', 'desc')
  );

  onSnapshot(allBidsQuery, snapshot => {
    if (!allBidsContainer) return;
    allBidsContainer.innerHTML = '<h2>All Bids</h2>';
    if (snapshot.empty) {
      allBidsContainer.innerHTML += '<p>No bids yet.</p>';
      return;
    }

    snapshot.docs.forEach(docSnap => {
      const bid = docSnap.data();
      const bidCard = document.createElement('div');
      bidCard.className = 'bid-card';
      const dateStr = bid.timestamp?.seconds ? new Date(bid.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown date';
      bidCard.innerHTML = `
        <a href="item.html?id=${bid.listingid}">
          Listing ID: ${bid.listingid} – ${formatPrice(bid.bidamount)} by ${bid.useremail} on ${dateStr}
        </a>
      `;
      allBidsContainer.appendChild(bidCard);
    });
  });

  // ========================
  // ENDED AUCTIONS (status = ended)
  // ========================
  const endedAuctionsQuery = query(
    collection(db, 'listings'),
    where('status', '==', 'ended'),
    orderBy('endedat', 'desc')
  );

  onSnapshot(endedAuctionsQuery, snapshot => {
    if (!endedAuctionsContainer) return;
    endedAuctionsContainer.innerHTML = '<h2>Ended Auctions</h2>';
    if (snapshot.empty) {
      endedAuctionsContainer.innerHTML += '<p>No ended auctions yet.</p>';
      return;
    }

    snapshot.docs.forEach(docSnap => {
      const auction = docSnap.data();
      const auctionCard = document.createElement('div');
      auctionCard.className = 'auction-card';
      const endDate = auction.endedat?.seconds ? new Date(auction.endedat.seconds * 1000).toLocaleDateString() : 'Unknown';
      auctionCard.innerHTML = `
        <a href="item.html?id=${docSnap.id}">
          ${auction.name} – ${formatPrice(auction.winningbid || auction.price)} – Ended on ${endDate}
        </a>
        <button onclick="editItem('listings', '${docSnap.id}', { name: '${auction.name}', saletype: '${auction.saletype}' })">Edit Listing</button>
      `;
      endedAuctionsContainer.appendChild(auctionCard);
    });
  });

  // ========================
  // PRIVATE SALES (optional)
  // ========================
  const privateSalesQuery = query(
    collection(db, 'privatesales'),
    orderBy('createdat', 'desc')
  );

  onSnapshot(privateSalesQuery, snapshot => {
    if (!endedAuctionsContainer) return; // Reuse endedAuctionsContainer or create a new container
    snapshot.docs.forEach(docSnap => {
      const sale = docSnap.data();
      const saleCard = document.createElement('div');
      saleCard.className = 'auction-card';
      saleCard.innerHTML = `
        <a href="item.html?id=${docSnap.id}">
          ${sale.name} – ${formatPrice(sale.price)} – Private Sale
        </a>
        <button onclick="editItem('privatesales', '${docSnap.id}', { name: '${sale.name}', saletype: '${sale.saletype}' })">Edit Private Sale</button>
      `;
      endedAuctionsContainer.appendChild(saleCard);
    });
  });
});

// Call function on page load
document.addEventListener('DOMContentLoaded', () => {});
