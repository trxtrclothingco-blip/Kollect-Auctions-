// ------------------------
// kollect chat firestore js
// ------------------------

// grab dom elements
const chatwindow = document.getElementById("chatWindow")
const messageinput = document.getElementById("messageInput")

// ask username
let username = prompt("enter your display name:")
if (!username) username = "anonymous"

// firestore references
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js"
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"

// firebase config
const firebaseconfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
}

// initialize firebase
const app = initializeApp(firebaseconfig)
const db = getFirestore(app)

// reference kollectchat collection
const messagescol = collection(db, "kollectchat")

// query to order messages by timestamp ascending
const messagesquery = query(messagescol, orderBy("timestamp", "asc"))

// listen to messages in real-time
onSnapshot(messagesquery, snapshot => {
    chatwindow.innerHTML = "" // clear chat window
    snapshot.forEach(doc => {
        const data = doc.data()
        const message = document.createElement("div")
        message.className = "chat-message"

        const emoji = document.createElement("div")
        emoji.className = "chat-emoji"
        emoji.textContent = data.emoji || "💬"

        const bubble = document.createElement("div")
        bubble.className = "chat-bubble"

        const name = document.createElement("div")
        name.className = "chat-username"
        name.textContent = data.username || "anonymous"

        const content = document.createElement("div")
        content.textContent = data.text || ""

        bubble.appendChild(name)
        bubble.appendChild(content)
        message.appendChild(emoji)
        message.appendChild(bubble)

        chatwindow.appendChild(message)
        chatwindow.scrollTop = chatwindow.scrollHeight
    })
})

// send message function
async function sendmessage() {
    const text = messageinput.value.trim()
    if (!text) return

    await addDoc(messagescol, {
        username: username,
        text: text,
        emoji: "💬",
        timestamp: serverTimestamp()
    })

    messageinput.value = ""
}

// enter key sends message
messageinput.addEventListener("keydown", e => {
    if (e.key === "enter") sendmessage()
})
