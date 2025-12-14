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
        setTimeout(() => window.location.href = 'games.html', 2000);
        return;
    }

    try {
        const gameQuery = await db.collection('games')
            .where('slug', '==', slug)
            .where('active', '==', true)
            .limit(1)
            .get();

        if (gameQuery.empty) {
            showMessage('اللعبة غير موجودة أو غير نشطة', 'error');
            setTimeout(() => window.location.href = 'games.html', 2000);
            return;
        }

        currentGame = gameQuery.docs[0].data();
        currentGame.id = gameQuery.docs[0].id;

        // Validate game data
        if (!currentGame.iframeUrl || !currentGame.title) {
            showMessage('بيانات اللعبة غير مكتملة', 'error');
            return;
        }

        // Update page title and info
        document.title = `${currentGame.title} - Rabhne`;
        const titleEl = document.getElementById('gameTitle');
        const categoryEl = document.getElementById('gameCategory');
        
        if (titleEl) titleEl.textContent = currentGame.title;
        if (categoryEl) categoryEl.textContent = getCategoryName(currentGame.category);

        // Wait for auth state
        if (authInitialized) {
            updateGameUI();
        } else {
            firebase.auth().onAuthStateChanged(() => {
                updateGameUI();
            });
        }

        console.log('Game loaded:', currentGame.title);

    } catch (error) {
        console.error('Error loading game:', error);
        showMessage('حدث خطأ أثناء تحميل اللعبة: ' + error.message, 'error');
    }
}

// Update game UI based on auth state
function updateGameUI() {
    const authRequired = document.getElementById('authRequired');
    const claimSection = document.getElementById('claimSection');
    
    if (currentUser) {
        if (authRequired) authRequired.style.display = 'none';
        if (claimSection) claimSection.style.display = 'block';
        loadUserPoints();
    } else {
        if (authRequired) authRequired.style.display = 'block';
        if (claimSection) claimSection.style.display = 'none';
    }
}

// Show AdCash video ad before unlocking game
function showAdCashVideoAd() {
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
        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; max-width: 90%; max-height: 90%;">
            <h3>🎬 شاهد الإعلان لفتح اللعبة</h3>
            <p>سيتم فتح اللعبة تلقائياً بعد مشاهدة الإعلان</p>
            <div id="adcash-ad-container" style="margin: 20px 0; width: 100%; height: 400px; background: #f0f0f0; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;">
                <div id="ad-loading" style="text-align: center;">
                    <p>جاري تحميل الإعلان...</p>
                    <div style="width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
            <button id="close-ad-btn" class="btn btn-primary" onclick="simulateAdComplete()" style="margin-top: 10px;">تخطي الإعلان (للاختبار)</button>
        </div>
    `;
    
    document.body.appendChild(adContainer);
    
    // Load real AdCash ad
    loadRealAdCashAd();
}

// Load real AdCash ad
function loadRealAdCashAd() {
    const adContainer = document.getElementById('adcash-ad-container');
    
    // Try to load AdCash ad using their script
    try {
        // AdCash zone integration
        if (typeof aclib !== 'undefined') {
            // Use AdCash video ad zone
            aclib.runVideoAd({
                zoneId: 'uvhasp50cf', // Your AdCash zone ID
                onComplete: function() {
                    console.log('AdCash ad completed');
                    unlockGameAfterAd();
                },
                onError: function() {
                    console.log('AdCash ad error');
                    simulateAdComplete();
                }
            });
        } else {
            // Fallback: simulate ad loading
            setTimeout(() => {
                adContainer.innerHTML = `
                    <div style="text-align: center; padding: 50px;">
                        <h4>🎬 إعلان تجريبي</h4>
                        <p>هذا إعلان تجريبي - سيتم استبداله بإعلان حقيقي</p>
                        <div style="background: #000; color: white; padding: 20px; margin: 20px 0;">
                            <p>📺 فيديو إعلاني (5 ثوان)</p>
                            <div id="countdown" style="font-size: 24px; font-weight: bold;">5</div>
                        </div>
                    </div>
                `;
                
                // Countdown timer
                let countdown = 5;
                const timer = setInterval(() => {
                    countdown--;
                    const countdownEl = document.getElementById('countdown');
                    if (countdownEl) {
                        countdownEl.textContent = countdown;
                    }
                    
                    if (countdown <= 0) {
                        clearInterval(timer);
                        unlockGameAfterAd();
                    }
                }, 1000);
            }, 1000);
        }
    } catch (error) {
        console.error('Error loading ad:', error);
        simulateAdComplete();
    }
}

// Simulate ad completion for testing
function simulateAdComplete() {
    console.log('Simulating ad completion');
    unlockGameAfterAd();
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
    if (!currentUser || !currentGame) return;
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            console.error('User document not found');
            return;
        }
        
        const userData = userDoc.data();
        
        // Check if user is blocked
        if (userData.blocked) {
            showMessage('حسابك محظور', 'error');
            return;
        }
        
        // Check daily limit
        const today = new Date().toDateString();
        const lastClaimDate = userData.lastClaimAt ? userData.lastClaimAt.toDate().toDateString() : '';
        
        let dailyPoints = userData.dailyPoints || 0;
        if (lastClaimDate !== today) {
            dailyPoints = 0;
        }
        
        if (dailyPoints >= APP_CONFIG.DAILY_LIMIT) {
            showMessage('لقد وصلت للحد الأقصى اليومي من النقاط', 'warning');
            return;
        }
        
        // Use batch for atomic operations
        const batch = db.batch();
        
        // Update user points
        batch.update(userRef, {
            points: firebase.firestore.FieldValue.increment(APP_CONFIG.POINTS_PER_CLAIM),
            dailyPoints: lastClaimDate === today ? 
                firebase.firestore.FieldValue.increment(APP_CONFIG.POINTS_PER_CLAIM) : 
                APP_CONFIG.POINTS_PER_CLAIM,
            lastClaimAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add transaction log
        const transactionRef = db.collection('transactions').doc();
        batch.set(transactionRef, {
            uid: currentUser.uid,
            type: 'game_play',
            pointsDelta: APP_CONFIG.POINTS_PER_CLAIM,
            gameId: currentGame.id,
            gameTitle: currentGame.title,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Commit batch
        await batch.commit();
        
        // Update UI
        loadUserPoints();
        showMessage(`+${APP_CONFIG.POINTS_PER_CLAIM} نقطة!`, 'success');
        
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
window.simulateAdComplete = simulateAdComplete;