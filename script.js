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

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  // Sign-Up Event Listener
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up successfully
        const user = userCredential.user;
        console.log('User signed up:', user);
        alert('Sign-up successful!');
        // Optional: Redirect to another page or update UI
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Sign-up error:', errorCode, errorMessage);
        alert(`Error: ${errorMessage}`);
      });
  });

  // Login Event Listener
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Logged in successfully
        const user = userCredential.user;
        console.log('User logged in:', user);
        alert('Login successful!');
        // Optional: Redirect or update UI
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Login error:', errorCode, errorMessage);
        alert(`Error: ${errorMessage}`);
      });
  });
});
