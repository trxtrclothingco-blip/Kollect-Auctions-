import { db } from "./firebase.js";
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const page = document.body.dataset.page;
let collectionName;
if(page==="private_sales") collectionName="private_sales";
else if(page==="live_auctions") collectionName="live_auctions";
else if(page==="kollect_100") collectionName="kollect_100";
else collectionName=null;

if(collectionName){
  const container = document.getElementById("products-container");
  const q = query(collection(db,collectionName),orderBy("createdAt","desc"));
  onSnapshot(q,snapshot=>{
    container.innerHTML="";
    if(snapshot.empty){ container.innerHTML="<p>No items available yet.</p>"; return; }
    snapshot.docs.forEach(docSnap=>{
      const data = docSnap.data();
      const card = document.createElement("div");
      card.classList.add("product-card");
      card.innerHTML=`
        <img src="${data.image}" alt="${data.name}" />
        <h3>${data.name}</h3>
        <p>${data.description}</p>
        <p>Price: £${data.price} (${data.priceType})</p>
      `;
      container.appendChild(card);
    });
  });
}
