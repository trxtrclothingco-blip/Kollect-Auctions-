import { db, auth } from './firebase.js';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// DOM elements
const liveBidsContainer = document.getElementById('live-bids-container');
const wonBidsContainer = document.getElementById('won-bids-container');

function formatPrice(price) {
  if (!price && price !== 0) return '£0';
  return '£' + Number(price).toLocaleString();
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    if (liveBidsContainer) liveBidsContainer.innerHTML = '<p>Please log in to see your live bids.</p>';
    if (wonBidsContainer) wonBidsContainer.innerHTML = '<p>Please log in to see your won bids.</p>';
    return;
  }

  const userId = user.uid.toLowerCase();
  const userEmail = user.email.toLowerCase();

  // ========================
  // LIVE BIDS (highest per listing)
  // ========================
  if (liveBidsContainer) {
    const liveBidsQuery = query(
      collection(db, 'bids'),
      where('userid', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const highestBidsMap = {};

    onSnapshot(liveBidsQuery, async (snapshot) => {
      // Reset
      for (const key in highestBidsMap) delete highestBidsMap[key];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const { listingid, bidamount } = data;

        // Keep only highest bid per listing
        if (!highestBidsMap[listingid] || bidamount > highestBidsMap[listingid].bidamount) {
          highestBidsMap[listingid] = { ...data, id: docSnap.id };
        }
      });

      const bidsArray = Object.values(highestBidsMap);
      liveBidsContainer.innerHTML = '<h2>Your Live Bids</h2>';

      if (!bidsArray.length) {
        liveBidsContainer.innerHTML += '<p>No active bids yet.</p>';
        return;
      }

      // Fetch listing names and check status
      for (const bid of bidsArray) {
        const listingSnap = await getDoc(doc(db, 'listings', bid.listingid));
        if (!listingSnap.exists()) continue;
        const listing = listingSnap.data();
        if (listing.status !== 'live') continue;

        const bidCard = document.createElement('div');
        bidCard.className = 'bid-card';
        const dateStr = bid.timestamp?.seconds ? new Date(bid.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown date';
        bidCard.innerHTML = `
          <a href="item.html?id=${bid.listingid}">
            ${listing.name || bid.listingid} – ${formatPrice(bid.bidamount)} placed on ${dateStr}
          </a>
        `;
        liveBidsContainer.appendChild(bidCard);
      }
    });
  }

  // ========================
  // WON BIDS (ended auctions where user is winning bidder)
  // ========================
  if (wonBidsContainer) {
    const wonBidsQuery = query(
      collection(db, 'bids'),
      where('userid', '==', userId),
      orderBy('timestamp', 'desc')
    );

    onSnapshot(wonBidsQuery, async (snapshot) => {
      wonBidsContainer.innerHTML = '<h2>Won Bids</h2>';
      if (snapshot.empty) {
        wonBidsContainer.innerHTML += '<p>No won bids yet.</p>';
        return;
      }

      for (const docSnap of snapshot.docs) {
        const bid = docSnap.data();
        const listingSnap = await getDoc(doc(db, 'listings', bid.listingid));
        if (!listingSnap.exists()) continue;
        const listing = listingSnap.data();
        if (listing.status !== 'ended') continue;

        const bidCard = document.createElement('div');
        bidCard.className = 'bid-card';
        const dateStr = bid.timestamp?.seconds ? new Date(bid.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown date';
        bidCard.innerHTML = `
          <a href="item.html?id=${bid.listingid}">
            ${listing.name || bid.listingid} – Won for ${formatPrice(bid.bidamount)} on ${dateStr}
          </a>
        `;
        wonBidsContainer.appendChild(bidCard);
      }
    });
  }
});

// Call function on page load
document.addEventListener('DOMContentLoaded', () => {});
