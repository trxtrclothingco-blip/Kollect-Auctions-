// =====================
// BURGER MENU TOGGLE
// =====================
function toggleMenu() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.toggle('open');
}

// =====================
// LIGHT / DARK MODE TOGGLE WITH IMAGE SWITCH
// =====================
function toggleMode() {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('lightMode', document.body.classList.contains('light-mode'));
  updateHeroImages();
}

// =====================
// HERO IMAGE SWITCHER
// =====================
function updateHeroImages() {
  const heroImages = document.querySelectorAll('.hero-image');
  heroImages.forEach(img => {
    if (document.body.classList.contains('light-mode')) {
      img.src = 'IMG_1558.jpeg'; // Light mode
    } else {
      img.src = 'IMG_1604.jpeg'; // Dark mode
    }
  });
}

// =====================
// INITIALIZE MODE ON PAGE LOAD
// =====================
window.addEventListener('DOMContentLoaded', () => {
  if(localStorage.getItem('lightMode') === 'true'){
    document.body.classList.add('light-mode');
  }
  updateHeroImages();
});

// =====================
// FIREBASE AUTH & USER STATE
// =====================
import { auth, db, serverTimestamp } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Update login status and show/hide logout button
onAuthStateChanged(auth, user => {
  const userStatus = document.getElementById('user-status');
  const logoutButton = document.getElementById('logout-button');
  const loginForm = document.getElementById('login-form');

  if(user){
    if(userStatus) userStatus.textContent = `Logged in as: ${user.email}`;
    if(loginForm) loginForm.style.display = 'none';
    if(logoutButton) logoutButton.style.display = 'inline-block';
  } else {
    if(userStatus) userStatus.textContent = 'Not logged in';
    if(loginForm) loginForm.style.display = 'block';
    if(logoutButton) logoutButton.style.display = 'none';
  }
});

// =====================
// LOGOUT BUTTON
// =====================
const logoutButton = document.getElementById('logout-button');
if(logoutButton){
  logoutButton.addEventListener('click', async () => {
    try {
      await signOut(auth);
      alert('Logged out successfully!');
    } catch(err) {
      console.error('Logout error:', err.message);
      alert('Error logging out: ' + err.message);
    }
  });
}

// =====================
// SIGN-UP FORM
// =====================
const signupForm = document.getElementById('signup-form');
if(signupForm){
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();

    const firstName = document.getElementById('signup-firstname').value;
    const lastName = document.getElementById('signup-lastname').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const contact = document.getElementById('signup-contact').value;
    const address1 = document.getElementById('signup-address1').value;
    const address2 = document.getElementById('signup-address2').value;
    const city = document.getElementById('signup-city').value;
    const postcode = document.getElementById('signup-postcode').value;

    if(password !== confirmPassword){
      alert('Passwords do not match!');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional info to Firestore
      await db.collection('users').doc(user.uid).set({
        firstName,
        lastName,
        email,
        contact,
        address: { line1: address1, line2: address2, city, postcode },
        createdAt: serverTimestamp()
      });

      alert('Account created successfully!');
      signupForm.reset();
    } catch(err){
      console.error('Sign-up error:', err.message);
      alert('Error: ' + err.message);
    }
  });
}

// =====================
// LOGIN FORM
// =====================
const loginForm = document.getElementById('login-form');
if(loginForm){
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try{
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful!');
      loginForm.reset();
    } catch(err){
      console.error('Login error:', err.message);
      alert('Error: ' + err.message);
    }
  });
}
