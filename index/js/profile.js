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
        window.location.href = '../../index.html';
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = '../../index.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });
}

// App Download Logic
document.querySelectorAll('.nav-download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.classList.contains('downloading')) return;

        const originalHTML = btn.innerHTML;
        btn.classList.add('downloading');
        
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.5" fill="none" class="spinner-icon" style="margin-bottom: 2px;">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
            </svg>
            <span style="margin-left: 6px; font-weight: 600;">Downloading...</span>
        `;

        setTimeout(() => {
            const a = document.createElement('a');
            a.href = '../../EverydayBD.apk';
            a.download = 'EverydayBD.apk';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            btn.classList.remove('downloading');
            btn.classList.add('downloaded');
            
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 2px;">
                    <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <span style="color: #10b981; margin-left: 6px; font-weight: 600;">Success</span>
            `;

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('downloaded');
            }, 3000);
        }, 1500);
    });
});
