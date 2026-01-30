import { db, auth } from './firebase.js';
import { collection, query, where, onSnapshot, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const liveBidsContainer = document.getElementById('user-live-bids');

function loadUserBids() {
  auth.onAuthStateChanged(user => {
    if (!user) {
      liveBidsContainer.innerHTML = '<p>Please log in to see your bids.</p>';
      return;
    }

    // Query all bids by this user, order by timestamp descending
    const userBidsQuery = query(
      collection(db, 'bids'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const highestBidsMap = {};

    // Real-time updates
    onSnapshot(userBidsQuery, snapshot => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const { itemId, bidAmount } = data;

        // Keep only highest bid per item
        if (!highestBidsMap[itemId] || bidAmount > highestBidsMap[itemId].bidAmount) {
          highestBidsMap[itemId] = { ...data, id: doc.id };
        }
      });

      // Render
      renderUserBids(Object.values(highestBidsMap));
    });
  });
}

function renderUserBids(bids) {
  if (!bids.length) {
    liveBidsContainer.innerHTML = '<p>You have not placed any bids yet.</p>';
    return;
  }

  liveBidsContainer.innerHTML = ''; // clear
  bids.forEach(bid => {
    const bidCard = document.createElement('div');
    bidCard.classList.add('ended-auction'); // reuse your auction card style

    bidCard.innerHTML = `
      <h3>Item ID: ${bid.itemId}</h3>
      <p><strong>Your Highest Bid:</strong> £${bid.bidAmount.toLocaleString()}</p>
    `;
    liveBidsContainer.appendChild(bidCard);
  });
}

// Call this on page load
document.addEventListener('DOMContentLoaded', loadUserBids);
