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
