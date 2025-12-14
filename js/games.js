// Games page functionality

let allGames = [];
let filteredGames = [];

// Load games from Firestore
async function loadGames() {
    try {
        console.log('Loading games...');
        const gamesSnapshot = await db.collection('games').get();
        console.log('Games loaded:', gamesSnapshot.size);

        allGames = [];
        gamesSnapshot.forEach(doc => {
            const gameData = doc.data();
            console.log('Game data:', gameData);
            if (gameData.isActive === true) {
                allGames.push({
                    id: doc.id,
                    ...gameData
                });
            }
        });

        console.log('Active games:', allGames.length);
        filteredGames = [...allGames];
        displayGames();

    } catch (error) {
        console.error('Error loading games:', error);
        showMessage('حدث خطأ أثناء تحميل الألعاب', 'error');
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
            <img src="${game.thumbnailUrl || 'img/game.jpg'}" alt="${game.title}" class="game-thumbnail" 
                 onerror="this.src='img/game.jpg'">
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
    loadGames();
});