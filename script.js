function toggleMenu() {
    const menu = document.getElementById('navMenu');
    menu.classList.toggle('open');
}

// Dark/light mode with persistence
function toggleMode() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('lightMode', document.body.classList.contains('light-mode'));
}

// Apply mode on load
window.onload = () => {
    if(localStorage.getItem('lightMode') === 'true'){
        document.body.classList.add('light-mode');
    }
};
