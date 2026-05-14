import { 
    auth, 
    signOut, 
    onAuthStateChanged 
} from "./firebase-config.js";

const pAvatar = document.getElementById('p-avatar');
const pName = document.getElementById('p-name');
const pEmail = document.getElementById('p-email');
const pJoined = document.getElementById('p-joined');
const logoutBtn = document.getElementById('p-logout-btn');
const themeToggle = document.getElementById('theme-toggle');
const themeIconDark = document.getElementById('theme-icon-dark');
const themeIconLight = document.getElementById('theme-icon-light');

// Theme Logic
const updateThemeIcon = (isLight) => {
    themeIconDark.style.display = isLight ? 'none' : 'block';
    themeIconLight.style.display = isLight ? 'block' : 'none';
    document.body.classList.toggle('light-mode', isLight);
    document.body.classList.toggle('dark-mode', !isLight);
};

if (localStorage.getItem('theme') === 'light') updateThemeIcon(true);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.contains('light-mode');
        updateThemeIcon(!isLight);
        localStorage.setItem('theme', isLight ? 'dark' : 'light');
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, populate data
        pName.textContent = user.displayName || 'User';
        pEmail.textContent = user.email;
        pAvatar.textContent = (user.displayName || 'U')[0].toUpperCase();
        
        if (user.metadata.creationTime) {
            const date = new Date(user.metadata.creationTime);
            pJoined.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        document.body.style.opacity = '1';
    } else {
        window.location.href = 'index.html';
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });
}
