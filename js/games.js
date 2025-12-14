// Games page functionality - Optimized

let allGames = [];
let filteredGames = [];
let gamesLoaded = false;

// Optimized games loading with caching
async function loadGames() {
    if (gamesLoaded) return;
    
    const loadingEl = document.getElementById('loadingGames');
    const gamesGrid = document.getElementById('gamesGrid');
    
    try {
        // Show loading
        if (loadingEl) loadingEl.style.display = 'block';
        if (gamesGrid) gamesGrid.innerHTML = '';
        
        // Use cached data if available
        const cachedGames = sessionStorage.getItem('gamesCache');
        const cacheTime = sessionStorage.getItem('gamesCacheTime');
        const now = Date.now();
        
        // Use cache if less than 5 minutes old
        if (cachedGames && cacheTime && (now - parseInt(cacheTime)) < 300000) {
            allGames = JSON.parse(cachedGames);
            filteredGames = [...allGames];
            displayGames();
            gamesLoaded = true;
            if (loadingEl) loadingEl.style.display = 'none';
            return;
        }
        
        // Load from Firebase with optimized query
        const gamesSnapshot = await db.collection('games')
            .where('active', '==', true)
            .orderBy('title')
            .get();

        allGames = [];
        gamesSnapshot.forEach(doc => {
            const gameData = doc.data();
            allGames.push({
                id: doc.id,
                slug: gameData.slug || doc.id,
                title: gameData.title || 'لعبة',
                category: gameData.category || 'other',
                thumbnail: gameData.thumbnail || null,
                description: gameData.description || ''
            });
        });

        // Cache the results
        sessionStorage.setItem('gamesCache', JSON.stringify(allGames));
        sessionStorage.setItem('gamesCacheTime', now.toString());
        
        filteredGames = [...allGames];
        displayGames();
        gamesLoaded = true;

    } catch (error) {
        console.error('Error loading games:', error);
        if (gamesGrid) {
            gamesGrid.innerHTML = `
                <div class="no-games">
                    <div class="no-games-icon">⚠️</div>
                    <h3>خطأ في التحميل</h3>
                    <p>حدث خطأ أثناء تحميل الألعاب</p>
                    <button class="btn btn-primary" onclick="retryLoadGames()">إعادة المحاولة</button>
                </div>
            `;
        }
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// Retry loading games
function retryLoadGames() {
    gamesLoaded = false;
    sessionStorage.removeItem('gamesCache');
    sessionStorage.removeItem('gamesCacheTime');
    loadGames();
}

// Optimized display function
function displayGames() {
    const gamesGrid = document.getElementById('gamesGrid');
    const noGamesEl = document.getElementById('noGamesFound');
    
    if (!gamesGrid) return;

    if (filteredGames.length === 0) {
        gamesGrid.innerHTML = '';
        if (noGamesEl) noGamesEl.style.display = 'block';
        return;
    }

    if (noGamesEl) noGamesEl.style.display = 'none';
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    filteredGames.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.innerHTML = `
            <img src="${game.thumbnail || 'https://via.placeholder.com/300x200/3498db/ffffff?text=🎮'}" 
                 alt="${game.title}" 
                 class="game-image"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200/3498db/ffffff?text=🎮'">
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <div class="game-meta">
                    <span class="game-category">${getCategoryName(game.category)}</span>
                    <span class="game-points">+1 نقطة/دقيقة</span>
                </div>
                <div class="game-actions">
                    <a href="game.html?slug=${game.slug}" class="btn btn-primary">🎮 العب الآن</a>
                </div>
            </div>
        `;
        fragment.appendChild(gameCard);
    });
    
    gamesGrid.innerHTML = '';
    gamesGrid.appendChild(fragment);
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load games immediately
    loadGames();
    
    // Update games count in stats
    setTimeout(() => {
        const totalGamesCount = document.getElementById('totalGamesCount');
        if (totalGamesCount && allGames.length > 0) {
            totalGamesCount.textContent = `${allGames.length}+`;
        }
    }, 1000);
});