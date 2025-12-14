// Game page functionality with AdCash VAST integration
let currentGame = null;
let gameInterval = null;
let gameTimer = null;
let secondsPlayed = 0;
let adWatched = false;

// Load game data
async function loadGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
        showMessage('لم يتم تحديد اللعبة', 'error');
        return;
    }

    try {
        const gameQuery = await db.collection('games')
            .where('slug', '==', slug)
            .limit(1)
            .get();

        if (gameQuery.empty) {
            showMessage('اللعبة غير موجودة', 'error');
            return;
        }

        currentGame = gameQuery.docs[0].data();
        currentGame.id = gameQuery.docs[0].id;

        // Update page title and info
        document.getElementById('gameTitle').textContent = currentGame.title;
        document.getElementById('gameCategory').textContent = getCategoryName(currentGame.category);

        // Check if user is logged in
        if (currentUser) {
            document.getElementById('authRequired').style.display = 'none';
            document.getElementById('claimSection').style.display = 'block';
            
            // Load user points
            loadUserPoints();
        }

        console.log('Game loaded:', currentGame);

    } catch (error) {
        console.error('Error loading game:', error);
        showMessage('حدث خطأ أثناء تحميل اللعبة', 'error');
    }
}

// Show AdCash VAST video ad before unlocking game
function showAdCashVideoAd() {
    // Hide game frame and show lock overlay
    document.getElementById('gameFrame').style.display = 'none';
    document.getElementById('gameLockOverlay').style.display = 'flex';
    
    // Create AdCash video ad container
    const adContainer = document.createElement('div');
    adContainer.id = 'adcash-video-ad';
    adContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    `;
    
    adContainer.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; max-width: 90%;">
            <h3>🎬 شاهد الإعلان لفتح اللعبة</h3>
            <p>سيتم فتح اللعبة تلقائياً بعد مشاهدة الإعلان</p>
            <div id="adcash-ad-container" style="margin: 20px 0; width: 640px; height: 360px;">
                <div id="video-player-container">
                    <video id="adcash-video-player" class="video-js vjs-default-skin" controls preload="auto" width="640" height="360">
                        <source src="" type="video/mp4">
                    </video>
                </div>
            </div>
            <button id="close-ad-btn" class="btn btn-secondary" style="display: none;">إغلاق</button>
        </div>
    `;
    
    document.body.appendChild(adContainer);
    
    // Load AdCash VAST video ad
    loadAdCashVASTAd();
}

// Load AdCash VAST Video Ad
function loadAdCashVASTAd() {
    // AdCash VAST Tag URL
    const vastTagUrl = 'https://youradexchange.com/video/select.php?r=10711262';
    
    // Create video player
    const videoContainer = document.getElementById('video-player-container');
    if (videoContainer) {
        // Load Video.js CSS
        const videoCSS = document.createElement('link');
        videoCSS.rel = 'stylesheet';
        videoCSS.href = 'https://vjs.zencdn.net/8.6.1/video-js.css';
        document.head.appendChild(videoCSS);
        
        // Load Video.js and IMA plugin
        const videoScript = document.createElement('script');
        videoScript.src = 'https://vjs.zencdn.net/8.6.1/video.min.js';
        document.head.appendChild(videoScript);
        
        const imaScript = document.createElement('script');
        imaScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/videojs-contrib-ads/6.9.0/videojs-contrib-ads.min.js';
        document.head.appendChild(imaScript);
        
        videoScript.onload = function() {
            imaScript.onload = function() {
                // Initialize player
                const player = videojs('adcash-video-player', {
                    autoplay: true,
                    controls: true,
                    responsive: true
                });
                
                // Load VAST ad
                player.ready(function() {
                    player.ads();
                    
                    // Play VAST ad
                    player.src(vastTagUrl);
                    
                    player.on('ended', function() {
                        console.log('AdCash VAST ad completed');
                        unlockGameAfterAd();
                    });
                    
                    player.on('error', function() {
                        console.log('AdCash VAST ad error');
                        showMessage('حدث خطأ في عرض الإعلان، يرجى المحاولة مرة أخرى', 'error');
                        document.getElementById('close-ad-btn').style.display = 'block';
                    });
                });
            };
        };
    }
}

// Unlock game after watching ad
function unlockGameAfterAd() {
    adWatched = true;
    
    // Remove ad container
    const adContainer = document.getElementById('adcash-video-ad');
    if (adContainer) {
        adContainer.remove();
    }
    
    // Unlock game
    unlockGame();
    
    showMessage('تم فتح اللعبة! يمكنك الآن اللعب', 'success');
}

// Unlock game (modified version)
function unlockGame() {
    if (!adWatched) {
        showAdCashVideoAd();
        return;
    }
    
    document.getElementById('gameLockOverlay').style.display = 'none';
    document.getElementById('gameFrame').style.display = 'block';
    document.getElementById('gameFrame').src = currentGame.iframeUrl;
    
    // Start game timer
    startGameTimer();
    
    // Update game plays count
    if (currentGame.id) {
        db.collection('games').doc(currentGame.id).update({
            plays: firebase.firestore.FieldValue.increment(1)
        }).catch(console.error);
    }
}

// Start game timer
function startGameTimer() {
    if (gameTimer) clearInterval(gameTimer);
    
    secondsPlayed = 0;
    updateGameTimer();
    
    gameTimer = setInterval(() => {
        secondsPlayed++;
        updateGameTimer();
        
        // Award point every 30 seconds
        if (secondsPlayed % 30 === 0) {
            awardPoint();
        }
    }, 1000);
}

// Award point to user
async function awardPoint() {
    if (!currentUser) return;
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        
        // Check daily limit
        const today = new Date().toDateString();
        const lastClaimDate = userData.lastClaimAt ? userData.lastClaimAt.toDate().toDateString() : '';
        
        let dailyPoints = userData.dailyPoints || 0;
        if (lastClaimDate !== today) {
            dailyPoints = 0;
        }
        
        if (dailyPoints >= APP_CONFIG.DAILY_LIMIT) {
            showMessage('لقد وصلت للحد الأقصى اليومي من النقاط', 'error');
            return;
        }
        
        // Update user points
        await userRef.update({
            points: firebase.firestore.FieldValue.increment(APP_CONFIG.POINTS_PER_CLAIM),
            dailyPoints: firebase.firestore.FieldValue.increment(APP_CONFIG.POINTS_PER_CLAIM),
            lastClaimAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add transaction log
        await db.collection('transactions').add({
            uid: currentUser.uid,
            type: 'game_play',
            pointsDelta: APP_CONFIG.POINTS_PER_CLAIM,
            gameId: currentGame.id,
            gameTitle: currentGame.title,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update UI
        loadUserPoints();
        showMessage('تم احتساب نقطة واحدة!', 'success');
        
    } catch (error) {
        console.error('Error awarding point:', error);
        showMessage('حدث خطأ أثناء احتساب النقاط', 'error');
    }
}

// Update game timer display
function updateGameTimer() {
    const minutes = Math.floor(secondsPlayed / 60);
    const seconds = secondsPlayed % 60;
    document.getElementById('gameTimer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Start game
function startGame() {
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    if (!adWatched) {
        showAdCashVideoAd();
        return;
    }
    
    document.getElementById('startGameBtn').style.display = 'none';
    document.getElementById('stopGameBtn').style.display = 'inline-block';
    document.getElementById('gameStatus').textContent = '🎮 اللعب قيد التشغيل';
    document.getElementById('gameStatus').className = 'game-status active';
    
    // Start timer if not already started
    if (!gameTimer) {
        startGameTimer();
    }
}

// Stop game
function stopGame() {
    document.getElementById('startGameBtn').style.display = 'inline-block';
    document.getElementById('stopGameBtn').style.display = 'none';
    document.getElementById('gameStatus').textContent = '⏸️ اللعب متوقف';
    document.getElementById('gameStatus').className = 'game-status inactive';
    
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
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

// Initialize game page
document.addEventListener('DOMContentLoaded', function () {
    loadGame();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function () {
        if (gameTimer) clearInterval(gameTimer);
    });
});

// Make functions globally available
window.startGame = startGame;
window.stopGame = stopGame;
window.showAdCashVideoAd = showAdCashVideoAd;
window.unlockGame = unlockGame;