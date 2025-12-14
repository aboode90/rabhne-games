// Simple Game System
let gameActive = false;
let gameTimer = null;
let pointsCount = 0;
let timeCounter = 0;
let timeTimer = null;
let lastActivity = Date.now();
let activityTimer = null;
let isPlayerActive = false;

function startGame() {
    console.log('Start game clicked!');
    
    if (!currentUser) {
        alert('يجب تسجيل الدخول أولاً');
        return;
    }
    
    if (gameActive) {
        alert('اللعب نشط بالفعل!');
        return;
    }
    
    gameActive = true;
    pointsCount = 0;
    timeCounter = 0;
    
    // Clear any existing timers to prevent multiple timers
    if (timeTimer) {
        clearInterval(timeTimer);
    }
    
    // بدء عداد الوقت
    timeTimer = setInterval(updateTimer, 1000);
    
    // Clear any existing activity timer
    if (activityTimer) {
        clearInterval(activityTimer);
    }
    
    // بدء تتبع النشاط
    startActivityTracking();
    
    // إظهار اللعبة
    const gameFrame = document.getElementById('gameFrame');
    const gameMessage = document.getElementById('gameStartMessage');
    const startBtn = document.getElementById('startGameBtn');
    const stopBtn = document.getElementById('stopGameBtn');
    const status = document.getElementById('gameStatus');
    
    if (gameFrame) gameFrame.style.display = 'block';
    if (gameMessage) gameMessage.style.display = 'none';
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';
    if (status) {
        status.textContent = '🎮 اللعب نشط - حصلت على 0 نقطة';
        status.className = 'game-status active';
    }
    
    // Clear any existing game timer
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    // بدء العداد
    gameTimer = setInterval(addPoint, 30000); // 30 ثانية
    
    alert('🎮 بدأ اللعب! ستحصل على نقطة كل 30 ثانية');
}

function stopGame() {
    console.log('Stop game clicked!');
    
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    if (timeTimer) {
        clearInterval(timeTimer);
        timeTimer = null;
    }
    
    if (activityTimer) {
        clearInterval(activityTimer);
        activityTimer = null;
    }
    
    stopActivityTracking();
    
    gameActive = false;
    timeCounter = 0;
    isPlayerActive = false;
    
    // إخفاء اللعبة
    const gameFrame = document.getElementById('gameFrame');
    const gameMessage = document.getElementById('gameStartMessage');
    const startBtn = document.getElementById('startGameBtn');
    const stopBtn = document.getElementById('stopGameBtn');
    const status = document.getElementById('gameStatus');
    
    if (gameFrame) gameFrame.style.display = 'none';
    if (gameMessage) gameMessage.style.display = 'block';
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';
    if (status) {
        status.textContent = '⏸️ اللعب متوقف';
        status.className = 'game-status inactive';
    }
    
    alert(`🏁 انتهى اللعب! حصلت على ${pointsCount} نقطة`);
}

async function addPoint() {
    if (!currentUser || !gameActive) {
        stopGame();
        return;
    }
    
    // تحقق من نشاط اللاعب
    if (!isPlayerActive) {
        showWarning('⚠️ تحذير من الاحتيال: يجب أن تلعب بنشاط للحصول على النقاط!');
        return;
    }
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        
        // إضافة النقطة
        const newPoints = userData.points + 1;
        
        await userRef.update({
            points: newPoints,
            lastClaimAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        pointsCount++;
        
        // تحديث العرض
        const status = document.getElementById('gameStatus');
        if (status) {
            status.textContent = `🎮 اللعب نشط - حصلت على ${pointsCount} نقطة`;
        }
        
        // تحديث عداد النقاط في الشريط
        if (window.loadUserPoints) {
            loadUserPoints();
        }
        if (window.loadMobileUserPoints) {
            loadMobileUserPoints();
        }
        
        // إشعار
        showNotification('+1 نقطة! 🎯');
        
    } catch (error) {
        console.error('Error adding point:', error);
        alert('حدث خطأ أثناء إضافة النقاط');
    }
}

function showNotification(message) {
    // Check if notification already exists to prevent duplicates
    const existingNotification = document.querySelector('.game-point-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'game-point-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        font-weight: bold;
        z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function updateTimer() {
    timeCounter++;
    const minutes = Math.floor(timeCounter / 60);
    const seconds = timeCounter % 60;
    const timerEl = document.getElementById('gameTimer');
    
    if (timerEl) {
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function startActivityTracking() {
    const gameFrame = document.getElementById('gameFrame');
    if (!gameFrame) return;
    
    // Clear any existing activity timer
    if (activityTimer) {
        clearInterval(activityTimer);
    }
    
    // Check player activity every 5 seconds
    activityTimer = setInterval(() => {
        const now = Date.now();
        // If no activity for more than 30 seconds, mark as inactive
        if (now - lastActivity > 30000) {
            isPlayerActive = false;
        } else {
            isPlayerActive = true;
        }
    }, 5000);
    
    // تتبع النقرات والحركة داخل اللعبة (حاسوب وجوال)
    gameFrame.addEventListener('mouseenter', () => {
        lastActivity = Date.now();
        isPlayerActive = true;
    });
    
    gameFrame.addEventListener('mousemove', () => {
        lastActivity = Date.now();
        isPlayerActive = true;
    });
    
    gameFrame.addEventListener('click', () => {
        lastActivity = Date.now();
        isPlayerActive = true;
    });
    
    // For mobile touch events
    gameFrame.addEventListener('touchstart', () => {
        lastActivity = Date.now();
        isPlayerActive = true;
    });
    
    gameFrame.addEventListener('touchmove', () => {
        lastActivity = Date.now();
        isPlayerActive = true;
    });
}

function stopActivityTracking() {
    if (activityTimer) {
        clearInterval(activityTimer);
        activityTimer = null;
    }
    
    isPlayerActive = false;
}

function showWarning(message) {
    // Check if warning already exists to prevent duplicates
    const existingWarning = document.querySelector('.game-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    const warning = document.createElement('div');
    warning.className = 'game-warning';
    warning.textContent = message;
    warning.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: #ff9800;
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        font-weight: bold;
        z-index: 1000;
    `;
    
    document.body.appendChild(warning);
    
    setTimeout(() => {
        if (warning.parentNode) {
            warning.remove();
        }
    }, 5000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    if (timeTimer) {
        clearInterval(timeTimer);
        timeTimer = null;
    }
    
    if (activityTimer) {
        clearInterval(activityTimer);
        activityTimer = null;
    }
});