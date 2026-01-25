// =====================
// BURGER MENU TOGGLE
// =====================
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    menu.classList.toggle('open');
}

// =====================
// LIGHT / DARK MODE TOGGLE WITH IMAGE SWITCH
// =====================
function toggleMode() {
    // Toggle light mode class
    document.body.classList.toggle('light-mode');

    // Save preference
    localStorage.setItem('lightMode', document.body.classList.contains('light-mode'));

    // Update hero images
    updateHeroImages();
}

// =====================
// HERO IMAGE SWITCHER
// =====================
function updateHeroImages() {
    const heroImages = document.querySelectorAll('.hero-image');
    heroImages.forEach(img => {
        if (document.body.classList.contains('light-mode')) {
            img.src = 'IMG_1558.jpeg'; // Light mode image
        } else {
            img.src = 'IMG_1604.jpeg'; // Dark mode image
        }
    });
}

// =====================
// INITIALIZE MODE ON PAGE LOAD
// =====================
window.onload = () => {
    // Apply saved mode
    if(localStorage.getItem('lightMode') === 'true') {
        document.body.classList.add('light-mode');
    }

    // Update images on page load
    updateHeroImages();
};

// =====================
// OPTIONAL: CALL UPDATE WHEN RESIZING OR DYNAMIC CONTENT LOADED
// =====================
// window.addEventListener('resize', updateHeroImages);

// =====================
// FIREBASE AUTH & USER STATE
// =====================
import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// User State Observer
onAuthStateChanged(auth, (user) => {
    const userStatus = document.getElementById('user-status');
    const logoutButton = document.getElementById('logout-button');
    const loginForm = document.getElementById('login-form');

    if (user) {
        // User is signed in
        console.log('Current user:', user);
        if(userStatus) userStatus.textContent = `Logged in as: ${user.email}`;
        if(loginForm) loginForm.style.display = 'none';
        if(logoutButton) logoutButton.style.display = 'inline-block';
    } else {
        // User is signed out
        console.log('No user logged in');
        if(userStatus) userStatus.textContent = 'Not logged in';
        if(loginForm) loginForm.style.display = 'block';
        if(logoutButton) logoutButton.style.display = 'none';
    }
});

// =====================
// SIGN-UP & LOGIN FORMS
// =====================
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');

    // Sign-Up Event Listener
    if(signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log('User signed up:', user);
                    alert('Sign-up successful!');
                })
                .catch((error) => {
                    console.error('Sign-up error:', error.code, error.message);
                    alert(`Error: ${error.message}`);
                });
        });
    }

    // Login Event Listener
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log('User logged in:', user);
                    alert('Login successful!');
                })
                .catch((error) => {
                    console.error('Login error:', error.code, error.message);
                    alert(`Error: ${error.message}`);
                });
        });
    }

    // Logout Event Listener
    if(logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth)
                .then(() => {
                    console.log('User signed out');
                    alert('Logged out successfully!');
                })
                .catch((error) => {
                    console.error('Logout error:', error.message);
                });
        });
    }
});
