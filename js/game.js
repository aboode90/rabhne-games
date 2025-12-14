// Game page functionality

let currentGame = null;
let gameSlug = null;

// Load game data
async function loadGame() {
    gameSlug = getUrlParameter('slug');

    if (!gameSlug) {
        showMessage('لعبة غير موجودة', 'error');
        window.location.href = 'games.html';
        return;
    }

    try {
        const gameSnapshot = await db.collection('games')
            .where('slug', '==', gameSlug)
            .where('isActive', '==', true)
            .get();

        if (gameSnapshot.empty) {
            showMessage('لعبة غير موجودة', 'error');
            window.location.href = 'games.html';
            return;
        }

        currentGame = gameSnapshot.docs[0].data();

        // Update page content
        document.getElementById('gameTitle').textContent = currentGame.title;
        document.getElementById('gameCategory').textContent = getCategoryName(currentGame.category);
        document.getElementById('gameFrame').src = currentGame.iframeUrl;

        // Update page title
        document.title = `${currentGame.title} - Rabhne`;

        // Update plays count
        await db.collection('games').doc(gameSnapshot.docs[0].id).update({
            plays: firebase.firestore.FieldValue.increment(1)
        });

        updateGameUI();

    } catch (error) {
        console.error('Error loading game:', error);
        showMessage('حدث خطأ أثناء تحميل اللعبة', 'error');
    }
}

// Update game UI based on auth state
function updateGameUI() {
    const authRequired = document.getElementById('authRequired');
    const claimSection = document.getElementById('claimSection');

    if (currentUser) {
        authRequired.style.display = 'none';
        claimSection.style.display = 'block';
        authRequired.style.display = 'none';
        claimSection.style.display = 'block';
        updateClaimButton(); // This might handle the time button
        if (window.loadGameStats) window.loadGameStats(); // Refresh points display
    } else {
        authRequired.style.display = 'block';
        claimSection.style.display = 'none';
    }
}

// Claim points for this game
async function claimGamePoints() {
    await claimPoints(gameSlug);
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

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
    if (currentGame) {
        updateGameUI();
    }
});

// Initialize game page
document.addEventListener('DOMContentLoaded', function() {
    loadGame();
});

// Watch-to-Play Logic
let gameUnlockTimer = null;

function unlockGame() {
    const overlay = document.getElementById('gameLockOverlay');
    const iframe = document.getElementById('gameFrame');

    if (overlay) overlay.style.display = 'none';
    if (iframe) iframe.style.display = 'block';

    showMessage('تم فتح اللعبة لمدة 5 دقائق 🔓', 'success');

    // Start 5 minute timer to re-lock
    clearTimeout(gameUnlockTimer);
    gameUnlockTimer = setTimeout(() => {
        lockGame();
    }, 5 * 60 * 1000); // 5 minutes
}

function lockGame() {
    const overlay = document.getElementById('gameLockOverlay');
    const iframe = document.getElementById('gameFrame');

    if (overlay) {
        overlay.style.display = 'flex';
        // Update text to indicate re-lock
        const title = overlay.querySelector('h2');
        if (title) title.textContent = '🔒 انتهى الوقت';
    }
    if (iframe) iframe.style.display = 'none';

    // Stop game earning logic if running
    if (typeof stopGame === 'function') stopGame();

    showMessage('انتهى الوقت! شاهد إعلان للمتابعة', 'warning');
}