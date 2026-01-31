import { db, auth } from './firebase.js';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  getDocs
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// DOM elements
const liveBidsContainer = document.getElementById('live-bids-container');
const wonBidsContainer = document.getElementById('won-bids-container');
const bidsList = document.getElementById('bids-list');
const endedAuctionsList = document.getElementById('ended-auctions-list');
const itemsList = document.getElementById('items-list');
const itemForm = document.getElementById('item-form');

function formatPrice(price) {
  if (!price && price !== 0) return '£0';
  return '£' + Number(price).toLocaleString();
}

// ========================
// ADMIN BIDS AND AUCTIONS
// ========================
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  const userId = user.uid.toLowerCase();

  // -------------------
  // All live bids
  // -------------------
  if (bidsList) {
    const bidsQuery = query(collection(db, 'bids'), orderBy('timestamp', 'desc'));
    onSnapshot(bidsQuery, async snapshot => {
      bidsList.innerHTML = '';
      if (snapshot.empty) {
        bidsList.innerHTML = '<p>No bids found.</p>';
        return;
      }

      for (const docSnap of snapshot.docs) {
        const bid = docSnap.data();
        const listingSnap = await getDoc(doc(db, 'listings', bid.listingid));
        const listing = listingSnap.exists() ? listingSnap.data() : { name: 'Unknown', status: 'unknown' };
        const dateStr = bid.timestamp?.seconds ? new Date(bid.timestamp.seconds * 1000).toLocaleString() : 'Unknown date';
        const bidCard = document.createElement('div');
        bidCard.className = 'bid-card';
        bidCard.innerHTML = `
          <strong>${listing.name}</strong> – ${formatPrice(bid.bidamount)} by ${bid.userid} (${listing.status}) on ${dateStr}
        `;
        bidsList.appendChild(bidCard);
      }
    });
  }

  // -------------------
  // Ended auctions
  // -------------------
  if (endedAuctionsList) {
    const endedQuery = query(collection(db, 'listings'), where('status', '==', 'ended'), orderBy('endedat', 'desc'));
    onSnapshot(endedQuery, snapshot => {
      endedAuctionsList.innerHTML = '';
      if (snapshot.empty) {
        endedAuctionsList.innerHTML = '<p>No ended auctions found.</p>';
        return;
      }

      snapshot.docs.forEach(listingSnap => {
        const listing = listingSnap.data();
        const endDate = listing.endedat ? new Date(listing.endedat.seconds * 1000).toLocaleString() : 'Unknown';
        const card = document.createElement('div');
        card.className = 'bid-card';
        card.innerHTML = `
          <strong>${listing.name}</strong> – Ended on ${endDate} – Winner: ${listing.winnerid || 'N/A'} – Winning Bid: ${formatPrice(listing.winningbid || 0)}
        `;
        endedAuctionsList.appendChild(card);
      });
    });
  }

  // -------------------
  // Load all products for editing
  // -------------------
  if (itemsList) {
    const listingsSnap = await getDocs(collection(db, 'listings'));
    itemsList.innerHTML = '';
    listingsSnap.forEach(docSnap => {
      const listing = docSnap.data();
      const card = document.createElement('div');
      card.className = 'bid-card';
      card.innerHTML = `
        <strong>${listing.name}</strong> – ${formatPrice(listing.price || 0)}
        <button data-id="${docSnap.id}" class="edit-item-btn">Edit</button>
      `;
      itemsList.appendChild(card);
    });

    // Edit button click
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const docSnap = await getDoc(doc(db, 'listings', id));
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        itemForm.item_id.value = id;
        itemForm.item_name.value = data.name || '';
        itemForm.item_description.value = data.description || '';
        itemForm.item_price.value = data.price || '';
        itemForm.price_type.value = data.price_type || 'fixed';
        itemForm.sale_type.value = data.sale_type || '';
        itemForm.auctionstart.value = data.auctionstart || '';
        itemForm.auctionend.value = data.auctionend || '';
      });
    });
  }
});

// -------------------
// Item form submit
// -------------------
if (itemForm) {
  itemForm.addEventListener('submit', async e => {
    e.preventDefault();
    const id = itemForm.item_id.value || null;
    const name = itemForm.item_name.value;
    const description = itemForm.item_description.value;
    const price = Number(itemForm.item_price.value);
    const price_type = itemForm.price_type.value;
    const sale_type = itemForm.sale_type.value;
    const auctionstart = itemForm.auctionstart.value || null;
    const auctionend = itemForm.auctionend.value || null;

    const docData = { name, description, price, price_type, sale_type, auctionstart, auctionend, status: sale_type === 'live_auctions' ? 'live' : 'active' };

    if (id) {
      await updateDoc(doc(db, 'listings', id), docData);
      alert('Item updated successfully.');
    } else {
      await setDoc(doc(collection(db, 'listings')), docData);
      alert('Item added successfully.');
    }

    itemForm.reset();
  });
}
