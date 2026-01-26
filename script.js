import { db, auth } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ---------- DOM ----------
const body = document.body;
const userStatus = document.getElementById("user-status");
const logoutButton = document.getElementById("logout-button");
const productsContainer = document.getElementById("products-container");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const typeSelect = document.getElementById("typeSelect");

// ---------- Burger Menu ----------
window.toggleMenu = () => document.getElementById("navMenu")?.classList.toggle("open");

// ---------- Light/Dark Mode ----------
if(localStorage.getItem("lightMode")==="true") body.classList.add("light-mode");
window.toggleMode = ()=>{
  const isLight = body.classList.toggle("light-mode");
  localStorage.setItem("lightMode", isLight);
};

// ---------- Logout ----------
window.logoutUser = async ()=>{
  try{ await signOut(auth); window.location.href="create_account.html"; }
  catch(e){ console.error("Logout failed:", e); }
};

// ---------- Auth & User Status ----------
onAuthStateChanged(auth,user=>{
  if(user){
    if(userStatus) userStatus.textContent = `Logged in as ${user.email}`;
    if(logoutButton) logoutButton.style.display="inline-block";
  } else {
    if(window.location.pathname.includes("dashboard")||window.location.pathname.includes("admin")){
      window.location.href="create_account.html";
    }
  }
});

// ---------- Dynamic Products ----------
if(productsContainer){
  const page = body.dataset.page;
  let collectionName;
  if(page==="private_sales") collectionName="private_sales";
  else if(page==="live_auctions") collectionName="live_auctions";
  else if(page==="kollect_100") collectionName="kollect_100";
  if(collectionName){
    const q = query(collection(db,collectionName),orderBy("createdAt","desc"));
    onSnapshot(q,snapshot=>{
      productsContainer.innerHTML="";
      if(snapshot.empty){ productsContainer.innerHTML="<p>No items available yet.</p>"; return; }
      snapshot.docs.forEach(docSnap=>{
        const data = docSnap.data();
        const card = document.createElement("div");
        card.classList.add("card");
        let priceLabel = data.priceType==="auction"?`Current Bid: £${data.price}`:`Price: £${data.price}`;
        card.innerHTML=`
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

// ---------- Search Filtering ----------
const searchBtn = document.getElementById("searchBtn");
if(searchBtn){
  searchBtn.addEventListener("click",()=>{
    const filterName = searchInput.value.toLowerCase();
    const category = categorySelect.value;
    const type = typeSelect.value;
    const cards = document.querySelectorAll(".card");
    cards.forEach(card=>{
      const name = card.querySelector("h3")?.textContent.toLowerCase() || "";
      const priceLabel = card.querySelector("p:nth-of-type(2)")?.textContent.toLowerCase() || "";
      let show=true;
      if(filterName && !name.includes(filterName)) show=false;
      if(type && !priceLabel.includes(type)) show=false;
      if(category && !priceLabel.includes(category)) show=false;
      card.style.display=show?"block":"none";
    });
  });
}

// ---------- Auction Results Pagination ----------
const resultsContainer = document.getElementById("results-container");
if(resultsContainer){
  const perPage = 50;
  let currentPage=1;
  const allResults=[];
  const q = query(collection(db,"ended_auctions"), orderBy("endedAt","desc"));
  onSnapshot(q,snapshot=>{
    allResults.length=0;
    snapshot.docs.forEach(docSnap=>{ allResults.push(docSnap.data()); });
    renderPage(currentPage);
  });
  function renderPage(pageNum){
    resultsContainer.innerHTML="";
    const start=(pageNum-1)*perPage;
    const end=start+perPage;
    const pageResults = allResults.slice(start,end);
    pageResults.forEach(res=>{
      const div = document.createElement("div");
      div.classList.add("card");
      div.innerHTML=`
        <h3>${res.itemName}</h3>
        <p>Winner: ${res.winner}</p>
        <p>Final Bid: £${res.finalBid}</p>
      `;
      resultsContainer.appendChild(div);
    });
    renderPagination();
  }
  function renderPagination(){
    const pagination = document.getElementById("pagination");
    if(!pagination) return;
    pagination.innerHTML="";
    const totalPages = Math.ceil(allResults.length/perPage);
    for(let i=1;i<=totalPages;i++){
      const btn=document.createElement("button");
      btn.textContent=i;
      btn.classList.add("button");
      if(i===currentPage) btn.disabled=true;
      btn.onclick=()=>{ currentPage=i; renderPage(currentPage); };
      pagination.appendChild(btn);
    }
  }
}
