// firebase.js
// --------------------
// Modular Firebase Setup
// --------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Your Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCGfejcFwdLTKow_yPptWfbdyrcc2b6dNc",
  authDomain: "kollectauctions-b9de9.firebaseapp.com",
  projectId: "kollectauctions-b9de9",
  storageBucket: "kollectauctions-b9de9.appspot.com",
  messagingSenderId: "185844480439",
  appId: "1:185844480439:web:36de485ff58fcca2cc5032",
  measurementId: "G-DJ0NLNG2LN"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("Firebase initialized ✅");
