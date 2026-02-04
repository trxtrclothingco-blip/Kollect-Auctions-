// global.js
(function() {
  // Make sure Firebase is loaded
  if (!firebase || !firebase.auth || !firebase.firestore) return;

  const db = firebase.firestore();

  // Helper function to show toast notifications
  function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    toast.style.zIndex = 9999;
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';

    document.body.appendChild(toast);

    // Fade in
    setTimeout(() => { toast.style.opacity = '1'; }, 50);
    // Fade out and remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  // Listen for auth state
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;

    const userId = user.uid;

    // Function to check live bids and send notifications
    async function checkEndingSoonAuctions() {
      try {
        // 1. Get all auctions the user has bid on from live bids dashboard
        const liveBidsSnapshot = await db.collection('bids')
          .where('userId', '==', userId)
          .get();

        // Keep track of auctions already notified to avoid repeat
        const notifiedAuctions = new Set();

        liveBidsSnapshot.forEach(async (bidDoc) => {
          const bidData = bidDoc.data();
          const auctionId = bidData.auctionId;

          // Get auction info
          const auctionDoc = await db.collection('auctions').doc(auctionId).get();
          if (!auctionDoc.exists) return;
          const auction = auctionDoc.data();

          if (auction.status !== 'active') return;

          const timeLeftMs = auction.endTime.toDate() - new Date();
          const fiveMinutesMs = 5 * 60 * 1000;

          // If less than 5 minutes left and not yet notified
          if (timeLeftMs <= fiveMinutesMs && timeLeftMs > 0 && !notifiedAuctions.has(auctionId)) {
            showToast(`⚠️ Auction "${auction.title}" ends in 5 minutes!`);
            notifiedAuctions.add(auctionId);
          }
        });
      } catch (err) {
        console.error('Error checking ending soon auctions:', err);
      }
    }

    // Check every 30 seconds
    setInterval(checkEndingSoonAuctions, 30000);
    // Run immediately on load
    checkEndingSoonAuctions();
  });
})();
