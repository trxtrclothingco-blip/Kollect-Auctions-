import { db, auth } from './firebase.js';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// DOM elements
const bidsContainer = document.getElementById('bids-list'); // all bids
const endedAuctionsContainer = document.getElementById('ended-auctions-list'); // live/ended auctions
const adminPanel = document.getElementById('admin-panel');
const itemForm = document.getElementById('item-form');

// Admin UID (exactly as in Firebase)
const ADMIN_UID = 'gBrbEobcS5RCG47acE5ySqxO8yB2';

function formatPrice(price) {
  if (!price && price !== 0) return '£0';
  return '£' + Number(price).toLocaleString();
}

// Edit function for listings and private sales
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

// Auto show admin panel if UID matches exactly
auth.onAuthStateChanged(user => {
  if (!user) {
    if (bidsContainer) bidsContainer.innerHTML = '<p>Please log in to see bids.</p>';
    if (endedAuctionsContainer) endedAuctionsContainer.innerHTML = '<p>Please log in to see auctions.</p>';
    if (adminPanel) adminPanel.style.display = 'none';
    return;
  }

  const userId = user.uid; // keep exact casing
  const isAdmin = userId === ADMIN_UID;

  // Show admin panel only if admin
  if (adminPanel) adminPanel.style.display = isAdmin ? 'block' : 'none';
  if (itemForm) itemForm.style.display = isAdmin ? 'block' : 'none';

  // ========================
  // ALL BIDS (newest first)
  // ========================
  const allBidsQuery = query(
    collection(db, 'bids'),
    orderBy('timestamp', 'desc')
  );

  onSnapshot(allBidsQuery, snapshot => {
    if (!bidsContainer) return;
    bidsContainer.innerHTML = '';
    if (snapshot.empty) {
      bidsContainer.innerHTML = '<p>No bids yet.</p>';
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
      bidsContainer.appendChild(bidCard);
    });
  });

  // ========================
  // ENDED / LIVE AUCTIONS
  // ========================
  const endedAuctionsQuery = query(
    collection(db, 'listings'),
    orderBy('createdat', 'desc') // newest first
  );

  onSnapshot(endedAuctionsQuery, snapshot => {
    if (!endedAuctionsContainer) return;
    endedAuctionsContainer.innerHTML = '';
    if (snapshot.empty) {
      endedAuctionsContainer.innerHTML = '<p>No auctions found.</p>';
      return;
    }

    snapshot.docs.forEach(docSnap => {
      const auction = docSnap.data();
      const auctionCard = document.createElement('div');
      auctionCard.className = 'auction-card';
      const endDate = auction.endedat?.seconds ? new Date(auction.endedat.seconds * 1000).toLocaleDateString() : 'Unknown';

      // Only show edit button if admin
      const editButton = isAdmin
        ? `<button onclick="editItem('listings', '${docSnap.id}', { name: '${auction.name}', saletype: '${auction.saletype}' })">Edit Listing</button>`
        : '';

      auctionCard.innerHTML = `
        <a href="item.html?id=${docSnap.id}">
          ${auction.name} – ${formatPrice(auction.winningbid || auction.price)} – Ends: ${endDate}
        </a>
        ${editButton}
      `;
      endedAuctionsContainer.appendChild(auctionCard);
    });
  });

  // ========================
  // PRIVATE SALES (optional edits)
  // ========================
  const privateSalesQuery = query(
    collection(db, 'privatesales'),
    orderBy('createdat', 'desc')
  );

  onSnapshot(privateSalesQuery, snapshot => {
    if (!endedAuctionsContainer) return; // reuse endedAuctionsContainer
    snapshot.docs.forEach(docSnap => {
      const sale = docSnap.data();
      const saleCard = document.createElement('div');
      saleCard.className = 'auction-card';

      const editButton = isAdmin
        ? `<button onclick="editItem('privatesales', '${docSnap.id}', { name: '${sale.name}', saletype: '${sale.saletype}' })">Edit Private Sale</button>`
        : '';

      saleCard.innerHTML = `
        <a href="item.html?id=${docSnap.id}">
          ${sale.name} – ${formatPrice(sale.price)} – Private Sale
        </a>
        ${editButton}
      `;
      endedAuctionsContainer.appendChild(saleCard);
    });
  });
});

// Call function on page load
document.addEventListener('DOMContentLoaded', () => {});
