// ------------------------
// kollect chat firestore js with replies, mentions, timestamps, reactions, active users, pin
// ------------------------

// import firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { getFirestore, collection, doc, getDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
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
const pinnedDoc = doc(db, "kollectchatMeta", "pinnedMessage");

// ------------------------
// 4️⃣ cached user state
// ------------------------
let userFirstName = "anonymous";
let userProfilePic = "";
let currentUserUid = "";
let activeUsers = new Set();

// disable input/send by default
input.disabled = true;
sendButton.disabled = true;
input.placeholder = "Log in to post messages";

// ------------------------
// 5️⃣ handle auth state changes
// ------------------------
onAuthStateChanged(auth, async user => {
    if (user) {
        currentUserUid = user.uid;
        const userDocRef = doc(usersCol, user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            userFirstName = data.firstName || "anonymous";
            userProfilePic = data.profilepicurl || "";
        }
        input.disabled = false;
        sendButton.disabled = false;
        input.placeholder = "Type a message… 😎🔥💎";
    } else {
        currentUserUid = "";
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
    chatWindow.innerHTML = "";

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const message = document.createElement("div");
        message.className = "chat-message";

        // ---------- emoji reaction ----------
        const emoji = document.createElement("div");
        emoji.className = "chat-emoji";
        emoji.textContent = data.emoji || "💬";

        // ---------- bubble ----------
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble";

        // username
        const name = document.createElement("div");
        name.className = "chat-username";
        name.textContent = data.username || "anonymous";

        // timestamp
        const timestamp = document.createElement("div");
        timestamp.className = "chat-timestamp";
        if (data.timestamp?.toDate) {
            timestamp.textContent = data.timestamp.toDate().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
        }

        // message content
        const content = document.createElement("div");
        content.textContent = data.text || "";

        // highlight mentions
        if (currentUserUid && data.text?.includes(`@${userFirstName}`)) {
            bubble.style.backgroundColor = "rgba(255,255,0,0.2)";
        }

        // reply (if present)
        if (data.replyTo) {
            const replyDiv = document.createElement("div");
            replyDiv.className = "chat-reply";
            replyDiv.textContent = `↪ ${data.replyTo.username}: ${data.replyTo.text}`;
            replyDiv.style.fontSize = "10px";
            replyDiv.style.opacity = 0.6;
            bubble.appendChild(replyDiv);
        }

        bubble.appendChild(name);
        bubble.appendChild(content);
        bubble.appendChild(timestamp);

        // profile pic
        const profileImg = document.createElement("img");
        profileImg.src = data.profilepicurl || "https://via.placeholder.com/36";
        profileImg.style.width = "36px";
        profileImg.style.height = "36px";
        profileImg.style.borderRadius = "50%";
        profileImg.style.marginRight = "10px";

        // reactions container
        const reactionsDiv = document.createElement("div");
        reactionsDiv.className = "chat-reactions";
        reactionsDiv.style.marginTop = "4px";
        reactionsDiv.style.display = "flex";
        reactionsDiv.style.gap = "4px";

        // render reactions
        if (data.reactions) {
            for (const [emojiKey, count] of Object.entries(data.reactions)) {
                const reactBtn = document.createElement("span");
                reactBtn.textContent = `${emojiKey} ${count}`;
                reactBtn.style.cursor = "pointer";
                reactBtn.onclick = async () => {
                    const docRef = doc(db, "kollectchat", docSnap.id);
                    const reactionsUpdate = { [`reactions.${emojiKey}`]: (count + 1) };
                    await updateDoc(docRef, reactionsUpdate);
                };
                reactionsDiv.appendChild(reactBtn);
            }
        }

        // add default react button
        const addReaction = document.createElement("span");
        addReaction.textContent = "❤️";
        addReaction.style.cursor = "pointer";
        addReaction.onclick = async () => {
            const docRef = doc(db, "kollectchat", docSnap.id);
            const reactionsUpdate = { [`reactions.❤️`]: (data.reactions?.['❤️'] || 0) + 1 };
            await updateDoc(docRef, reactionsUpdate);
        };
        reactionsDiv.appendChild(addReaction);

        bubble.appendChild(reactionsDiv);

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
async function sendMessage(replyTo = null) {
    if (!auth.currentUser) return;

    const text = input.value.trim();
    if (!text) return;

    const messageData = {
        username: userFirstName,
        uid: currentUserUid,
        profilepicurl: userProfilePic,
        text: text,
        emoji: "💬",
        timestamp: serverTimestamp()
    };

    if (replyTo) {
        messageData.replyTo = replyTo;
    }

    await addDoc(messagesCol, messageData);
    input.value = "";
}

// ------------------------
// 8️⃣ event listeners
// ------------------------
sendButton.addEventListener("click", () => sendMessage());
input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
});

// ------------------------
// 9️⃣ Active users (simple)
// ------------------------
onSnapshot(usersCol, snapshot => {
    activeUsers.clear();
    snapshot.forEach(u => {
        if (u.data()?.firstName) activeUsers.add(u.id);
    });
    document.getElementById("activeUserCount")?.remove();
    const countDiv = document.createElement("div");
    countDiv.id = "activeUserCount";
    countDiv.textContent = `Active users: ${activeUsers.size}`;
    chatWindow.parentNode.insertBefore(countDiv, chatWindow);
});

// ------------------------
// 10️⃣ Pin message (admin only)
// ------------------------
async function updatePinnedMessage(message) {
    if (currentUserUid !== "gBrbEobcS5RCG47acE5ySqxO8yB2") return;
    await updateDoc(pinnedDoc, {
        pinned: message,
        timestamp: serverTimestamp()
    });
}

// Only show pinned input for you
if (currentUserUid === "gBrbEobcS5RCG47acE5ySqxO8yB2") {
    const pinnedInput = document.createElement("input");
    pinnedInput.placeholder = "Pin a message…";
    pinnedInput.style.marginBottom = "8px";
    pinnedInput.addEventListener("keydown", async e => {
        if (e.key === "Enter") {
            await updatePinnedMessage(pinnedInput.value);
            pinnedInput.value = "";
        }
    });
    chatWindow.parentNode.insertBefore(pinnedInput, chatWindow);
}
