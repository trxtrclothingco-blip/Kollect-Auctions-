// ------------------------
// kollect chat firestore js using cached firstName + profilepicurl
// ------------------------

// import firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { getFirestore, collection, doc, getDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// ------------------------
// 1️⃣ firebase config
// ------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCGfejcFwdLTKow_yPptWfbdyrcc2b6dNc",
  authDomain: "kollectauctions-b9de9.firebaseapp.com",
  projectId: "kollectauctions-b9de9",
  storageBucket: "kollectauctions-b9de9.firebasestorage.app",
  messagingSenderId: "185844480439",
  appId: "1:185844480439:web:36de485ff58fcca2cc5032",
  measurementId: "G-DJ0NLNG2LN"
};

// initialize firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// ------------------------
// 2️⃣ dom elements
// ------------------------
const chatWindow = document.getElementById("chatWindow");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// ------------------------
// 3️⃣ firestore references
// ------------------------
const messagesCol = collection(db, "kollectchat");
const messagesQuery = query(messagesCol, orderBy("timestamp", "asc"));
const usersCol = collection(db, "users");

// ------------------------
// 4️⃣ cached user state
// ------------------------
let userFirstName = "anonymous";
let userProfilePic = "";

// disable input/send by default
input.disabled = true;
sendButton.disabled = true;
input.placeholder = "Log in to post messages";

// ------------------------
// 5️⃣ handle auth state changes
// ------------------------
onAuthStateChanged(auth, async user => {
  if (user) {
    const userDocRef = doc(usersCol, user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      userFirstName = data.firstName || "anonymous";
      userProfilePic = data.profilepicurl || "";
    } else {
      userFirstName = "anonymous";
      userProfilePic = "";
    }

    input.disabled = false;
    sendButton.disabled = false;
    input.placeholder = "Type a message… 😎🔥💎";
  } else {
    userFirstName = "anonymous";
    userProfilePic = "";
    input.disabled = true;
    sendButton.disabled = true;
    input.placeholder = "Log in to post messages";
  }
});

// ------------------------
// 6️⃣ listen to messages in real-time
// ------------------------
onSnapshot(messagesQuery, snapshot => {
  chatWindow.innerHTML = ""; // clear chat window

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const message = document.createElement("div");
    message.className = "chat-message";

    const emoji = document.createElement("div");
    emoji.className = "chat-emoji";
    emoji.textContent = data.emoji || "💬";

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    const name = document.createElement("div");
    name.className = "chat-username";
    name.textContent = data.username || "anonymous";

    const content = document.createElement("div");
    content.textContent = data.text || "";

    bubble.appendChild(name);
    bubble.appendChild(content);

    const profileImg = document.createElement("img");
    profileImg.src = data.profilepicurl || "https://via.placeholder.com/36";
    profileImg.style.width = "36px";
    profileImg.style.height = "36px";
    profileImg.style.borderRadius = "50%";
    profileImg.style.marginRight = "10px";

    message.appendChild(profileImg);
    message.appendChild(emoji);
    message.appendChild(bubble);

    chatWindow.appendChild(message);
  });

  chatWindow.scrollTop = chatWindow.scrollHeight;
});

// ------------------------
// 7️⃣ send message function
// ------------------------
async function sendMessage() {
  if (!auth.currentUser) return;

  const text = input.value.trim();
  if (!text) return;

  await addDoc(messagesCol, {
    username: userFirstName,
    uid: auth.currentUser.uid,
    profilepicurl: userProfilePic,
    text: text,
    emoji: "💬",
    timestamp: serverTimestamp()
  });

  input.value = "";
}

// ------------------------
// 8️⃣ event listeners
// ------------------------
sendButton.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});
