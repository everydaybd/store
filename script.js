
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMWtyEy5UASw19U7FMwIb0cKqT_cJ1AlveIryywbbNLokKcxm4ver5pgoaBLTI5AP_9fyJNDaiQNAY/pub?output=csv';
const USE_MOCK_DATA = false; 


// Mock data removed as requested
const mockProducts = [];


let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const featuredProductContainer = document.getElementById('featured-product');
    const featuredSection = document.getElementById('featured-section');
    const loader = document.getElementById('loader');
    
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const catBtns = document.querySelectorAll('.cat-btn');
    
    // Mobile category toggle
    const mobileCatToggle = document.getElementById('mobile-cat-toggle');
    const categoryFilters = document.getElementById('category-filters');

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const themeIconLight = document.getElementById('theme-icon-light');

    const updateThemeIcon = (isLight) => {
        if (isLight) {
            themeIconDark.style.display = 'none';
            themeIconLight.style.display = 'block';
            document.body.classList.add('light-mode');
        } else {
            themeIconDark.style.display = 'block';
            themeIconLight.style.display = 'none';
            document.body.classList.remove('light-mode');
        }
    };

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        updateThemeIcon(true);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.body.classList.contains('light-mode');
            if (isLight) {
                updateThemeIcon(false);
                localStorage.setItem('theme', 'dark');
            } else {
                updateThemeIcon(true);
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Scroll Reveal Animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const observeElements = () => {
        const revealElements = document.querySelectorAll('.reveal:not(.active)');
        revealElements.forEach(el => observer.observe(el));
    };

    observeElements();
    
    if (mobileCatToggle) {
        mobileCatToggle.addEventListener('click', () => {
            categoryFilters.classList.toggle('show');
        });
    }

    // Mobile nav toggle
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }

    // Generate HTML for a single product card
    const createProductCard = (product, isFeatured = false, index = 0) => {
        const orderLink = `order.html?product=${encodeURIComponent(product.ProductName)}`;
        const delay = index % 10;
        
        return `
            <div class="${isFeatured ? 'featured-card reveal' : 'product-card reveal'}" style="--delay: ${delay}">
                <div class="product-image-container">
                    <img src="${product.ImageURL}" alt="${product.ProductName}" loading="lazy" onerror="this.src='https://via.placeholder.com/600x400?text=Image+Not+Found'">
                </div>
                <div class="product-info">
                    <span style="font-size: 0.8rem; color: var(--accent-color); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; display: block;">${product.Category || 'Other'}</span>
                    <h3 class="product-title">${product.ProductName}</h3>
                    <p class="product-desc">${product.Description}</p>
                    <div class="product-footer">
                        <span class="product-price">${product.Price}</span>
                        <a href="${orderLink}" class="btn-order">Order Now</a>
                    </div>
                </div>
            </div>
        `;
    };

    let slideInterval;
    
    // Render Featured Product
    const renderFeatured = (products) => {
        if (!products || products.length === 0) {
            featuredSection.classList.add('hidden');
            if (slideInterval) clearInterval(slideInterval);
            return;
        }
        featuredSection.classList.remove('hidden');
        
        let slidesHTML = products.map((p, i) => `
            <div class="carousel-item">
                ${createProductCard(p, true, 0)}
            </div>
        `).join('');

        let dotsHTML = products.map((_, i) => `
            <span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
        `).join('');

        featuredProductContainer.innerHTML = `
            <div class="carousel">
                <div class="carousel-inner" id="carousel-inner">
                    ${slidesHTML}
                </div>
                ${products.length > 1 ? `
                <button class="carousel-control prev" id="carousel-prev">&lt;</button>
                <button class="carousel-control next" id="carousel-next">&gt;</button>
                <div class="carousel-indicators" id="carousel-indicators">
                    ${dotsHTML}
                </div>
                ` : ''}
            </div>
        `;

        if (products.length > 1) {
            let currentSlide = 0;
            const totalSlides = products.length;
            const inner = document.getElementById('carousel-inner');
            const dots = document.querySelectorAll('.dot');
            
            const goToSlide = (index) => {
                currentSlide = (index + totalSlides) % totalSlides;
                inner.style.transform = `translateX(-${currentSlide * 100}%)`;
                dots.forEach(d => d.classList.remove('active'));
                if(dots[currentSlide]) dots[currentSlide].classList.add('active');
            };

            document.getElementById('carousel-next').addEventListener('click', () => {
                goToSlide(currentSlide + 1);
                resetInterval();
            });

            document.getElementById('carousel-prev').addEventListener('click', () => {
                goToSlide(currentSlide - 1);
                resetInterval();
            });

            dots.forEach(dot => {
                dot.addEventListener('click', (e) => {
                    goToSlide(parseInt(e.target.dataset.index));
                    resetInterval();
                });
            });

            const resetInterval = () => {
                clearInterval(slideInterval);
                slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
            };

            resetInterval();
        }
        
        setTimeout(observeElements, 50);
    };

    // Render Product Grid
    const renderGrid = (products) => {
        loader.classList.add('hidden');
        productGrid.classList.remove('hidden');

        if (products.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; padding: 2rem;">No products found matching your search.</p>';
            return;
        }

        productGrid.innerHTML = products.map((p, index) => createProductCard(p, false, index)).join('');
        setTimeout(observeElements, 50);
    };

    // Translation map for common Bengali/English search terms
    const translationMap = {
        'ghori': 'watch', 'ঘড়ি': 'watch', 'watch': 'watch',
        'shajgoj': 'cosmetic', 'sajgoj': 'cosmetic', 'সাজগোজ': 'cosmetic', 'মেকআপ': 'cosmetic', 'makeup': 'cosmetic',
        'mobile': 'gadget', 'ফোন': 'gadget', 'phone': 'gadget', 'গেজেট': 'gadget', 'electronics': 'gadget',
        'jama': 'product', 'কাপড়': 'product', 'kapor': 'product', 'dress': 'product', 'পোশাক': 'product',
        'juta': 'sneakers', 'জুতো': 'sneakers', 'shoe': 'sneakers', 'জুতা': 'sneakers',
        'khelna': 'toy', 'খেলনা': 'toy',
        'perfume': 'perfume', 'parfum': 'perfume', 'সেন্ট': 'perfume', 'সুগন্ধি': 'perfume',
        'headphone': 'headphones', 'হেডফোন': 'headphones', 'গান': 'headphones'
    };

    // Levenshtein distance for fuzzy typo matching
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

    // Smart Match logic
    const smartMatch = (query, text) => {
        if (!query) return true;
        query = query.toLowerCase().trim();
        text = text.toLowerCase();
        
        // 1. Direct partial match
        if (text.includes(query)) return true;

        const queryWords = query.split(/\s+/);
        const textWords = text.split(/\s+/);

        for (let qw of queryWords) {
            // 2. Translation Match
            for (let key in translationMap) {
                if (qw === key || levenshteinDistance(qw, key) <= 1) {
                    if (text.includes(translationMap[key])) return true;
                }
            }

            // 3. Typo Match (Fuzzy)
            if (qw.length > 3) {
                for (let tw of textWords) {
                    if (tw.length > 3 && levenshteinDistance(qw, tw) <= 2) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    // Filter Logic
    const filterProducts = () => {
        const searchTerm = searchInput.value;
        const activeCatBtn = document.querySelector('.cat-btn.active');
        const category = activeCatBtn ? activeCatBtn.dataset.cat.toLowerCase() : 'all';

        let filtered = [...allProducts];

        // Normal view: No search, no category filter
        if (searchTerm.trim() === '' && category === 'all') {
            if (filtered.length > 0) {
                const featuredCount = Math.min(3, filtered.length);
                const featured = filtered.slice(-featuredCount).reverse();
                renderFeatured(featured);
            } else {
                renderFeatured([]);
            }
            renderGrid(filtered.reverse()); // Show newest first in grid
        } else {
            // Search/Filter active: Hide featured section, show all matching in grid
            if (slideInterval) clearInterval(slideInterval);
            featuredSection.classList.add('hidden');
            
            filtered = filtered.filter(p => {
                const searchString = `${p.ProductName} ${p.Description} ${p.Category}`;
                const matchesSearch = smartMatch(searchTerm, searchString);
                const matchesCat = category === 'all' || (p.Category && p.Category.toLowerCase() === category);
                return matchesSearch && matchesCat;
            });
            renderGrid(filtered.reverse());
        }
    };

    // Event Listeners for Search and Filter
    searchInput.addEventListener('input', filterProducts);
    searchBtn.addEventListener('click', filterProducts);

    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts();
        });
    });

    // Robust CSV Parser
    const parseCSV = (csvText) => {
        const lines = [];
        let currentLine = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
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
                    currentLine = [];
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
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const obj = {};
            const row = lines[i];
            for (let j = 0; j < headers.length; j++) {
                let val = (row[j] || '').replace(/(^"|"$)/g, '');
                obj[headers[j]] = val;
            }
            result.push(obj);
        }
        return result;
    };

    // Load Data
    if (USE_MOCK_DATA) {
        setTimeout(() => {
            allProducts = mockProducts;
            filterProducts(); // initial render
        }, 800);
    } else {
        fetch(GOOGLE_SHEET_CSV_URL)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(csvText => {
                allProducts = parseCSV(csvText);
                filterProducts();
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                loader.innerHTML = `<p style="color: #ef4444; grid-column: 1 / -1; text-align: center;">Failed to load products. Please check the Google Sheet link.</p>`;
            });
    }
});
