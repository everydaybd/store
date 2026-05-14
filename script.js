import { 
    auth, 
    googleProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile
} from "./firebase-config.js";

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMWtyEy5UASw19U7FMwIb0cKqT_cJ1AlveIryywbbNLokKcxm4ver5pgoaBLTI5AP_9fyJNDaiQNAY/pub?output=csv';
const USE_MOCK_DATA = false;
const mockProducts = [];
let allProducts = [];

/* --- Authentication Logic --- */
const authModal = document.getElementById('auth-modal');
const loginBtn = document.getElementById('login-btn');
const bnavProfile = document.getElementById('bnav-profile');
const bnavProfileText = document.getElementById('bnav-profile-text');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const googleLoginBtn = document.getElementById('google-login-btn');
const userProfile = document.getElementById('user-profile');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');

const openAuthModal = () => {
    authModal.classList.add('open');
    document.body.style.overflow = 'hidden';
};

const closeAuthModal = () => {
    authModal.classList.remove('open');
    document.body.style.overflow = '';
};

window.closeAuthModal = closeAuthModal;

window.handleAuthModalClick = (e) => {
    if (e.target === authModal) closeAuthModal();
};

if (loginBtn) loginBtn.addEventListener('click', openAuthModal);
if (bnavProfile) {
    bnavProfile.addEventListener('click', (e) => {
        e.preventDefault();
        if (!auth.currentUser) {
            openAuthModal();
        } else {
            profileDropdown.classList.toggle('open');
        }
    });
}

if (userProfile) {
    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('open');
    });
}

document.addEventListener('click', () => {
    if (profileDropdown) profileDropdown.classList.remove('open');
});

authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        authForms.forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab === 'login' ? 'login-form' : 'signup-form';
        document.getElementById(target).classList.add('active');
    });
});

// Email/Password Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        errorEl.style.display = 'none';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            closeAuthModal();
        } catch (error) {
            console.error(error);
            errorEl.style.display = 'block';
            errorEl.textContent = "Invalid email or password.";
        }
    });
}

// Email/Password Signup
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const errorEl = document.getElementById('signup-error');
        errorEl.style.display = 'none';

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            closeAuthModal();
        } catch (error) {
            console.error(error);
            errorEl.style.display = 'block';
            errorEl.textContent = "Registration failed. " + (error.message.includes('email-already-in-use') ? "This email is already in use." : "Please try again.");
        }
    });
}

// Google Login
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            closeAuthModal();
        } catch (error) {
            console.error(error);
        }
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            profileDropdown.classList.remove('open');
        } catch (error) {
            console.error(error);
        }
    });
}

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        if (userName) userName.textContent = user.displayName || 'User';
        if (userAvatar) userAvatar.textContent = (user.displayName || 'U')[0].toUpperCase();
        if (bnavProfileText) bnavProfileText.textContent = 'Account';
    } else {
        // User is signed out
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
        if (bnavProfileText) bnavProfileText.textContent = 'Login';
    }
});

/* --- Existing Logic --- */
function openProductModal(product) {
    const images = (product.ImageURL || '').split(',').map(s => s.trim()).filter(Boolean);
    if (images.length === 0) images.push('https://via.placeholder.com/600x400?text=No+Image');

    const inner      = document.getElementById('pm-carousel-inner');
    const indicators = document.getElementById('pm-indicators');
    const prevBtn    = document.getElementById('pm-prev');
    const nextBtn    = document.getElementById('pm-next');

    inner.innerHTML = images.map(src => `
        <div class="pm-carousel-item">
            <img src="${src}" alt="${product.ProductName}"
                 onerror="this.src='https://via.placeholder.com/600x400?text=Image+Not+Found'">
        </div>`).join('');

    const multiImg = images.length > 1;
    prevBtn.style.display    = multiImg ? 'flex' : 'none';
    nextBtn.style.display    = multiImg ? 'flex' : 'none';
    indicators.innerHTML     = multiImg
        ? images.map((_, i) => `<span class="dot ${i===0?'active':''}" data-index="${i}"></span>`).join('')
        : '';

    let cur = 0;
    const goTo = idx => {
        cur = (idx + images.length) % images.length;
        inner.style.transform = `translateX(-${cur * 100}%)`;
        document.querySelectorAll('#pm-indicators .dot').forEach((d, i) =>
            d.classList.toggle('active', i === cur));
    };
    prevBtn.onclick = () => goTo(cur - 1);
    nextBtn.onclick = () => goTo(cur + 1);
    document.querySelectorAll('#pm-indicators .dot').forEach(dot =>
        dot.addEventListener('click', e => goTo(parseInt(e.target.dataset.index))));

    const carouselEl = inner.parentElement;
    if (!carouselEl._swipeSetup) {
        carouselEl._swipeSetup = true;
        let txStart = 0;
        carouselEl.addEventListener('touchstart', e => { txStart = e.touches[0].clientX; }, { passive: true });
        carouselEl.addEventListener('touchend', e => {
            const diff = txStart - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 45 && window._pmSwipeHandler) window._pmSwipeHandler(diff > 0 ? 1 : -1);
        }, { passive: true });
    }
    window._pmSwipeHandler = dir => goTo(cur + dir);

    document.getElementById('pm-category').textContent    = product.Category || '';
    document.getElementById('pm-title').textContent       = product.ProductName;
    document.getElementById('pm-description').textContent = product.Description;

    const discountPct    = parseFloat(product.Discount) || 0;
    const rawPrice       = parseFloat((product.Price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
    const currencySymbol = (product.Price || '').replace(/[0-9.,\s]/g, '').trim() || '৳';
    let priceHTML;
    if (discountPct > 0 && rawPrice > 0) {
        const discounted = Math.round(rawPrice * (1 - discountPct / 100));
        priceHTML = `<div class="price-block">
            <span class="price-original">${currencySymbol}${rawPrice.toLocaleString()}</span>
            <span class="product-price">${currencySymbol}${discounted.toLocaleString()}</span>
        </div>`;
    } else {
        priceHTML = `<span class="product-price">${product.Price}</span>`;
    }
    document.getElementById('pm-price').innerHTML = priceHTML;
    document.getElementById('pm-order-btn').href =
        `order.html?product=${encodeURIComponent(product.ProductName)}`;

    const modal = document.getElementById('product-modal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?product=' + encodeURIComponent(product.ProductName);
    window.history.pushState({path:newUrl}, '', newUrl);
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({path:newUrl}, '', newUrl);
}

function shareProduct() {
    const url = window.location.href;
    const title = document.getElementById('pm-title').textContent;

    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('pm-share-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '✅ Link Copied!';
        
        if (navigator.share) {
            navigator.share({ title: title, url: url }).catch(() => {});
        }

        setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function handleModalOverlayClick(event) {
    if (event.target === document.getElementById('product-modal')) closeProductModal();
}

function openContactModal() {
    const modal = document.getElementById('contact-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeContactModal(event) {
    if (event && event.target !== document.getElementById('contact-modal')) return;
    const modal = document.getElementById('contact-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
}
window.closeContactModal = closeContactModal;
window.openContactModal = openContactModal;
window.handleModalOverlayClick = handleModalOverlayClick;
window.shareProduct = shareProduct;
window.closeProductModal = closeProductModal;
window.openProductModal = openProductModal;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('contact-modal');
        if (modal && modal.classList.contains('open')) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
        closeProductModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const productGrid              = document.getElementById('product-grid');
    const featuredProductContainer = document.getElementById('featured-product');
    const featuredSection          = document.getElementById('featured-section');
    const loader                   = document.getElementById('loader');
    const searchInput              = document.getElementById('search-input');
    const searchBtn                = document.getElementById('search-btn');
    const catBtns                  = document.querySelectorAll('.cat-btn');
    const mobileCatToggle          = document.getElementById('mobile-cat-toggle');
    const categoryFilters          = document.getElementById('category-filters');
    const themeToggle              = document.getElementById('theme-toggle');
    const themeIconDark            = document.getElementById('theme-icon-dark');
    const themeIconLight           = document.getElementById('theme-icon-light');

    const updateThemeIcon = (isLight) => {
        themeIconDark.style.display  = isLight ? 'none'  : 'block';
        themeIconLight.style.display = isLight ? 'block' : 'none';
        document.body.classList.toggle('light-mode', isLight);
    };

    if (localStorage.getItem('theme') === 'light') updateThemeIcon(true);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.body.classList.contains('light-mode');
            updateThemeIcon(!isLight);
            localStorage.setItem('theme', isLight ? 'dark' : 'light');
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const observeElements = () => {
        document.querySelectorAll('.reveal:not(.active)').forEach(el => observer.observe(el));
    };
    observeElements();

    if (mobileCatToggle) {
        mobileCatToggle.addEventListener('click', () => {
            categoryFilters.classList.toggle('show');
        });
    }

    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const navLinks        = document.getElementById('nav-links');
    const hamburgerIcon   = document.getElementById('hamburger-icon');
    const closeIcon       = document.getElementById('close-icon');

    const openNav = () => {
        navLinks.classList.add('show');
        requestAnimationFrame(() => navLinks.classList.add('slide-in'));
        if (hamburgerIcon) hamburgerIcon.style.display = 'none';
        if (closeIcon)     closeIcon.style.display     = 'block';
        mobileNavToggle.setAttribute('aria-expanded', 'true');
        mobileNavToggle.setAttribute('aria-label', 'Close menu');
        document.body.style.overflow = 'hidden';
    };

    const closeNav = () => {
        navLinks.classList.remove('slide-in');
        if (hamburgerIcon) hamburgerIcon.style.display = 'block';
        if (closeIcon)     closeIcon.style.display     = 'none';
        mobileNavToggle.setAttribute('aria-expanded', 'false');
        mobileNavToggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
        setTimeout(() => navLinks.classList.remove('show'), 320);
    };

    if (mobileNavToggle && navLinks) {
        mobileNavToggle.addEventListener('click', () => {
            navLinks.classList.contains('slide-in') ? closeNav() : openNav();
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('slide-in')) closeNav();
            });
        });

        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('slide-in') &&
                !navLinks.contains(e.target) &&
                !mobileNavToggle.contains(e.target)) {
                closeNav();
            }
        });
    }

    window._attachCarouselSwipe = (carouselEl, onSwipeLeft, onSwipeRight) => {
        let startX = 0;
        carouselEl.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
        carouselEl.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) diff > 0 ? onSwipeLeft() : onSwipeRight();
        }, { passive: true });
    };

    const createProductCard = (product, isFeatured = false, index = 0) => {
        const orderLink      = `order.html?product=${encodeURIComponent(product.ProductName)}`;
        const delay          = index % 10;
        const discountPct    = parseFloat(product.Discount) || 0;
        const rawPrice       = parseFloat((product.Price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
        const currencySymbol = (product.Price || '').replace(/[0-9.,\s]/g, '').trim() || '৳';

        let priceHTML;
        if (discountPct > 0 && rawPrice > 0) {
            const discountedPrice = Math.round(rawPrice * (1 - discountPct / 100));
            priceHTML = `
                <div class="price-block">
                    <span class="price-original">${currencySymbol}${rawPrice.toLocaleString()}</span>
                    <span class="product-price">${currencySymbol}${discountedPrice.toLocaleString()}</span>
                </div>`;
        } else {
            priceHTML = `<span class="product-price">${product.Price}</span>`;
        }

        const images = (product.ImageURL || '').split(',').map(s => s.trim()).filter(Boolean);
        const badgeHTML = discountPct > 0
            ? `<span class="discount-badge">-${discountPct}%</span>`
            : '';
        const galleryBadgeHTML = images.length > 1 
            ? `<span class="gallery-badge"><i class="fas fa-images"></i> ${images.length}</span>` 
            : '';

        return `
            <div class="${isFeatured ? 'featured-card reveal' : 'product-card reveal'}" style="--delay: ${delay}">
                <div class="product-image-container pm-trigger"
                     data-product="${encodeURIComponent(product.ProductName)}"
                     role="button" aria-label="View images of ${product.ProductName}">
                    ${badgeHTML}
                    ${galleryBadgeHTML}
                    <img src="${images[0] || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${product.ProductName}" loading="lazy"
                         onerror="this.src='https://via.placeholder.com/600x400?text=Image+Not+Found'">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.Category || 'Other'}</span>
                    <h3 class="product-title">${product.ProductName}</h3>
                    <p class="product-desc">${product.Description}</p>
                    <div class="product-footer">
                        ${priceHTML}
                        <a href="${orderLink}" class="btn-order">Order Now</a>
                    </div>
                </div>
            </div>
        `;
    };

    let slideInterval;

    const renderFeatured = (products) => {
        if (!products || products.length === 0) {
            featuredSection.classList.add('hidden');
            if (slideInterval) clearInterval(slideInterval);
            return;
        }
        featuredSection.classList.remove('hidden');

        const slidesHTML = products.map(p => `
            <div class="carousel-item">${createProductCard(p, true, 0)}</div>
        `).join('');

        const dotsHTML = products.map((_, i) =>
            `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
        ).join('');

        featuredProductContainer.innerHTML = `
            <div class="carousel">
                <div class="carousel-inner" id="carousel-inner">${slidesHTML}</div>
                ${products.length > 1 ? `
                <button class="carousel-control prev" id="carousel-prev">&#8249;</button>
                <button class="carousel-control next" id="carousel-next">&#8250;</button>
                <div class="carousel-indicators" id="carousel-indicators">${dotsHTML}</div>
                ` : ''}
            </div>
        `;

        if (products.length > 1) {
            let currentSlide = 0;
            const totalSlides = products.length;
            const inner = document.getElementById('carousel-inner');
            const dots  = document.querySelectorAll('.dot');

            const goToSlide = (index) => {
                currentSlide = (index + totalSlides) % totalSlides;
                inner.style.transform = `translateX(-${currentSlide * 100}%)`;
                dots.forEach(d => d.classList.remove('active'));
                if (dots[currentSlide]) dots[currentSlide].classList.add('active');
            };

            const resetInterval = () => {
                clearInterval(slideInterval);
                slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
            };

            document.getElementById('carousel-next').addEventListener('click', () => { goToSlide(currentSlide + 1); resetInterval(); });
            document.getElementById('carousel-prev').addEventListener('click', () => { goToSlide(currentSlide - 1); resetInterval(); });

            dots.forEach(dot => {
                dot.addEventListener('click', (e) => { goToSlide(parseInt(e.target.dataset.index)); resetInterval(); });
            });

            resetInterval();

            const carouselEl = featuredProductContainer.querySelector('.carousel');
            if (carouselEl && window._attachCarouselSwipe) {
                window._attachCarouselSwipe(
                    carouselEl,
                    () => { goToSlide(currentSlide + 1); resetInterval(); },
                    () => { goToSlide(currentSlide - 1); resetInterval(); }
                );
            }
        }

        setTimeout(observeElements, 50);
    };

    const renderGrid = (products) => {
        loader.classList.add('hidden');
        productGrid.classList.remove('hidden');

        if (products.length === 0) {
            const query = searchInput.value;
            productGrid.innerHTML = `
                <div style="text-align:center;grid-column:1/-1;padding:3rem 1rem;">
                    <p style="color:var(--text-secondary);margin-bottom:1.5rem;">আপনার কাঙ্ক্ষিত প্রোডাক্টটি খুঁজে পাওয়া যায়নি।</p>
                    <a href="https://wa.me/8801757143424?text=${encodeURIComponent('হ্যালো, আমি এই প্রোডাক্টটি খুঁজছি কিন্তু আপনাদের স্টোরে খুঁজে পাচ্ছি না: ' + query)}" 
                       target="_blank" class="request-btn">
                       📢 Request this Product
                    </a>
                </div>`;
            return;
        }

        productGrid.innerHTML = products.map((p, i) => createProductCard(p, false, i)).join('');
        setTimeout(observeElements, 50);
    };

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.pm-trigger');
        if (!trigger) return;
        const name = decodeURIComponent(trigger.dataset.product || '');
        const prod = allProducts.find(p => p.ProductName === name);
        if (prod) openProductModal(prod);
    });

    const translationMap = {
        'ghori': 'watch', 'ঘড়ি': 'watch', 'watch': 'watch', 'ঘড়ির': 'watch',
        'shajgoj': 'cosmetic', 'sajgoj': 'cosmetic', 'সাজগোজ': 'cosmetic', 'মেকআপ': 'cosmetic', 'makeup': 'cosmetic', 'প্রসাধনী': 'cosmetic',
        'mobile': 'gadget', 'ফোন': 'gadget', 'phone': 'gadget', 'গেজেট': 'gadget', 'electronics': 'gadget', 'মোবাইল': 'gadget',
        'jama': 'product', 'কাপড়': 'product', 'kapor': 'product', 'dress': 'product', 'পোশাক': 'product', 'থ্রিপিস': 'product', 'শাড়ি': 'product',
        'juta': 'sneakers', 'জুতো': 'sneakers', 'shoe': 'sneakers', 'জুতা': 'sneakers', 'স্যান্ডেল': 'sneakers',
        'khelna': 'toy', 'খেলনা': 'toy', 'খেলনাপত্র': 'toy',
        'perfume': 'perfume', 'parfum': 'perfume', 'সেন্ট': 'perfume', 'সুগন্ধি': 'perfume',
        'headphone': 'headphones', 'হেডফোন': 'headphones', 'গান': 'headphones', 'ব্লাউটুথ': 'headphones'
    };

    const levenshteinDistance = (s, t) => {
        if (!s.length) return t.length;
        if (!t.length) return s.length;
        const arr = [];
        for (let i = 0; i <= t.length; i++) {
            arr[i] = [i];
            for (let j = 1; j <= s.length; j++) {
                arr[i][j] = i === 0 ? j : Math.min(
                    arr[i - 1][j] + 1,
                    arr[i][j - 1] + 1,
                    arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
                );
            }
        }
        return arr[t.length][s.length];
    };

    const smartMatch = (query, text) => {
        if (!query) return true;
        query = query.toLowerCase().trim();
        text  = text.toLowerCase();

        if (text.includes(query)) return true;

        const queryWords = query.split(/\s+/);
        const textWords  = text.split(/\s+/);

        for (const qw of queryWords) {
            for (const key in translationMap) {
                if (qw === key || levenshteinDistance(qw, key) <= 1) {
                    if (text.includes(translationMap[key])) return true;
                }
            }
            if (qw.length > 3) {
                for (const tw of textWords) {
                    if (tw.length > 3 && levenshteinDistance(qw, tw) <= 2) return true;
                }
            }
        }
        return false;
    };

    const filterProducts = () => {
        const searchTerm  = searchInput.value;
        const activeCatBtn = document.querySelector('.cat-btn.active');
        const category    = activeCatBtn ? activeCatBtn.dataset.cat.toLowerCase() : 'all';
        let filtered      = [...allProducts];

        if (searchTerm.trim() === '' && category === 'all') {
            if (filtered.length > 0) {
                renderFeatured(filtered.slice(-Math.min(3, filtered.length)).reverse());
            } else {
                renderFeatured([]);
            }
            renderGrid([...filtered].reverse());
        } else {
            if (slideInterval) clearInterval(slideInterval);
            featuredSection.classList.add('hidden');

            filtered = filtered.filter(p => {
                const searchString  = `${p.ProductName} ${p.Description} ${p.Category}`;
                const matchesSearch = smartMatch(searchTerm, searchString);
                const matchesCat    = category === 'all' || (p.Category && p.Category.toLowerCase() === category);
                return matchesSearch && matchesCat;
            });
            renderGrid([...filtered].reverse());
        }
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    searchInput.addEventListener('input', debounce(filterProducts, 300));
    searchBtn.addEventListener('click', filterProducts);

    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts();
        });
    });

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

    if (USE_MOCK_DATA) {
        setTimeout(() => { allProducts = mockProducts; filterProducts(); }, 800);
    } else {
        fetch(GOOGLE_SHEET_CSV_URL)
            .then(res => { if (!res.ok) throw new Error('Network error'); return res.text(); })
            .then(csv => { 
                allProducts = parseCSV(csv); 
                filterProducts(); 
                
                const params = new URLSearchParams(window.location.search);
                const prodName = params.get('product');
                if (prodName) {
                    const p = allProducts.find(x => x.ProductName === decodeURIComponent(prodName));
                    if (p) setTimeout(() => openProductModal(p), 500);
                }
            })
            .catch(err => {
                console.error(err);
                loader.innerHTML = '<p style="color:#ef4444;grid-column:1/-1;text-align:center;">Failed to load products. Please check the Google Sheet link.</p>';
            });
    }

    const bnavItems = document.querySelectorAll('.bottom-nav-item');
    const navSections = [
        { el: document.getElementById('home'), btn: document.getElementById('bnav-home') },
        { el: document.getElementById('shop'), btn: document.getElementById('bnav-shop') },
    ];

    const updateBottomNav = () => {
        const scrollY = window.scrollY + window.innerHeight / 2;
        let active = navSections[0];
        navSections.forEach(s => { if (s.el && s.el.offsetTop <= scrollY) active = s; });
        bnavItems.forEach(b => b.classList.remove('active'));
        if (active && active.btn) active.btn.classList.add('active');
    };

    window.addEventListener('scroll', updateBottomNav, { passive: true });
    updateBottomNav();
});
