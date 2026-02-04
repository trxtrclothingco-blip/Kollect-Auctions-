// notification.js
import { db, auth } from './firebase.js';
import { collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

let currentUser = null;
let notificationsShown = {}; // Track which notifications have fired per listing

// Track logged-in user
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if(user) initNotifications();
});

// Initialize notifications after user logs in
function initNotifications() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const listingId = card.dataset.listingId || card.id; // ID must match Firestore listing doc

    // Track user's bids for this listing
    const bidsRef = collection(db, 'bids');
    const bidsQuery = query(bidsRef, where('userid', '==', currentUser.uid), where('listingid', '==', listingId), orderBy('timestamp'));

    onSnapshot(bidsQuery, snapshot => {
      if(snapshot.empty) return; // user has not bid here

      const userBid = snapshot.docs[snapshot.docs.length - 1].data(); // latest bid
      const priceEl = card.querySelector('.price-display') || card.querySelector('p strong'); 
      const countdownEl = card.querySelector('.auction-timer') || card.querySelector('.auction-length');

      if(!priceEl || !countdownEl) return;

      const checkTimer = () => {
        const diff = new Date(countdownEl.dataset.endtime || countdownEl.textContent) - new Date();
        if(diff <= 0){
          // Auction ended
          if(!notificationsShown[listingId + '_winner']){
            const currentPrice = Number(priceEl.textContent.replace(/[^\d.]/g,''));
            if(currentPrice === userBid.bidamount){
              showNotification(`You won auction: ${card.querySelector('h3').textContent}`);
            } else {
              showNotification(`Auction ended: ${card.querySelector('h3').textContent}`);
            }
            notificationsShown[listingId + '_winner'] = true;
          }
          return clearInterval(intervals[listingId]);
        }

        // 5-minute warning
        if(diff <= 5*60*1000 && !notificationsShown[listingId + '_5min']){
          showNotification(`5 minutes left for auction: ${card.querySelector('h3').textContent}`);
          notificationsShown[listingId + '_5min'] = true;
        }

        // Outbid check
        const currentPrice = Number(priceEl.textContent.replace(/[^\d.]/g,''));
        if(currentPrice > userBid.bidamount && !notificationsShown[listingId + '_outbid']){
          showNotification(`You have been outbid on: ${card.querySelector('h3').textContent}`);
          notificationsShown[listingId + '_outbid'] = true;
        }
      };

      const intervals = {};
      intervals[listingId] = setInterval(checkTimer, 1000);
    });
  });
}

// Simple mobile-friendly notification
function showNotification(msg){
  const existing = document.getElementById('live-notification');
  if(existing) existing.remove();

  const notif = document.createElement('div');
  notif.id = 'live-notification';
  notif.style.position = 'fixed';
  notif.style.top = '20px';
  notif.style.right = '20px';
  notif.style.background = '#1a1a1a';
  notif.style.color = '#FFD700';
  notif.style.border = '1px solid #FFD700';
  notif.style.padding = '12px 18px';
  notif.style.borderRadius = '6px';
  notif.style.zIndex = 9999;
  notif.style.fontWeight = 'bold';
  notif.style.animation = 'fadeInOut 3s ease forwards';
  notif.textContent = msg;

  document.body.appendChild(notif);

  setTimeout(() => notif.remove(), 3000);
}

// CSS animation
const style = document.createElement('style');
style.textContent = `
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-5px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; }
}`;
document.head.appendChild(style);
