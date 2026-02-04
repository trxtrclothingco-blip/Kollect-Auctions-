// ------------------------
// kollect chat firestore js with replies, mentions, timestamps, reactions, active users, pin
// ------------------------

// import firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { getFirestore, collection, doc, getDoc, addDoc, setDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
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

// ------------------------
// 2️⃣ initialize firebase
// ------------------------
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// ------------------------
// 3️⃣ dom elements
// ------------------------
const chatWindow = document.getElementById("chatWindow");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const activeUserCountDiv = document.getElementById("activeUserCount");
const pinnedInput = document.getElementById("pinnedInput");

// ------------------------
// 4️⃣ firestore references
// ------------------------
const messagesCol = collection(db, "kollectchat");
const messagesQuery = query(messagesCol, orderBy("timestamp", "asc"));
const usersCol = collection(db, "users");
const activeUsersCol = collection(db, "kollectchatActiveUsers");
const pinnedDoc = doc(db, "kollectchatMeta", "pinnedMessage");

// ------------------------
// 5️⃣ cached user state
// ------------------------
let userFirstName = "anonymous";
let userProfilePic = "";
let currentUserUid = "";
let replyToMessage = null;

// ------------------------
// 6️⃣ admin UID
// ------------------------
const adminUid = "gBrbEobcS5RCG47acE5ySqxO8yB2";

// ------------------------
// 7️⃣ handle auth state changes
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

    if (currentUserUid === adminUid) pinnedInput.style.display = "block";

    // add user to active users
    await setDoc(doc(activeUsersCol, currentUserUid), { username: userFirstName, lastActive: serverTimestamp() });

    // remove user from active users on disconnect
    window.addEventListener("beforeunload", async () => {
      await deleteDoc(doc(activeUsersCol, currentUserUid));
    });

  } else {
    currentUserUid = "";
    userFirstName = "anonymous";
    userProfilePic = "";
    input.disabled = true;
    sendButton.disabled = true;
    input.placeholder = "Log in to post messages…";
    pinnedInput.style.display = "none";
  }
});

// ------------------------
// 8️⃣ listen to messages in real-time
// ------------------------
onSnapshot(messagesQuery, snapshot => {
  chatWindow.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const message = document.createElement("div");
    message.className = "chat-message";

    // emoji
    const emoji = document.createElement("div");
    emoji.className = "chat-emoji";
    emoji.textContent = data.emoji || "💬";

    // bubble
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    // username
    const name = document.createElement("div");
    name.className = "chat-username";
    name.textContent = data.username || "anonymous";

    // timestamp
    const timestamp = document.createElement("div");
    timestamp.className = "chat-timestamp";
    if (data.timestamp?.toDate) timestamp.textContent = data.timestamp.toDate().toLocaleString();

    // message content
    const content = document.createElement("div");
    content.textContent = data.text || "";

    // highlight mentions
    if (currentUserUid && data.text?.includes(`@${userFirstName}`)) bubble.style.backgroundColor = "rgba(255,255,0,0.2)";

    // reply (if present)
    if (data.replyTo) {
      const replyDiv = document.createElement("div");
      replyDiv.className = "chat-reply";
      replyDiv.textContent = `↪ Replying to ${data.replyTo.username}: ${data.replyTo.text.split("\n")[0]}`;
      replyDiv.style.cursor = "pointer";
      // click to reply
      replyDiv.onclick = () => {
        input.value = `@${data.username} `;
        replyToMessage = { username: data.replyTo.username, text: data.replyTo.text.split("\n")[0] };
        input.focus();
      };
      bubble.appendChild(replyDiv);
    }

    // clickable reply arrow
    const replyArrow = document.createElement("div");
    replyArrow.className = "chat-reply";
    replyArrow.textContent = "↩ Reply";
    replyArrow.style.cursor = "pointer";
    replyArrow.onclick = () => {
      input.value = `@${data.username} `;
      replyToMessage = { username: data.username, text: data.text.split("\n")[0] };
      input.focus();
    };
    bubble.appendChild(replyArrow);

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

    // reactions
    const reactionsDiv = document.createElement("div");
    reactionsDiv.className = "chat-reactions";
    reactionsDiv.style.marginTop = "4px";
    reactionsDiv.style.display = "flex";
    reactionsDiv.style.gap = "4px";

    // render reactions
    ["👍","❤️","😂"].forEach(emojiChar => {
      const span = document.createElement("span");
      span.textContent = `${emojiChar} ${data.reactions?.[emojiChar] || ""}`;
      span.style.cursor = "pointer";
      span.onclick = async () => {
        const docRef = doc(db, "kollectchat", docSnap.id);
        const updatedReactions = { ...(data.reactions || {}) };
        updatedReactions[emojiChar] = (updatedReactions[emojiChar] || 0) + 1;
        await updateDoc(docRef, { reactions: updatedReactions });
      };
      reactionsDiv.appendChild(span);
    });

    bubble.appendChild(reactionsDiv);

    message.appendChild(profileImg);
    message.appendChild(emoji);
    message.appendChild(bubble);

    chatWindow.appendChild(message);
  });

  chatWindow.scrollTop = chatWindow.scrollHeight;
});

// ------------------------
// 9️⃣ send message
// ------------------------
async function sendMessage() {
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

  if (replyToMessage) messageData.replyTo = replyToMessage;

  await addDoc(messagesCol, messageData);

  input.value = "";
  replyToMessage = null;
}

// ------------------------
// 🔟 event listeners
// ------------------------
sendButton.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

// ------------------------
// 1️⃣1️⃣ active users presence
// ------------------------
onSnapshot(activeUsersCol, snapshot => {
  activeUserCountDiv.textContent = `Active users: ${snapshot.size}`;
});

// ------------------------
// 1️⃣2️⃣ admin pinned message
// ------------------------
pinnedInput.addEventListener("keydown", async e => {
  if (e.key === "Enter" && currentUserUid === adminUid) {
    await setDoc(pinnedDoc, {
      text: pinnedInput.value.trim(),
      timestamp: serverTimestamp()
    });
    pinnedInput.value = "";
  }
});
