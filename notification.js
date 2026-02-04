// notification.js — site-wide
(function() {
  const notifiedEndingSoon = new Set();
  const notifiedOutbid = new Set();
  const notifiedWon = new Set();

  function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
      position:fixed;
      bottom:20px;
      right:20px;
      background:#333;
      color:#fff;
      padding:12px 18px;
      border-radius:6px;
      z-index:9999;
      font-size:14px;
      opacity:0;
      transition:opacity .3s;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = 1, 50);
    setTimeout(() => {
      toast.style.opacity = 0;
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async function initNotifications() {
    const { db, auth } = window._firebase;
    if (!db || !auth) return;

    onAuthStateChanged(auth, async (user) => {
      if (!user) return; // not logged in

      const userId = user.uid;

      // --- Listen to all user's bids ---
      const userBidsQuery = query(collection(db, "bids"), where("userid", "==", userId));
      onSnapshot(userBidsQuery, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const bidData = change.doc.data();
          const listingId = bidData.listingid;

          // Fetch listing info
          const listingDoc = await getDoc(doc(db, "listings", listingId));
          if (!listingDoc.exists()) return;
          const listing = listingDoc.data();

          const auctionTitle = listing.name || "Auction";
          const auctionEndTime = listing.auctionend?.toDate ? listing.auctionend.toDate() : new Date(listing.auctionend);
          const now = new Date();

          // --- 5 minutes left notification ---
          const diffMs = auctionEndTime - now;
          if (diffMs <= 5*60*1000 && diffMs > 0 && !notifiedEndingSoon.has(listingId)) {
            showToast(`⚠️ Auction "${auctionTitle}" ends in 5 minutes!`);
            notifiedEndingSoon.add(listingId);
          }

          // --- Outbid check ---
          const allBidsQuery = query(collection(db, "bids"), where("listingid", "==", listingId));
          onSnapshot(allBidsQuery, (bidsSnap) => {
            let highestBid = 0;
            let yourBid = 0;
            bidsSnap.forEach(doc => {
              const b = doc.data();
              if (b.bidamount > highestBid) highestBid = b.bidamount;
              if (b.userid === userId) yourBid = b.bidamount;
            });

            if (highestBid > yourBid && yourBid > 0 && !notifiedOutbid.has(listingId)) {
              showToast(`💔 You have been outbid on "${auctionTitle}"!`);
              notifiedOutbid.add(listingId);
            }
          });

          // --- Winner notification ---
          if (listing.winnerid === userId && !notifiedWon.has(listingId)) {
            showToast(`🏆 You won the auction "${auctionTitle}"!`);
            notifiedWon.add(listingId);
          }
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initNotifications);
})();
