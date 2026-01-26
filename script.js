import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const body = document.body;
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");
const productsContainer = document.getElementById("products-container");

// Burger menu
window.toggleMenu = () => document.getElementById("navMenu")?.classList.toggle("open");

// Light/Dark mode
if(localStorage.getItem("lightMode")==="true") body.classList.add("light-mode");
window.toggleMode = () => {
  const isLight = body.classList.toggle("light-mode");
  localStorage.setItem("lightMode", isLight);
};

// Logout
window.logoutUser = async () => {
  await signOut(auth);
  window.location.href = "create_account.html";
};

// Auth state
onAuthStateChanged(auth, user => {
  if(user){
    if(userStatus) userStatus.textContent = `Logged in as ${user.email}`;
    if(logoutButton) logoutButton.style.display = "inline-block";
  } else {
    if(window.location.pathname.includes("dashboard") || window.location.pathname.includes("admin")) {
      window.location.href = "create_account.html";
    }
  }
});

// Dynamic products
if(productsContainer){
  const page = body.dataset.page;
  let collectionName;
  if(page==="private_sales") collectionName="private_sales";
  else if(page==="live_auctions") collectionName="live_auctions";
  else if(page==="kollect_100") collectionName="kollect_100";

  if(collectionName){
    const q = query(collection(db, collectionName), orderBy("createdAt","desc"));
    onSnapshot(q, snapshot => {
      productsContainer.innerHTML = "";
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const card = document.createElement("div");
        card.classList.add("card");
        let priceLabel = data.priceType==="auction"?`Current Bid: £${data.price}`:`Price: £${data.price}`;
        card.innerHTML = `
          <img src="${data.image}" alt="${data.name}">
          <h3>${data.name}</h3>
          <p>${data.description}</p>
          <p>${priceLabel}</p>
          ${data.priceType==="auction"?`<button class="button">Bid</button>`:`<button class="button">Buy Now</button>`}
        `;
        productsContainer.appendChild(card);
      });
    });
  }
}
