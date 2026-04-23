const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMWtyEy5UASw19U7FMwIb0cKqT_cJ1AlveIryywbbNLokKcxm4ver5pgoaBLTI5AP_9fyJNDaiQNAY/pub?output=csv';
const USE_MOCK_DATA = false;
const mockProducts = [];
let allProducts = [];

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

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('contact-modal');
        if (modal && modal.classList.contains('open')) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
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

        const badgeHTML = discountPct > 0
            ? `<span class="discount-badge">-${discountPct}%</span>`
            : '';

        return `
            <div class="${isFeatured ? 'featured-card reveal' : 'product-card reveal'}" style="--delay: ${delay}">
                <div class="product-image-container">
                    ${badgeHTML}
                    <img src="${product.ImageURL}" alt="${product.ProductName}" loading="lazy"
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
            productGrid.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:2rem;">No products found matching your search.</p>';
            return;
        }

        productGrid.innerHTML = products.map((p, i) => createProductCard(p, false, i)).join('');
        setTimeout(observeElements, 50);
    };

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
            .then(csv => { allProducts = parseCSV(csv); filterProducts(); })
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
