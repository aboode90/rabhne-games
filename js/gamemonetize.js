// GameMonetize Integration

const GAMEMONETIZE_CONFIG = {
    gameFeedUrl: 'https://gamemonetize.com/feed.php?format=0&num=50&page=1',
    publisherId: 'YOUR_PUBLISHER_ID',
    apiKey: 'YOUR_API_KEY', 
    siteId: 'YOUR_SITE_ID'
};

// جلب الألعاب من GameMonetize Game Feed
async function fetchGameMonetizeGames() {
    try {
        const gameFeedUrl = localStorage.getItem('gm_game_feed_url') || 'https://gamemonetize.com/feed.php?format=0&category=13&platform=1&num=20&page=1';
        const response = await fetch(gameFeedUrl, {
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const text = await response.text();
        console.log('Raw response:', text);
        const data = JSON.parse(text);
        return data || [];
    } catch (error) {
        console.error('Error fetching GameMonetize games:', error);
        return [];
    }
}

// إضافة ألعاب GameMonetize إلى قاعدة البيانات
async function syncGameMonetizeGames() {
    if (!currentUser) return;
    
    try {
        const games = await fetchGameMonetizeGames();
        const batch = db.batch();
        
        console.log('Games data structure:', games);
        
        // التحقق من هيكل البيانات
        const gamesList = Array.isArray(games) ? games : (games.games || []);
        
        gamesList.slice(0, 20).forEach(game => { // أول 20 لعبة
            const gameRef = db.collection('games').doc(`gm_${game.id}`);
            batch.set(gameRef, {
                title: game.title || game.name || 'لعبة',
                description: game.description || game.desc || '',
                thumbnail: game.thumb || game.thumbnail || game.image || '',
                category: mapGameCategory(game.category || game.cat),
                gameUrl: game.url || game.game_url || game.link || '',
                source: 'gamemonetize',
                gameId: game.id,
                width: game.width || 800,
                height: game.height || 600,
                active: true,
                slug: `gm-${game.id}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        console.log('GameMonetize games synced successfully');
        
    } catch (error) {
        console.error('Error syncing games:', error);
    }
}

// تحويل فئات الألعاب
function mapGameCategory(category) {
    const categoryMap = {
        'Action': 'action',
        'Puzzle': 'puzzle',
        'Racing': 'racing',
        'Sports': 'sports',
        'Adventure': 'adventure'
    };
    return categoryMap[category] || 'other';
}

// إنشاء iframe للعبة مع تتبع الوقت
function createGameFrame(gameData) {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;
    
    // إنشاء iframe
    const iframe = document.createElement('iframe');
    iframe.src = gameData.gameUrl;
    iframe.width = gameData.width || '800';
    iframe.height = gameData.height || '600';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.style.cssText = `
        width: 100%;
        height: 600px;
        border: none;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    `;
    
    gameContainer.innerHTML = '';
    gameContainer.appendChild(iframe);
    
    // بدء تتبع وقت اللعب
    startGameTracking(gameData.id);
}

// تتبع وقت اللعب وإضافة النقاط
let gameStartTime = null;
let gameTrackingInterval = null;

function startGameTracking(gameId) {
    if (!currentUser) return;
    
    gameStartTime = Date.now();
    
    // إضافة نقطة كل دقيقة
    gameTrackingInterval = setInterval(async () => {
        try {
            await addGamePoints(gameId);
        } catch (error) {
            console.error('Error adding game points:', error);
        }
    }, 60000); // كل دقيقة
    
    // تنظيف عند مغادرة الصفحة
    window.addEventListener('beforeunload', stopGameTracking);
}

function stopGameTracking() {
    if (gameTrackingInterval) {
        clearInterval(gameTrackingInterval);
        gameTrackingInterval = null;
    }
    
    if (gameStartTime) {
        const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
        console.log(`Game played for ${playTime} seconds`);
        gameStartTime = null;
    }
}

// إضافة نقاط اللعب
async function addGamePoints(gameId) {
    if (!currentUser) return;
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        
        if (!userData || userData.blocked) return;
        
        // التحقق من الحد اليومي
        const today = new Date().toDateString();
        const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate() : null;
        const lastClaimDate = lastClaim ? lastClaim.toDateString() : null;
        let dailyPoints = userData.dailyPoints || 0;
        
        if (lastClaimDate !== today) {
            dailyPoints = 0;
        }
        
        if (dailyPoints >= 2880) return; // الحد الأقصى اليومي
        
        // إضافة نقطة واحدة
        await userRef.update({
            points: firebase.firestore.FieldValue.increment(1),
            dailyPoints: firebase.firestore.FieldValue.increment(1),
            lastClaimAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // تسجيل المعاملة
        await db.collection('transactions').add({
            uid: currentUser.uid,
            type: 'game_play',
            pointsDelta: 1,
            note: `لعب لعبة ${gameId}`,
            gameId: gameId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // تحديث النقاط في الواجهة
        updateUserPoints();
        
        // إظهار رسالة
        showMessage('+1 نقطة من اللعب! 🎮', 'success');
        
    } catch (error) {
        console.error('Error adding game points:', error);
    }
}

// تحديث النقاط في الواجهة
function updateUserPoints() {
    if (getCachedUserData) {
        loadUserPoints(); // من auth.js
    }
}

// تحديث معرف اللعبة للفيديو التوضيحي
function updateVideoWalkthrough(gameId) {
    if (window.VIDEO_OPTIONS && gameId) {
        window.VIDEO_OPTIONS.gameid = gameId;
        
        // إعادة تحميل الفيديو مع المعرف الجديد
        const existingScript = document.getElementById('gamemonetize-video-api');
        if (existingScript) {
            existingScript.remove();
        }
        
        // تحميل الفيديو الجديد
        (function (a, b, c) {
            var d = a.getElementsByTagName(b)[0];
            a.getElementById(c) || (a = a.createElement(b), a.id = c, a.src = "https://api.gamemonetize.com/video.js", d.parentNode.insertBefore(a, d))
        })(document, "script", "gamemonetize-video-api");
    }
}