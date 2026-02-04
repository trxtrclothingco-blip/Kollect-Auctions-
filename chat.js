// ------------------------
// kollect chat firestore js with persistent usernames
// ------------------------

// import firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// ------------------------
// 1️⃣ firebase config (your actual keys)
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
// 4️⃣ user state
// ------------------------
let username = "anonymous";

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

        // if user exists, load username
        if (userSnap.exists()) {
            username = userSnap.data().username || "anonymous";
        } else {
            // first time: ask user for a persistent username
            let chosenName = "";
            while (!chosenName) {
                chosenName = prompt("Choose a username (will be permanent):");
            }
            username = chosenName;
            await setDoc(userDocRef, {
                username: chosenName,
                createdAt: serverTimestamp()
            });
        }

        // enable chat input
        input.disabled = false;
        sendButton.disabled = false;
        input.placeholder = "Type a message… 😎🔥💎";

    } else {
        username = "anonymous";
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
    snapshot.forEach(doc => {
        const data = doc.data();

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
        message.appendChild(emoji);
        message.appendChild(bubble);

        chatWindow.appendChild(message);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });
});

// ------------------------
// 7️⃣ send message function
// ------------------------
async function sendMessage() {
    if (!auth.currentUser) return; // prevent sending if not logged in

    const text = input.value.trim();
    if (!text) return;

    await addDoc(messagesCol, {
        username: username,
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
