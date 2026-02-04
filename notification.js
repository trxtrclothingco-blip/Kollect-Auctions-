// notification.js — global, works on any page
(function () {

  // Track which auctions we've notified to avoid duplicates
  const notifiedEndingSoon = new Set();
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

  // Wait until DOM is ready
  document.addEventListener("DOMContentLoaded", () => {

    // 1️⃣ Check live bids countdowns
    function checkLiveBids() {
      const liveBids = document.querySelectorAll(".bid-card"); // use your bid cards
      liveBids.forEach(bidEl => {
        const endTimeStr = bidEl.dataset.endTime || bidEl.querySelector(".countdown-timer")?.dataset.endTime;
        const title = bidEl.dataset.title || bidEl.querySelector("a")?.textContent;
        const auctionId = bidEl.dataset.auctionId;

        if (!endTimeStr || !auctionId || !title) return;

        if (notifiedEndingSoon.has(auctionId)) return;

        const endTime = new Date(endTimeStr);
        const now = new Date();
        const diff = endTime - now;

        if (diff <= 5 * 60 * 1000 && diff > 0) {
          showToast(`⚠️ Auction "${title}" ends in 5 minutes!`);
          notifiedEndingSoon.add(auctionId);
        }
      });
    }

    // Run immediately & every 30s
    checkLiveBids();
    setInterval(checkLiveBids, 30000);

    // 2️⃣ Listen for auctions the user has won
    if (window.firebase && firebase.auth && firebase.firestore) {
      const db = firebase.firestore();

      firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) return;

        // Listen for listings where the user is winner
        const wonQuery = db.collection("listings")
          .where("winnerid", "==", user.uid);

        wonQuery.onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            const auctionId = change.doc.id;
            const title = data.name || "Auction";

            if (change.type === "added" && !notifiedWon.has(auctionId)) {
              showToast(`🏆 You won the auction "${title}"!`);
              notifiedWon.add(auctionId);
            }
          });
        });
      });
    }

  });
})();
