import { 
    auth, 
    db,
    signOut, 
    onAuthStateChanged 
} from "./firebase-config.js";

import { 
    collection, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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
    if (themeIconDark) themeIconDark.style.display = isLight ? 'none' : 'block';
    if (themeIconLight) themeIconLight.style.display = isLight ? 'block' : 'none';
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

// Tab Switching Logic
const tabButtons = document.querySelectorAll('.db-tab-btn');
const tabContents = document.querySelectorAll('.db-tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const contentDiv = document.getElementById(`tab-${targetTab}`);
        if (contentDiv) contentDiv.classList.add('active');
    });
});

// Helper: Stable Product Base64 Key
const getProductId = (name) => {
    try {
        return btoa(unescape(encodeURIComponent(name)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    } catch (e) {
        return name.replace(/[^a-zA-Z0-9]/g, '_');
    }
};

// Helper: Parse CSV Text
const parseCSV = (csvText) => {
    const lines = [];
    let currentLine  = [];
    let currentField = '';
    let inQuotes     = false;

    for (let i = 0; i < csvText.length; i++) {
        const char     = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            currentField += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentLine.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentField || currentLine.length > 0) {
                currentLine.push(currentField.trim());
                lines.push(currentLine);
                currentField = '';
                currentLine  = [];
            }
            if (char === '\r' && nextChar === '\n') i++;
        } else {
            currentField += char;
        }
    }

    if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        lines.push(currentLine);
    }

    if (lines.length === 0) return [];

    const headers = lines[0];
    return lines.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, j) => {
            obj[h] = (row[j] || '').replace(/(^"|"$)/g, '');
        });
        return obj;
    });
};

// Populate Loved Products Grid
function renderLovedProducts(lovedProducts) {
    const lovedGrid = document.getElementById('loved-grid');
    const lovedCountBadge = document.getElementById('loved-count-badge');
    
    if (!lovedGrid) return;
    if (lovedCountBadge) lovedCountBadge.textContent = lovedProducts.length;
    
    if (lovedProducts.length === 0) {
        lovedGrid.innerHTML = `
            <div class="empty-state">
                <i class="far fa-heart"></i>
                <p>You haven't loved any products yet!</p>
                <a href="../../index.html#shop" class="btn-shop-now">Explore Products</a>
            </div>
        `;
        return;
    }
    
    lovedGrid.innerHTML = lovedProducts.map((product) => {
        const viewLink = `../../index.html?product=${encodeURIComponent(product.ProductName)}`;
        const images = (product.ImageURL || '').split(',').map(s => s.trim()).filter(Boolean);
        const discountPct = parseFloat(product.Discount) || 0;
        const rawPrice = parseFloat((product.Price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
        const currencySymbol = (product.Price || '').replace(/[0-9.,\s]/g, '').trim() || '৳';
        
        let priceHTML;
        if (discountPct > 0 && rawPrice > 0) {
            const discountedPrice = Math.round(rawPrice * (1 - discountPct / 100));
            priceHTML = `
                <div class="price-block">
                    <span class="price-original" style="font-size: 0.75rem; text-decoration: line-through; color: var(--text-secondary); opacity: 0.7;">${currencySymbol}${rawPrice.toLocaleString()}</span>
                    <span class="product-price" style="font-weight: 750; color: var(--accent-color); font-size: 0.95rem;">${currencySymbol}${discountedPrice.toLocaleString()}</span>
                </div>`;
        } else {
            priceHTML = `<span class="product-price" style="font-weight: 750; color: var(--accent-color); font-size: 0.95rem;">${product.Price}</span>`;
        }
        
        return `
            <div class="product-card" style="box-shadow: 0 8px 24px rgba(0,0,0,0.12); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; background: var(--card-bg); border: 1px solid var(--card-border); transition: var(--transition);">
                <div class="product-image-container" style="position: relative; width: 100%; height: 160px; overflow: hidden;">
                    ${discountPct > 0 ? `<span class="discount-badge" style="position: absolute; top: 10px; left: 10px; z-index: 2;">-${discountPct}%</span>` : ''}
                    <img src="${images[0] || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${product.ProductName}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="product-info" style="padding: 1rem; display: flex; flex-direction: column; flex-grow: 1; gap: 6px;">
                    <span class="product-category" style="font-size: 0.7rem; text-transform: uppercase; color: var(--accent-color); font-weight: 600;">${product.Category || 'Other'}</span>
                    <h4 style="font-size: 0.95rem; font-weight: 750; color: var(--text-primary); margin: 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${product.ProductName}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                        ${priceHTML}
                        <a href="${viewLink}" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 8px; font-weight: 700; text-decoration: none; background: linear-gradient(135deg, var(--accent-color) 0%, #6366f1 100%); color: white; display: inline-block;">View</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Fetch and Filter User Loved Products
async function loadUserLovedItems(userId) {
    let localProducts = [];
    try {
        const cached = localStorage.getItem('everydaybd_products');
        if (cached) {
            localProducts = JSON.parse(cached);
        } else {
            const res = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQMWtyEy5UASw19U7FMwIb0cKqT_cJ1AlveIryywbbNLokKcxm4ver5pgoaBLTI5AP_9fyJNDaiQNAY/pub?output=csv');
            const csv = await res.text();
            localProducts = parseCSV(csv);
            localStorage.setItem('everydaybd_products', JSON.stringify(localProducts));
        }
    } catch (e) {
        console.error("Products load failed inside profile:", e);
    }
    
    if (!localProducts || localProducts.length === 0) return;
    
    // Step 1: SWR Stale loading (render instantly from LocalStorage cache)
    let reactions = {};
    const localReactions = localStorage.getItem('everydaybd_local_reactions');
    if (localReactions) {
        try {
            reactions = JSON.parse(localReactions);
            filterAndRender(reactions);
        } catch (e) {}
    }
    
    // Step 2: SWR Revalidate (fetch fresh data from Firestore collection)
    try {
        const querySnapshot = await getDocs(collection(db, "reactions"));
        const freshReactions = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            freshReactions[doc.id] = {
                loveCount: data.loveCount || 0,
                lovedBy: data.lovedBy || []
            };
        });
        localStorage.setItem('everydaybd_local_reactions', JSON.stringify(freshReactions));
        filterAndRender(freshReactions);
    } catch (error) {
        console.warn("Firestore reactions load failed inside profile, using local values:", error);
    }
    
    function filterAndRender(reactionData) {
        const userLovedList = localProducts.filter(p => {
            const pId = getProductId(p.ProductName);
            const r = reactionData[pId];
            return r && r.lovedBy && r.lovedBy.includes(userId);
        });
        renderLovedProducts(userLovedList);
    }
}

// Auth Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        pName.textContent = user.displayName || 'EverydayBD Member';
        pEmail.textContent = user.email || '';
        
        const infoName = document.getElementById('info-name');
        const infoEmail = document.getElementById('info-email');
        
        if (infoName) infoName.textContent = user.displayName || 'User';
        if (infoEmail) infoEmail.textContent = user.email || 'Not Set';
        
        if (pAvatar) {
            pAvatar.textContent = (user.displayName || user.email || 'U')[0].toUpperCase();
        }
        
        if (user.metadata.creationTime && pJoined) {
            const date = new Date(user.metadata.creationTime);
            pJoined.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        
        // Trigger Loved products SWR engine
        loadUserLovedItems(user.uid);
        
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
