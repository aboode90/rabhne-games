// Games page functionality - Enhanced with UI States

let allGames = [];
let filteredGames = [];
let gamesLoaded = false;
let gamesUIState;

// Initialize UI state manager
function initGamesUI() {
    gamesUIState = createUIState('gamesGrid');
}

// Fast games loading with cache and state management
async function loadGames() {
    if (gamesLoaded) return;
    
    // Show loading skeleton immediately
    gamesUIState.showLoading('cards', 12);
    
    try {
        // Check cache first (5 min expiry)
        const cached = getCachedGames();
        if (cached) {
            allGames = cached;
            filteredGames = [...allGames];
            displayGames();
            gamesLoaded = true;
            return;
        }
        
        // Fetch with timeout
        const gamesPromise = db.collection('games')
            .where('active', '==', true)
            .orderBy('title')
            .get();
            
        const gamesSnapshot = await fetchWithTimeout(gamesPromise, 8000);

        allGames = [];
        gamesSnapshot.forEach(doc => {
            const data = doc.data();
            allGames.push({
                id: doc.id,
                slug: data.slug || doc.id,
                title: data.title || 'لعبة',
                category: data.category || 'other',
                thumbnail: data.thumbnail || null,
                description: data.description || ''
            });
        });

        // Cache results
        setCachedGames(allGames);
        
        filteredGames = [...allGames];
        displayGames();
        gamesLoaded = true;

    } catch (error) {
        console.error('Games loading error:', error);
        gamesUIState.showError('فشل في تحميل الألعاب');
    }
}

// Cache helpers
function getCachedGames() {
    const cached = sessionStorage.getItem('gamesCache');
    const cacheTime = sessionStorage.getItem('gamesCacheTime');
    const now = Date.now();
    
    if (cached && cacheTime && (now - parseInt(cacheTime)) < 300000) {
        return JSON.parse(cached);
    }
    return null;
}

function setCachedGames(games) {
    sessionStorage.setItem('gamesCache', JSON.stringify(games));
    sessionStorage.setItem('gamesCacheTime', Date.now().toString());
}

// Retry loading games
function retryLoadGames() {
    gamesLoaded = false;
    sessionStorage.removeItem('gamesCache');
    sessionStorage.removeItem('gamesCacheTime');
    loadGames();
}

// Fast display with state management
function displayGames() {
    if (filteredGames.length === 0) {
        gamesUIState.showEmpty('لا توجد ألعاب', '🎮', {
            text: 'إعادة تحميل',
            action: 'retryLoadGames()'
        });
        return;
    }
    
    // Build games HTML efficiently
    const gamesHTML = filteredGames.map(game => `
        <div class="card game-card">
            <img src="${game.thumbnail || 'img/placeholder.svg'}" 
                 alt="${game.title}" 
                 class="game-image"
                 loading="lazy"
                 onerror="this.src='img/placeholder.svg'">
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <div class="game-meta">
                    <span class="badge badge-info">${getCategoryName(game.category)}</span>
                    <span class="badge badge-success">+1 نقطة/دقيقة</span>
                </div>
                <div class="game-actions">
                    <a href="game.html?slug=${game.slug}" class="btn btn-primary">🎮 العب الآن</a>
                </div>
            </div>
        </div>
    `).join('');
    
    gamesUIState.showData(`<div class="grid grid-4">${gamesHTML}</div>`);
}

// Filter by category with buttons
function filterByCategory(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Filter games
    if (category === '') {
        filteredGames = [...allGames];
    } else {
        filteredGames = allGames.filter(game => game.category === category);
    }
    
    displayGames();
}

// Search games
function searchGames() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredGames = [...allGames];
    } else {
        filteredGames = allGames.filter(game => 
            game.title.toLowerCase().includes(searchTerm) ||
            getCategoryName(game.category).toLowerCase().includes(searchTerm)
        );
    }
    
    displayGames();
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    filteredGames = [...allGames];
    displayGames();
}

// Get category name in Arabic
function getCategoryName(category) {
    const categories = {
        'action': 'أكشن',
        'puzzle': 'ألغاز', 
        'racing': 'سباق',
        'sports': 'رياضة',
        'adventure': 'مغامرة',
        'other': 'أخرى'
    };
    return categories[category] || category;
}

// Retry loading
function retryLoadGames() {
    gamesLoaded = false;
    sessionStorage.removeItem('gamesCache');
    sessionStorage.removeItem('gamesCacheTime');
    loadGames();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI state manager
    initGamesUI();
    
    // Load games immediately (not dependent on auth)
    loadGames();
    
    // Update stats when games load
    const updateStats = () => {
        const totalGamesCount = document.getElementById('totalGamesCount');
        if (totalGamesCount && allGames.length > 0) {
            totalGamesCount.textContent = allGames.length;
        }
    };
    
    // Check periodically for loaded games
    const statsInterval = setInterval(() => {
        if (gamesLoaded) {
            updateStats();
            clearInterval(statsInterval);
        }
    }, 500);
});