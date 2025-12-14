// Games page functionality

let allGames = [];
let filteredGames = [];

// Load games from Firestore
async function loadGames() {
    try {
        console.log('Loading games...');
        
        // Check if user is authenticated first
        const user = firebase.auth().currentUser;
        console.log('Current user:', user ? user.email : 'Not logged in');
        
        const gamesSnapshot = await db.collection('games').get();
        console.log('Games loaded from DB:', gamesSnapshot.size);

        allGames = [];
        gamesSnapshot.forEach(doc => {
            const gameData = doc.data();
            console.log('Game:', doc.id, gameData);
            
            // Add all games, check active status
            if (gameData.active === true) {
                allGames.push({
                    id: doc.id,
                    slug: gameData.slug || doc.id,
                    ...gameData
                });
                console.log('Added active game:', gameData.title);
            } else {
                console.log('Skipped inactive game:', gameData.title);
            }
        });

        console.log('Total active games:', allGames.length);
        filteredGames = [...allGames];
        displayGames();

    } catch (error) {
        console.error('Error loading games:', error);
        console.error('Error details:', error.code, error.message);
        showMessage('حدث خطأ أثناء تحميل الألعاب: ' + error.message, 'error');
        
        // Show error in games grid
        const gamesGrid = document.getElementById('gamesGrid');
        if (gamesGrid) {
            gamesGrid.innerHTML = `<p class="text-center" style="color: red;">خطأ: ${error.message}</p>`;
        }
    } finally {
        const loadingEl = document.getElementById('loadingGames');
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// Display games in grid
function displayGames() {
    const gamesGrid = document.getElementById('gamesGrid');

    if (filteredGames.length === 0) {
        gamesGrid.innerHTML = '<p class="text-center">لا توجد ألعاب متاحة</p>';
        return;
    }

    gamesGrid.innerHTML = filteredGames.map(game => `
        <div class="game-card">
            <img src="${game.thumbnail || 'https://via.placeholder.com/300x200/007bff/ffffff?text=🎮'}" 
                 alt="${game.title}" 
                 class="game-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/300x200/007bff/ffffff?text=🎮'">
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <p class="game-category">${getCategoryName(game.category)}</p>
                <a href="game.html?slug=${game.slug}" class="btn btn-primary">العب الآن</a>
            </div>
        </div>
    `).join('');
}

// Filter games by category
function filterGames() {
    const categoryFilter = document.getElementById('categoryFilter');
    const selectedCategory = categoryFilter.value;

    if (selectedCategory === '') {
        filteredGames = [...allGames];
    } else {
        filteredGames = allGames.filter(game => game.category === selectedCategory);
    }

    displayGames();
}

// Get category name in Arabic
function getCategoryName(category) {
    const categories = {
        'action': 'أكشن',
        'puzzle': 'ألغاز',
        'racing': 'سباق',
        'sports': 'رياضة',
        'adventure': 'مغامرة'
    };

    return categories[category] || category;
}

// Initialize games page
document.addEventListener('DOMContentLoaded', function () {
    console.log('Games page DOM loaded');
    
    // Wait for Firebase to initialize
    firebase.auth().onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? user.email : 'No user');
        loadGames();
    });
    
    // Also try loading immediately
    setTimeout(loadGames, 1000);
});