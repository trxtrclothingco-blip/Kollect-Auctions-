import { db, auth } from './firebase.js';
import { collection, query, where, onSnapshot, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// POINTING TO DASHBOARD BIDS CONTAINERS
const liveBidsContainer = document.getElementById('live-bids-container');
const wonBidsContainer = document.getElementById('won-bids-container');

function loadUserBids() {
  auth.onAuthStateChanged(user => {
    if (!user) {
      liveBidsContainer.innerHTML = '<p>Please log in to see your live bids.</p>';
      wonBidsContainer.innerHTML = '<p>Please log in to see your won bids.</p>';
      return;
    }

    const userEmail = user.email.toLowerCase();

    // ----- LIVE BIDS -----
    const liveBidsQuery = query(
      collection(db, 'bids'),
      where('userid', '==', userEmail), // lowercase field
      orderBy('timestamp', 'desc')
    );

    const liveBidsMap = {};

    onSnapshot(liveBidsQuery, snapshot => {
      liveBidsMap = {}; // reset

      snapshot.docs.forEach(docSnap => {
        const bid = docSnap.data();
        const { listingid, bidamount } = bid;

        // Keep only highest bid per listing
        if (!liveBidsMap[listingid] || bidamount > liveBidsMap[listingid].bidamount) {
          liveBidsMap[listingid] = { ...bid, id: docSnap.id };
        }
      });

      renderLiveBids(Object.values(liveBidsMap));
    });

    // ----- WON BIDS -----
    const wonBidsQuery = query(
      collection(db, 'bids'),
      where('userid', '==', userEmail),
      where('status', '==', 'ended'), // only ended auctions
      orderBy('timestamp', 'desc')
    );

    onSnapshot(wonBidsQuery, snapshot => {
      if (!wonBidsContainer) return;
      wonBidsContainer.innerHTML = '<h2>Won Bids</h2>';

      if (snapshot.empty) {
        wonBidsContainer.innerHTML += '<p>No won bids yet.</p>';
        return;
      }

      snapshot.docs.forEach(docSnap => {
        const bid = docSnap.data();
        const bidCard = document.createElement('div');
        bidCard.classList.add('ended-auction'); // reuse auction card style

        bidCard.innerHTML = `
          <h3>${bid.itemname || 'Listing'}</h3>
          <p><strong>Final Bid:</strong> £${bid.bidamount?.toLocaleString() || '0'}</p>
        `;

        wonBidsContainer.appendChild(bidCard);
      });
    });
  });
}

function renderLiveBids(bids) {
  if (!bids.length) {
    liveBidsContainer.innerHTML = '<h2>Your Live Bids</h2><p>No active bids yet.</p>';
    return;
  }

  liveBidsContainer.innerHTML = '<h2>Your Live Bids</h2>'; // header
  bids.forEach(bid => {
    const bidCard = document.createElement('div');
    bidCard.classList.add('ended-auction'); // reuse auction card style

    bidCard.innerHTML = `
      <h3>${bid.itemname || 'Listing'}</h3>
      <p><strong>Your Highest Bid:</strong> £${bid.bidamount?.toLocaleString() || '0'}</p>
    `;

    liveBidsContainer.appendChild(bidCard);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadUserBids);
