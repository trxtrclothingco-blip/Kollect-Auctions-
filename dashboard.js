import { db, auth } from './firebase.js';
import { collection, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// DOM elements
const liveBidsContainer = document.getElementById('live-bids-container');
const wonBidsContainer = document.getElementById('won-bids-container');

function formatPrice(price) {
  if (!price && price !== 0) return '£0';
  return '£' + Number(price).toLocaleString();
}

auth.onAuthStateChanged(user => {
  if (!user) {
    liveBidsContainer.innerHTML = '<p>Please log in to see your live bids.</p>';
    wonBidsContainer.innerHTML = '<p>Please log in to see your won bids.</p>';
    return;
  }

  const userId = user.uid;
  const userEmail = user.email;

  // ========================
  // LIVE BIDS (highest per listing)
  // ========================
  const liveBidsQuery = query(
    collection(db, 'bids'),
    where('userid', '==', userId),
    orderBy('timestamp', 'desc')
  );

  const highestBidsMap = {};

  onSnapshot(liveBidsQuery, snapshot => {
    highestBidsMap = {}; // reset map
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const { listingid, bidamount } = data;
      // Keep only highest bid per listing
      if (!highestBidsMap[listingid] || bidamount > highestBidsMap[listingid].bidamount) {
        highestBidsMap[listingid] = { ...data, id: doc.id };
      }
    });

    // Render live bids
    const bidsArray = Object.values(highestBidsMap);
    if (!bidsArray.length) {
      liveBidsContainer.innerHTML = '<h2>Your Live Bids</h2><p>No active bids yet.</p>';
      return;
    }

    liveBidsContainer.innerHTML = '<h2>Your Live Bids</h2>';
    bidsArray.forEach(bid => {
      const bidCard = document.createElement('div');
      bidCard.className = 'bid-card';
      const dateStr = bid.timestamp?.seconds ? new Date(bid.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown date';
      bidCard.innerHTML = `
        <a href="item.html?id=${bid.listingid}">
          Listing ID: ${bid.listingid} – ${formatPrice(bid.bidamount)} placed on ${dateStr}
        </a>
      `;
      liveBidsContainer.appendChild(bidCard);
    });
  });

  // ========================
  // WON BIDS (ended auctions where user is winning bidder)
  // ========================
  const wonBidsQuery = query(
    collection(db, 'bids'),
    where('useremail', '==', userEmail),
    orderBy('timestamp', 'desc')
  );

  onSnapshot(wonBidsQuery, snapshot => {
    if (!wonBidsContainer) return;
    wonBidsContainer.innerHTML = '<h2>Won Bids</h2>';
    if (snapshot.empty) {
      wonBidsContainer.innerHTML += '<p>No won bids yet.</p>';
      return;
    }

    snapshot.docs.forEach(doc => {
      const bid = doc.data();
      const bidCard = document.createElement('div');
      bidCard.className = 'bid-card';
      const dateStr = bid.timestamp?.seconds ? new Date(bid.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown date';
      bidCard.innerHTML = `
        <a href="item.html?id=${bid.listingid}">
          Listing ID: ${bid.listingid} – Won for ${formatPrice(bid.bidamount)} on ${dateStr}
        </a>
      `;
      wonBidsContainer.appendChild(bidCard);
    });
  });
}

// Call function on page load
document.addEventListener('DOMContentLoaded', () => {});
