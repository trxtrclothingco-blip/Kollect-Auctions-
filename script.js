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
import { auth, db, storage } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// User State Observer
onAuthStateChanged(auth, (user) => {
    const userStatus = document.getElementById('user-status');
    const logoutButton = document.getElementById('logout-button');
    const loginForm = document.getElementById('login-form');

    if (user) {
        console.log('Current user:', user);
        if(userStatus) userStatus.textContent = `Logged in as: ${user.email}`;
        if(loginForm) loginForm.style.display = 'none';
        if(logoutButton) logoutButton.style.display = 'inline-block';
    } else {
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

    // =====================
    // FIRESTORE LISTING ADD
    // =====================
    db.collection("listings").add({
        title: "Rare Card",
        description: "Description here",
        category: "TGC's Graded",
        saleType: "auction",
        startPrice: 200,
        images: ["url1.jpg", "url2.jpg"],
        auctionStart: "2026-01-25T10:00",
        auctionEnd: "2026-01-27T18:00",
        status: "active"
    })
    .then(docRef => console.log("Listing created", docRef.id))
    .catch(error => console.error(error));

    // =====================
    // FIREBASE STORAGE UPLOAD
    // =====================
    const fileInput = document.getElementById('file-input'); // make sure you have <input type="file" id="file-input">
    if(fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(!file) return;

            const storageRef = storage.ref();
            const fileRef = storageRef.child('images/' + file.name);
            fileRef.put(file).then(snapshot => {
                snapshot.ref.getDownloadURL().then(url => {
                    console.log("File URL:", url);
                });
            }).catch(err => console.error("Upload error:", err));
        });
    }

    // =====================
    // LISTEN TO BIDS FOR A LISTING
    // =====================
    const listingId = "exampleListingId"; // replace with the actual listing ID
    db.collection("bids")
      .where("listingId", "==", listingId)
      .orderBy("bidAmount", "desc")
      .onSnapshot(snapshot => {
        snapshot.docs.forEach(doc => console.log(doc.data()));
      });

});
