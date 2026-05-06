// ========== Product data (2x3 compact cards) ==========

let loggedIn = true;

var
 cards = [
    { id: '001', title: 'Textbook Deals',  desc: 'Genuine textbooks up to 90% off',  price: '¥5',    original: '¥50',  emoji: '📚', cat: 'Textbooks/Exams/Materials', gradient: 'from-green-300 to-emerald-500'},

    { id: '002', title: 'Phones & Digital',  desc: 'Popular tech gear at great prices', price: '¥120',  original: '¥599', emoji: '🎧', cat: 'Phones/Digital/Computers', gradient: 'from-sky-300 to-blue-500'},

    { id: '003', title: 'Trendy Toys',  desc: 'Popular figurines at bargain prices', price: '¥29',   original: '¥89',  emoji: '🧸', cat: 'Games/Vouchers/Toys', gradient: 'from-pink-300 to-rose-500'},

    { id: '004', title: 'Discount Vouchers',  desc: 'Food & fun vouchers',  price: '¥1.5',  original: '¥15',  emoji: '🎟️', cat: 'Games/Vouchers/Toys', gradient: 'from-amber-300 to-yellow-500'},

    { id: '005', title: 'Sports & Outdoors',  desc: 'Sports equipment at great value',  price: '¥35',   original: '¥199', emoji: '🏸', cat: 'Fashion/Bags/Sports', gradient: 'from-violet-300 to-purple-500'},

    { id: '006', title: 'Daily Essentials',  desc: 'Dorm essentials at low prices',  price: '¥8',    original: '¥45',  emoji: '🪴', cat: 'Furniture/Appliances/Daily', gradient: 'from-orange-300 to-red-400'}
 
];

// ========== DOM references ==========
var searchInput    = document.querySelector('header input[type="text"]');
var searchBtn      = document.querySelector('header button');
var hotTags        = document.querySelectorAll('.hot-tags a');
var categoryItems  = document.querySelectorAll('.category-list li');
var cardGrid       = document.getElementById('card-grid');
var recommendGrid  = document.getElementById('recommend-grid');
var detailModal    = document.getElementById('detail-modal');
var publishModal   = document.getElementById('publish-modal');
var publishForm    = document.getElementById('publish-form');
var toastEl        = document.getElementById('toast');

// ========== API item list pagination state ==========
var apiState = {
    page: 1,
    limit: 20,
    isLoading: false,
    hasMore: true,
    items: [],
    currentCategory: null,
    currentSearch: null,
    infiniteScrollSetup: false
};

// ========== Random gradient background pool ==========
var gradientPool = [
    'from-rose-200 to-pink-300', 'from-sky-200 to-blue-300',
    'from-amber-200 to-orange-300', 'from-emerald-200 to-green-300',
    'from-violet-200 to-purple-300', 'from-cyan-200 to-teal-300',
    'from-red-200 to-rose-300', 'from-indigo-200 to-blue-300',
    'from-lime-200 to-green-300', 'from-fuchsia-200 to-pink-300',
    'from-pink-200 to-rose-300', 'from-teal-200 to-cyan-300',
    'from-purple-200 to-violet-300', 'from-orange-200 to-amber-300'
];

function getRandomGradient() {
    return gradientPool[Math.floor(Math.random() * gradientPool.length)];
}

// ========== Fetch item list from API ==========
async function fetchItemsFromApi(page, category, search) {
    if (apiState.isLoading) return { items: [], hasMore: false };
    apiState.isLoading = true;
    
    try {
        var params = new URLSearchParams({
            page: page,
            limit: apiState.limit
        });
        if (category) params.set('category', category);
        if (search) params.set('search', search);
        
        var response = await fetch(API + '/api/market/items?' + params.toString(), {
            method: 'GET',
            credentials: API ? 'omit' : 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('API request failed');
        
        var items = await response.json();
        apiState.hasMore = items.length >= apiState.limit;
        apiState.isLoading = false;
        return { items: items, hasMore: apiState.hasMore };
    } catch (error) {
        console.error('Failed to fetch items:', error);
        apiState.isLoading = false;
        return { items: [], hasMore: false };
    }
}

// ========== Create item card element ==========
function createApiCard(item, index) {
    var card = document.createElement('div');
    card.className = 'trade-api-card';
    card.style.animationDelay = (index % apiState.limit) * 50 + 'ms';
    
    var gradient = getRandomGradient();
    var rawCoverUrl = item.images && item.images.length > 0 ? item.images[0] : null;
    var coverUrl = null;
    if (rawCoverUrl) {
        if (rawCoverUrl.startsWith('http')) {
            coverUrl = rawCoverUrl;
        } else if (rawCoverUrl.startsWith('/')) {
            coverUrl = API + rawCoverUrl;
        } else {
            coverUrl = API + '/resources/' + rawCoverUrl;
        }
    }
    var itemId = item.itemId || item.id;
    
    var imageHtml;
    if (coverUrl) {
        imageHtml = 
            '<div class="card-image-wrapper bg-gradient-to-br ' + gradient + '">' +
                '<img class="card-cover" data-src="' + coverUrl + '" alt="' + item.title + '">' +
            '</div>';
    } else {
        var emoji = item.emoji || '📦';
        imageHtml = 
            '<div class="card-image-wrapper bg-gradient-to-br ' + gradient + ' flex items-center justify-center text-6xl">' +
                emoji +
            '</div>';
    }
    
    var sellerInitial = (item.sellerUsername || 'A').charAt(0).toUpperCase();
    var price = typeof item.price === 'number' ? '¥' + item.price.toFixed(2) : '¥' + item.price;
    var wants = item.wants || Math.floor(Math.random() * 100) + 1;
    
    card.innerHTML = imageHtml +
        '<div class="p-3 flex flex-col flex-1">' +
            '<p class="text-sm text-gray-800 leading-snug line-clamp-2 font-medium">' + item.title + '</p>' +
            '<div class="mt-auto pt-2">' +
                '<div class="flex items-center justify-between">' +
                    '<span class="trade-price text-base">' + price + '</span>' +
                    '<span class="text-xs text-gray-400">' + wants + ' want this</span>' +
                '</div>' +
                '<div class="flex items-center mt-2 space-x-1.5">' +
                    '<div class="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-[10px] text-purple-600 font-bold">' + sellerInitial + '</div>' +
                    '<span class="text-xs text-gray-500">' + (item.sellerUsername || 'Anonymous') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    card.addEventListener('click', function() {
        window.location.href = 'product.html?id=' + itemId;
    });
    
    if (coverUrl) {
        var img = card.querySelector('.card-cover');
        var wrapper = card.querySelector('.card-image-wrapper');
        var tempImg = new Image();
        tempImg.onload = function() {
            img.src = coverUrl;
            img.classList.add('loaded');
            wrapper.classList.add('image-loaded');
        };
        tempImg.onerror = function() {
            wrapper.classList.add('image-loaded');
        };
        tempImg.src = coverUrl;
    }
    
    return card;
}

// ========== Render API item list ==========
function renderApiItems(items, append) {
    if (!append) {
        recommendGrid.innerHTML = '';
    }
    
    items.forEach(function(item, index) {
        var card = createApiCard(item, append ? apiState.items.length + index : index);
        recommendGrid.appendChild(card);
    });
}

// ========== Load more items ==========
async function loadMoreItems() {
    if (apiState.isLoading || !apiState.hasMore) return;

    var loadingIndicator = document.getElementById('loading-indicator');
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
        recommendGrid.parentElement.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'flex';

    var result = await fetchItemsFromApi(apiState.page, apiState.currentCategory, apiState.currentSearch);

    loadingIndicator.style.display = 'none';

    if (result.items.length > 0) {
        if (apiState.page === 1) {
            apiState.items = result.items;
        } else {
            apiState.items = apiState.items.concat(result.items);
        }
        renderApiItems(result.items, apiState.page > 1);
        apiState.page++;
    }

    // API returned empty on first page - fall back to seed data
    if (apiState.page === 1 && result.items.length === 0) {
        console.log('[Fallback] API returned empty, using local seed data');
        renderRecommend(null);
    }

    if (!result.hasMore) {
        showFeedEndMessage();
    }
}

// ========== Show end-of-feed message ==========
function showFeedEndMessage() {
    var endMsg = document.getElementById('feed-end-message');
    if (!endMsg) {
        endMsg = document.createElement('div');
        endMsg.id = 'feed-end-message';
        endMsg.className = 'feed-end-message';
        endMsg.textContent = '— No more items —';
        recommendGrid.parentElement.appendChild(endMsg);
    }
    endMsg.style.display = 'block';
}

// ========== Infinite scroll detection ==========
var scrollObserver = null;

function setupInfiniteScroll() {
    if (apiState.infiniteScrollSetup) {
        var sentinel = document.getElementById('scroll-sentinel');
        if (sentinel && scrollObserver) {
            scrollObserver.observe(sentinel);
        }
        return;
    }
    
    apiState.infiniteScrollSetup = true;
    
    scrollObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting && apiState.hasMore && !apiState.isLoading) {
                loadMoreItems();
            }
        });
    }, {
        rootMargin: '100px'
    });
    
    var sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
        scrollObserver.observe(sentinel);
    } else {
        var newSentinel = document.createElement('div');
        newSentinel.id = 'scroll-sentinel';
        newSentinel.style.height = '1px';
        newSentinel.style.width = '100%';
        recommendGrid.parentElement.appendChild(newSentinel);
        scrollObserver.observe(newSentinel);
    }
}

// ========== Initialize API item list ==========
async function initApiItems(category, search) {
    apiState.page = 1;
    apiState.hasMore = true;
    apiState.items = [];
    apiState.currentCategory = category || null;
    apiState.currentSearch = search || null;

    var endMsg = document.getElementById('feed-end-message');
    if (endMsg) endMsg.style.display = 'none';

    await loadMoreItems();
    setupInfiniteScroll();
}

// ========== Toast notification ==========
function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('opacity-0', '-translate-y-4');
    toastEl.classList.add('opacity-100', 'translate-y-0');
    setTimeout(function () {
        toastEl.classList.remove('opacity-100', 'translate-y-0');
        toastEl.classList.add('opacity-0', '-translate-y-4');
    }, 2000);
    window.notify.show.show(msg);
}

// ========== Render compact cards (2x3 grid - no numbers) ==========
function renderCards(list) {
    cardGrid.innerHTML = '';
    list.forEach(function (c) {
        var div = document.createElement('div');
        div.className = 'trade-product-card bg-gradient-to-br ' + c.gradient + ' rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-transform';
        // Removed the original price div at the bottom
        div.innerHTML =
            '<div class="text-3xl mb-2">' + c.emoji + '</div>' +
            '<h3 class="text-white text-sm font-black leading-tight">' + c.title + '</h3>' +
            '<p class="text-white/70 text-[11px] mt-0.5">' + c.desc + '</p>';
            
        div.addEventListener('click', function () {
            window.location.href = 'search.html?cat=' + encodeURIComponent(c.cat);
        });
        cardGrid.appendChild(div);
    });
}

// ========== ES Search API ==========
async function searchItemsES(keyword, page, limit) {
    try {
        var params = new URLSearchParams({ keyword: keyword, page: page || 1, limit: limit || 20 });
        var response = await fetch(API + '/api/market/search/es?' + params.toString(), {
            method: 'GET',
            credentials: API ? 'omit' : 'include'
        });
        if (!response.ok) throw new Error('ES search failed');
        return await response.json();
    } catch (error) {
        console.warn('[ES Search] Search failed, falling back to local search:', error);
        return null;
    }
}

// ========== Search -> redirect to search.html ==========
function doSearch() {
    var keyword = searchInput.value.trim();
    if (keyword) {
        window.location.href = 'search.html?keyword=' + encodeURIComponent(keyword);
    }
}

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
});

// ========== Hot tags -> redirect to search.html ==========
hotTags.forEach(function (tag) {
    tag.addEventListener('click', function (e) {
        e.preventDefault();
        var kw = tag.textContent.trim();
        window.location.href = 'search.html?keyword=' + encodeURIComponent(kw);
    });
});

// ========== Category filter -> redirect to search page ==========
categoryItems.forEach(function (li) {
    li.addEventListener('click', function (e) {
        if (e.target.closest('a[href*="search.html"]')) return;
        if (e.target.closest('.group > div')) return;
        var cat = li.getAttribute('data-cat');
        if (cat) window.location.href = 'search.html?cat=' + encodeURIComponent(cat);
    });
});

function clearCategoryActive() {}

// ========== Recommendation feed: dynamic rendering ==========
function getAllSeeds() {
    var all = [];
    var keys = Object.keys(searchSeeds);
    for (var i = 0; i < keys.length; i++) {
        all = all.concat(searchSeeds[keys[i]]);
    }
    return all;
}

function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

function renderRecommend(seedFilter) {
    recommendGrid.innerHTML = '';

    // Fixed cards only show in "For You" tab (seedFilter is null)
    if (!seedFilter) {
    var fixedCard = document.createElement('div');
    fixedCard.className = 'trade-recommend-card';
    fixedCard.style.breakInside = 'avoid';
    fixedCard.style.marginBottom = '1rem';
    fixedCard.innerHTML =
        '<div class="h-44 overflow-hidden"><img src="images/shanhuadi.jpg" class="w-full h-full object-cover" alt="Event Tickets"></div>' +
        '<div class="p-3 flex flex-col flex-1">' +
            '<div class="mb-1"><span class="trade-badge trade-badge--hot">Event Tickets</span> <span class="trade-badge trade-badge--fresh">VIP Ticket</span></div>' +
            '<p class="text-sm text-gray-800 leading-snug line-clamp-2">Original price - Shanhuadi Sun Ruiyang Wang Ning VIP SVIP full ticket sequence number top 100 entry confirmed</p>' +
            '<div class="mt-auto pt-2">' +
                '<div class="flex items-center justify-between">' +
                    '<span class="trade-price text-base">¥361</span>' +
                    '<span class="text-xs text-gray-400">5 want this</span>' +
                '</div>' +
                '<div class="flex items-center mt-2 space-x-1.5">' +
                    '<div class="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-[10px] text-purple-600 font-bold">T</div>' +
                    '<span class="text-xs text-gray-500">Ticket Shop</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    fixedCard.addEventListener('click', function () {
        window.location.href = 'product.html?fixed=1';
    });
    recommendGrid.appendChild(fixedCard);

    // Second shanhuadi card ¥399
    var fixedCard2 = document.createElement('div');
    fixedCard2.className = 'trade-recommend-card';
    fixedCard2.style.breakInside = 'avoid';
    fixedCard2.style.marginBottom = '1rem';
    fixedCard2.innerHTML =
        '<div class="h-44 overflow-hidden"><img src="images/shanhuadi2.jpg" class="w-full h-full object-cover" alt="Shanhuadi"></div>' +
        '<div class="p-3 flex flex-col flex-1">' +
            '<div class="mb-1"><span class="trade-badge trade-badge--hot">Event Tickets</span> <span class="trade-badge trade-badge--fresh">Full Ticket</span></div>' +
            '<p class="text-sm text-gray-800 leading-snug line-clamp-2">Shanhuadi Sun Ruiyang Wang Ning Shenzhen VIP SVIP original price transfer</p>' +
            '<div class="mt-auto pt-2">' +
                '<div class="flex items-center justify-between">' +
                    '<span class="trade-price text-base">¥399</span>' +
                    '<span class="text-xs text-gray-400">8 want this</span>' +
                '</div>' +
                '<div class="flex items-center mt-2 space-x-1.5">' +
                    '<div class="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-[10px] text-purple-600 font-bold">T</div>' +
                    '<span class="text-xs text-gray-500">Idle Tickets</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    fixedCard2.addEventListener('click', function () {
        sessionStorage.setItem('viewProduct', JSON.stringify({
            id: 'shanhuadi2',
            title: 'Shanhuadi Sun Ruiyang Wang Ning Shenzhen VIP SVIP original price transfer',
            price: 399,
            description: 'Shanhuadi Sun Ruiyang Wang Ning Shenzhen show, VIP SVIP full ticket, purchased at original price, transferring due to schedule conflict, early sequence number, supports in-person ticket verification.',
            seller: 'Idle Tickets',
            tags: ['Event Tickets', 'Full Ticket'],
            images: ['images/shanhuadi2.jpg']
        }));
        window.location.href = 'product.html?id=shanhuadi2';
    });
    recommendGrid.appendChild(fixedCard2);
    } // end if (!seedFilter)

    var cacheKey = 'recommendCache_' + (seedFilter ? JSON.stringify(seedFilter).substring(0, 30) : 'all');
    var picked;
    var cachedItems = sessionStorage.getItem(cacheKey);
    if (cachedItems) {
        picked = JSON.parse(cachedItems);
    } else {
        var pool = seedFilter ? seedFilter : getAllSeeds();
        var seeds = shuffle(pool).slice(0, 8);
        picked = seeds.map(function(seed) {
            var item = makeItem(seed);
            item._bg = colors[Math.floor(Math.random() * colors.length)];
            item._h = heights[Math.floor(Math.random() * heights.length)];
            return item;
        });
        sessionStorage.setItem(cacheKey, JSON.stringify(picked));
    }

    picked.forEach(function (item) {
        var bg = item._bg || colors[0];
        var h = item._h || heights[0];
        var tagHtml = item.tags.map(function (t) {
            if (t === 'Free Shipping') return '<span class="trade-badge trade-badge--free">' + t + '</span>';
            if (t === 'Brand New') return '<span class="trade-badge trade-badge--fresh">' + t + '</span>';
            return '<span class="trade-badge trade-badge--hot">' + t + '</span>';
        }).join(' ');

        var card = document.createElement('div');
        card.className = 'trade-recommend-card';
        card.style.breakInside = 'avoid';
        card.style.marginBottom = '1rem';
        card.innerHTML =
            '<div class="' + h + ' bg-gradient-to-br ' + bg + ' flex items-center justify-center text-6xl">' + item.emoji + '</div>' +
            '<div class="p-3 flex flex-col flex-1">' +
                (tagHtml ? '<div class="mb-1">' + tagHtml + '</div>' : '') +
                '<p class="text-sm text-gray-800 leading-snug line-clamp-2">' + item.title + '</p>' +
                '<div class="mt-auto pt-2">' +
                    '<div class="flex items-center justify-between">' +
                        '<span class="trade-price text-base">¥' + item.price + '</span>' +
                        '<span class="text-xs text-gray-400">' + item.wants + ' want this</span>' +
                    '</div>' +
                    '<div class="flex items-center mt-2 space-x-1.5">' +
                        '<div class="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-[10px] text-purple-600 font-bold">' + item.seller.charAt(0) + '</div>' +
                        '<span class="text-xs text-gray-500">' + item.seller + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        card.addEventListener('click', function () {
            sessionStorage.setItem('viewProduct', JSON.stringify(item));
            window.location.href = 'product.html?id=' + item.id;
        });
        recommendGrid.appendChild(card);
    });
}

// ========== Recommendation feed tab switching ==========
var tabSeedMap = {
    'For You': null,
    'Personal Items': null,
    'Digital Devices': categoryMap['Phones/Digital/Computers'],
    'Textbooks': categoryMap['Textbooks/Study Materials'],
    'Instruments': categoryMap['Instruments/Stationery/Crafts'],
    'Photography': ['Mirrorless Camera','DSLR Camera'],
    'Sports & Outdoors': categoryMap['Clothing/Bags/Sports'],
    'Women\'s Fashion': ['Dress','T-Shirt','Hoodie','Jacket','Jeans'],
    'Home & Living': categoryMap['Furniture/Appliances/Daily']
};

document.querySelectorAll('.recommend-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        // 1. Reset all tab styles (remove purple gradient and white text, restore unselected white bg gray text)
        document.querySelectorAll('.recommend-tab').forEach(function (t) {
            t.style.background = '';
            t.classList.remove('text-white', 'font-bold', 'bg-gradient-to-br', 'from-purple-500', 'to-purple-600');
            t.classList.add('bg-white', 'text-gray-600');
        });

        // 2. Add theme-matching purple gradient to the clicked tab
        tab.classList.remove('bg-white', 'text-gray-600');
        tab.classList.add('text-white', 'font-bold', 'bg-gradient-to-br', 'from-purple-500', 'to-purple-600');
        // (Note: removed the previously hardcoded yellow tab.style.background)

        var label = tab.textContent.trim();

        // "For You" uses API to fetch real item data
        if (label === 'For You') {
            // Reset infinite scroll state for re-initialization
            apiState.infiniteScrollSetup = false;
            initApiItems(null, null);
            return;
        }

        // Other tabs use local mock data
        var subKeys = tabSeedMap[label];
        var pool = null;
        if (subKeys) {
            pool = [];
            subKeys.forEach(function (k) {
                if (searchSeeds[k]) pool = pool.concat(searchSeeds[k]);
            });
            if (pool.length === 0) pool = null;
        }
        // Disable infinite scroll, use mock data for rendering
        if (scrollObserver) {
            scrollObserver.disconnect();
        }
        var sentinel = document.getElementById('scroll-sentinel');
        if (sentinel) sentinel.remove();
        var endMsg = document.getElementById('feed-end-message');
        if (endMsg) endMsg.style.display = 'none';
        renderRecommend(pool);
    });
});

// ========== Card detail modal ==========
function openModal(card) {

    var banner = document.getElementById('modal-banner');
    banner.className = 'h-48 flex items-center justify-center text-6xl bg-gradient-to-br ' + (card.gradient || 'from-purple-300 to-purple-500');
    banner.textContent = card.emoji;
    document.getElementById('modal-title').textContent = card.title;
    document.getElementById('modal-desc').textContent = card.desc;
    document.getElementById('modal-price').textContent = card.price;
    document.getElementById('modal-original').textContent = card.original;
    detailModal.classList.remove('hidden');
    detailModal.classList.add('flex');
}

function closeModal() {
    detailModal.classList.add('hidden');
    detailModal.classList.remove('flex');
}

detailModal.addEventListener('click', function (e) {
    if (e.target === detailModal) closeModal();
});

// ========== Publish modal ==========
function openPublish() {
    if (!loggedIn){
        window.location.href = '/login/index.html?redirect=/azure_trade/trade';
    }
    publishModal.classList.remove('hidden');
    publishModal.classList.add('flex');
    submit_logic();
}

function closePublish() {
    publishModal.classList.add('hidden');
    publishModal.classList.remove('flex');
    publishForm.reset();
}

publishModal.addEventListener('click', function (e) {
    if (e.target === publishModal) closePublish();
});

var API = window.API_BASE || '';
var selectedImageFiles = [];

(function () {
    var fileInput = document.getElementById('publish-images');
    var preview = document.getElementById('image-preview');
    if (!fileInput || !preview) return;

    function renderImagePreview() {
        preview.innerHTML = '';
        selectedImageFiles.forEach(function (file, index) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var wrapper = document.createElement('div');
                wrapper.className = 'w-20 h-20 rounded-lg bg-gray-100 overflow-hidden relative group';
                wrapper.innerHTML =
                    '<img src="' + e.target.result + '" class="w-full h-full object-cover">' +
                    '<button type="button" data-index="' + index + '" class="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">&times;</button>';
                preview.appendChild(wrapper);

                wrapper.querySelector('button').addEventListener('click', function () {
                    var idx = parseInt(this.getAttribute('data-index'));
                    selectedImageFiles.splice(idx, 1);
                    var dt2 = new DataTransfer();
                    selectedImageFiles.forEach(function (f) { dt2.items.add(f); });
                    fileInput.files = dt2.files;
                    renderImagePreview();
                });
            };
            reader.readAsDataURL(file);
        });
    }

    fileInput.addEventListener('change', function () {
        var newFiles = Array.from(fileInput.files);
        selectedImageFiles = selectedImageFiles.concat(newFiles).slice(0, 9);

        var dt = new DataTransfer();
        selectedImageFiles.forEach(function (f) { dt.items.add(f); });
        fileInput.files = dt.files;

        renderImagePreview();
    });
})();

// ========== Publish form: description character count ==========
(function () {
    var desc = document.getElementById('publish-desc');
    var count = document.getElementById('desc-count');
    if (desc && count) {
        desc.addEventListener('input', function () {
            count.textContent = desc.value.length;
        });
    }
})();

// ========== Publish form: image preview ==========
// (function () {
//     var fileInput = document.getElementById('publish-images');
//     var preview = document.getElementById('image-preview');
//     if (!fileInput || !preview) return;
//     fileInput.addEventListener('change', function () {
//         preview.innerHTML = '';
//         Array.from(fileInput.files).slice(0, 9).forEach(function (file) {
//             var reader = new FileReader();
//             reader.onload = function (e) {
//                 var img = document.createElement('div');
//                 img.className = 'w-20 h-20 rounded-lg bg-gray-100 overflow-hidden';
//                 img.innerHTML = '<img src="' + e.target.result + '" class="w-full h-full object-cover">';
//                 preview.appendChild(img);
//             };
//             reader.readAsDataURL(file);
//         });
//     });
// })();

// Bind all "List Item" buttons
document.querySelectorAll('button').forEach(function (btn) {
    if (btn.textContent.indexOf('List Item') !== -1 || btn.textContent.indexOf('List') !== -1) {
        btn.addEventListener('click', openPublish);
    }
});

// ========== ESC to close modals ==========
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeModal(); closePublish();
        var dd = document.getElementById('user-dropdown');
        var ar = document.getElementById('avatar-arrow');
        if (dd && !dd.classList.contains('hidden')) {
            dd.classList.add('hidden');
            ar && ar.classList.remove('rotate-180');
        }
    }
});

// ========== User avatar dropdown panel ==========
(function () {
    var avatarBtn = document.getElementById('user-avatar-btn');
    var dropdown  = document.getElementById('user-dropdown');
    var arrow     = document.getElementById('avatar-arrow');
    var logoutBtn = document.getElementById('logout-btn');
    if (!avatarBtn || !dropdown) return;

    avatarBtn.addEventListener('click', function (e) {
        if (!loggedIn){
            window.location.href = '/login/index.html?redirect=/azure_trade/trade';
        }
        e.stopPropagation();
        var isOpen = !dropdown.classList.contains('hidden');
        if (isOpen) {
            dropdown.classList.add('hidden');
            arrow && arrow.classList.remove('rotate-180');
        } else {
            dropdown.classList.remove('hidden');
            arrow && arrow.classList.add('rotate-180');
        }
    });

    document.addEventListener('click', function (e) {
        if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
            arrow && arrow.classList.remove('rotate-180');
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () { showToast('Logged out'); });
    }

    dropdown.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function (e) {
            if (a.getAttribute('href') === '#') {
                e.preventDefault();
                var label = a.querySelector('.text-gray-700');
                if (label) showToast(label.textContent + ' - Feature coming soon');
            }
        });
    });
})();

// ========== Real-time statistics ==========
function updateDropdownCounts() {
    var published = JSON.parse(localStorage.getItem('publishedItems') || '[]');
    var postsCount = published.length;

    var dropdownPosts = document.getElementById('dropdown-posts');
    if (dropdownPosts) dropdownPosts.textContent = postsCount;
}

// ========== Initialize rendering ==========
renderCards(cards);

// Default: use API to fetch real item data
// initApiItems will automatically set up infinite scroll
initApiItems(null, null);

updateDropdownCounts();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(API + '/api/users/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: API ? 'omit' : 'include'
        });

        if (response.ok) {
            const user = await response.json();

            // Save full user data to localStorage (for profile and other pages)
            var existing = {};
            try { existing = JSON.parse(localStorage.getItem('userProfile') || '{}'); } catch(e) {}
            Object.keys(user).forEach(function(k) { existing[k] = user[k]; });
            localStorage.setItem('userProfile', JSON.stringify(existing));

            // Update avatar and username
            const headerAvatar = document.getElementById('header-avatar');
            const headerUsername = document.getElementById('header-username');
            const dropdownAvatar = document.getElementById('dropdown-avatar');
            const dropdownUsername = document.getElementById('dropdown-username');

            const username = user.username || user.nickname || 'User';
            const firstChar = username.charAt(0).toUpperCase();

            if (headerUsername) headerUsername.textContent = username;
            if (dropdownUsername) dropdownUsername.textContent = username;

            if (user.avatar) {
                const avatarUrl = user.avatar.startsWith('http') ? user.avatar : `/resources/${user.avatar}`;
                if (headerAvatar) {
                    headerAvatar.innerHTML = `<img src="${avatarUrl}" alt="${user.nickname}" class="w-10 h-10 rounded-full">`;
                    headerAvatar.className = 'w-10 h-10 rounded-full overflow-hidden';
                }
                if (dropdownAvatar) {
                    dropdownAvatar.innerHTML = '<img src="' + avatarUrl + '" class="w-14 h-14 rounded-full object-cover" onerror="this.parentElement.textContent=\'' + firstChar + '\'">';
                    dropdownAvatar.className = 'w-14 h-14 rounded-full overflow-hidden shadow-md';
                }
            } else {
                if (headerAvatar) headerAvatar.textContent = firstChar;
                if (dropdownAvatar) dropdownAvatar.textContent = firstChar;
            }

            // Update sidebar badges
            const badgeSell = document.getElementById('badge-sell');
            const badgeBuy = document.getElementById('badge-buy');
            const badgeFav = document.getElementById('badge-fav');

            if (badgeSell) badgeSell.textContent = user.sell || 0;
            if (badgeBuy) badgeBuy.textContent = user.buy || 0;
            if (badgeFav) badgeFav.textContent = user.favorites || 0;

            // Update dropdown panel: followers/following
            const dropdownFollowers = document.getElementById('dropdown-followers');
            const dropdownFollowing = document.getElementById('dropdown-following');
            if (dropdownFollowers) dropdownFollowers.textContent = user.followers || 0;
            if (dropdownFollowing) dropdownFollowing.textContent = user.followings || 0;

            // Update dropdown menu: posts/bought/sold/favorites count
            const dropdownPosts = document.getElementById('dropdown-posts');
            const dropdownBuy = document.getElementById('dropdown-buy');
            const dropdownSell = document.getElementById('dropdown-sell');
            const dropdownFav = document.getElementById('dropdown-fav');
            if (dropdownPosts) dropdownPosts.textContent = user.posts || 0;
            if (dropdownBuy) dropdownBuy.textContent = user.buy || 0;
            if (dropdownSell) dropdownSell.textContent = user.sell || 0;
            if (dropdownFav) dropdownFav.textContent = user.favorites || 0;

            loggedIn = true;
        } else {
            if (response.status === 401) {
                loggedIn = false;
                // window.location.href = '/login?redirect=/azure_trade/trade';
            }
        }
    } catch (error) {
        console.error("Failed to fetch user info:", error);
    }
});


// ========== Helper functions: delay and retry mechanism ==========
/** @typedef {Object} RetryOptions
 * @property {number} [maxRetries]
 * @property {number} [interval]
 */

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @param {string} itemId
 * @param {string[]} imageUuids
 * @param {number} [maxRetries=3]
 * @param {number} [interval=2000]
 * @returns {Promise<boolean>}
 */
const associateImagesWithRetry = async (itemId, imageUuids, maxRetries = 3, interval = 2000) => {
    let lastError = null;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            if (i > 0) {
                console.log(`[Retry] Image association retry attempt ${i}...`);
                await sleep(interval);
            }
            
            const res = await fetch(API + `/api/market/item/${itemId}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ images: imageUuids })
            });
            
            if (res.ok) return true;
            lastError = `HTTP ${res.status}`;
        } catch (err) {
            lastError = err.message;
        }
    }
    throw new Error(`Image association failed (retried ${maxRetries} times): ${lastError}`);
};

const submit_logic = function () {
    const form = document.getElementById('publish-form');
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnContent = submitBtn.innerHTML;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Show overlay and disable button
        const overlay = document.createElement('div');
        overlay.className = 'processing-overlay';
        document.body.appendChild(overlay);

        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
        submitBtn.innerHTML = `
            <span class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            </span>
        `;

        function resetBtn() {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            submitBtn.innerHTML = originalBtnContent;
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }

        const title = document.getElementById('itemTitle').value;
        const category = document.getElementById('itemCategory').value;
        const description = document.getElementById('itemDescription').value;
        const price = parseFloat(document.getElementById('itemPrice').value);
        const condition = parseInt(document.getElementById('itemCondition').value);
        const location = document.getElementById('itemLocation').value;

        const latVal = document.getElementById('itemLat').value;
        const lngVal = document.getElementById('itemLng').value;
        const lat = latVal ? parseFloat(latVal) : null;
        const lng = lngVal ? parseFloat(lngVal) : null;

        const isUrgent = document.getElementById('isUrgent').checked;
        const isShippingFree = document.getElementById('isShippingFree').checked;
        const canInspect = document.getElementById('canInspect').checked;

        if (!title || !category || !description || isNaN(price) || isNaN(condition)) {
            window.notify && window.notify.show.show('Please fill in all required fields!', 'warning');
            resetBtn();
            return;
        }

        try {
            let imageUuids = [];
            // 1. If there are images, upload them first to get UUIDs
            if (selectedImageFiles.length > 0) {
                const imageData = new FormData();
                selectedImageFiles.forEach(f => imageData.append('files', f));

                const uploadRes = await fetch(API + '/api/v1/images/upload', {
                    method: 'POST',
                    body: imageData
                });

                if (!uploadRes.ok) {
                    throw new Error('Image upload failed, please retry');
                }
                imageUuids = await uploadRes.json();
                window.notify && window.notify.show.show('Images uploaded!', 'success');
            }

            // 2. Create item
            const itemRes = await fetch(API + '/api/market/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title, category, description, price, condition, location,
                    lat, lng, isUrgent, isShippingFree, canInspect
                })
            });

            if (!itemRes.ok) {
                const errorData = await itemRes.json().catch(() => ({}));
                if (itemRes.status === 401) {
                    showToast('Please log in first');
                    window.location.href = '/login?redirect=/azure_trade/trade';
                    return;
                }
                throw new Error(errorData.message || 'Failed to list item');
            }

            const itemData = await itemRes.json();
            const uploadedItemId = itemData.itemId;

            // Core: add delay between item creation and image association
            if (imageUuids.length > 0 && uploadedItemId) {
                console.log('[Delay] Item created, waiting 1s to ensure backend data sync...');
                await sleep(1000);

                try {
                    // Use retry mechanism for image association
                    await associateImagesWithRetry(uploadedItemId, imageUuids);
                } catch (bindErr) {
                    console.error('Image association ultimately failed:', bindErr);
                    window.notify && window.notify.show.show('Item listed, but image sync failed. Please retry on the detail page.', 'warning');
                }
            }

            // Success
            console.log('Item listed successfully!');
            showToast('Published! Item is now listed');
            closePublish();
            form.reset();

            // Reset state
            document.getElementById('itemLat').value = '';
            document.getElementById('itemLng').value = '';
            selectedImageFiles = [];
            const preview = document.getElementById('image-preview');
            if (preview) preview.innerHTML = '';
            
            // Update local storage
            const published = JSON.parse(localStorage.getItem('publishedItems') || '[]');
            published.unshift({
                id: uploadedItemId || Date.now().toString(),
                title, category, description, price, condition, location,
                createdAt: new Date().toISOString(),
                status: 'available'
            });
            localStorage.setItem('publishedItems', JSON.stringify(published));
            updateDropdownCounts();

        } catch (error) {
            console.error('Error submitting item:', error);
            showToast(error.message || 'Listing failed, please retry', 'error');
        } finally {
            resetBtn();
        }
    });
}

// ========== MarketController API utility functions ==========

/**
 * Favorite an item
 * @param {string} itemId
 * @returns {Promise<boolean>}
 */
async function favoriteItem(itemId) {
    try {
        var response = await fetch(API + '/api/market/items/favorite?itemId=' + encodeURIComponent(itemId), {
            method: 'POST',
            credentials: API ? 'omit' : 'include'
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to favorite:', error);
        return false;
    }
}

/**
 * Get current user's favorite list
 * @returns {Promise<Array>}
 */
async function getFavoriteItems() {
    try {
        var response = await fetch(API + '/api/market/items/favorites', {
            method: 'GET',
            credentials: API ? 'omit' : 'include'
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch favorites:', error);
        return [];
    }
}

/**
 * Get all item categories
 * @returns {Promise<Array>}
 */
async function getCategories() {
    try {
        var response = await fetch(API + '/api/market/categories', {
            method: 'GET',
            credentials: API ? 'omit' : 'include'
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return [];
    }
}

/**
 * Contact seller
 * @param {string} sellerId
 * @param {string} message
 * @param {string} itemId
 * @returns {Promise<Object|null>}
 */
async function contactSeller(sellerId, message, itemId) {
    try {
        var response = await fetch(API + '/api/market/' + encodeURIComponent(sellerId) + '/contact', {
            method: 'POST',
            credentials: API ? 'omit' : 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, itemId: itemId })
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Failed to contact seller:', error);
        return null;
    }
}

/**
 * Delete an item
 * @param {string} itemId
 * @returns {Promise<boolean>}
 */
async function deleteItem(itemId) {
    try {
        var response = await fetch(API + '/api/market/items/' + encodeURIComponent(itemId), {
            method: 'DELETE',
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to delete item:', error);
        return false;
    }
}

/**
 * Get current user's item list
 * @param {string} [status]
 * @param {number} [page]
 * @param {number} [limit]
 * @returns {Promise<Array>}
 */
async function getMyItems(status, page, limit) {
    try {
        var params = new URLSearchParams();
        if (status) params.set('status', status);
        if (page) params.set('page', page);
        if (limit) params.set('limit', limit);
        var response = await fetch(API + '/api/market/users/me/items?' + params.toString(), {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch my items:', error);
        return [];
    }
}