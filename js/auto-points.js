// Auto Points System - نقطة كل 30 ثانية

let gameTimer = null;
let isGameActive = false;
let pointsEarned = 0;

// بدء اللعب التلقائي
window.startAutoPoints = function () {
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }

    if (isGameActive) {
        showMessage('اللعب نشط بالفعل!', 'info');
        return;
    }

    isGameActive = true;
    pointsEarned = 0;

    // تحديث واجهة المستخدم
    updateGameUI();

    // Clear any existing timer to prevent multiple timers
    if (gameTimer) {
        clearInterval(gameTimer);
    }

    // بدء العداد - نقطة كل 30 ثانية
    gameTimer = setInterval(async () => {
        await giveAutoPoint();
    }, APP_CONFIG.COOLDOWN_SECONDS * 1000);

    showMessage('🎮 بدأ اللعب! ستحصل على نقطة كل 30 ثانية', 'success');
}

// إيقاف اللعب
window.stopAutoPoints = function () {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    isGameActive = false;
    updateGameUI();

    showMessage(`🏁 انتهى اللعب! حصلت على ${pointsEarned} نقطة`, 'success');
}

// تحميل إحصائيات اللعبة الأولية
window.loadGameStats = async function () {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        if (userData) {
            updatePointsDisplay(userData.points || 0, userData.dailyPoints || 0);
        }
    } catch (error) {
        console.error('Error loading game stats:', error);
    }
}

// إعطاء نقطة تلقائية
async function giveAutoPoint() {
    if (!currentUser || !isGameActive) {
        stopAutoPoints();
        return;
    }

    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (userData.blocked) {
            showMessage('حسابك محظور', 'error');
            stopAutoPoints();
            return;
        }

        // تحقق من الحد اليومي
        const today = new Date().toDateString();
        const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate() : null;
        const lastClaimDate = lastClaim ? lastClaim.toDateString() : null;
        let dailyPoints = userData.dailyPoints || 0;

        if (lastClaimDate !== today) {
            dailyPoints = 0; // إعادة تعيين النقاط اليومية
        }

        if (dailyPoints >= APP_CONFIG.DAILY_LIMIT) {
            showMessage('وصلت للحد الأقصى اليومي من النقاط', 'error');
            stopAutoPoints();
            return;
        }

        // إضافة النقطة
        const newPoints = userData.points + APP_CONFIG.POINTS_PER_CLAIM;
        const newDailyPoints = dailyPoints + APP_CONFIG.POINTS_PER_CLAIM;

        await userRef.update({
            points: firebase.firestore.FieldValue.increment(APP_CONFIG.POINTS_PER_CLAIM),
            dailyPoints: firebase.firestore.FieldValue.increment(APP_CONFIG.POINTS_PER_CLAIM),
            lastClaimAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // إضافة سجل المعاملة
        await db.collection('transactions').add({
            uid: currentUser.uid,
            type: 'earn',
            pointsDelta: APP_CONFIG.POINTS_PER_CLAIM,
            note: 'لعب تلقائي',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        pointsEarned++;

        // تحديث العرض
        updatePointsDisplay(newPoints, newDailyPoints);

        // تحديث عداد النقاط في الشريط العلوي
        if (window.loadUserPoints) {
            loadUserPoints();
        }

        // إشعار بصري
        showPointNotification();

    } catch (error) {
        console.error('Error giving auto point:', error);
        showMessage('حدث خطأ أثناء إضافة النقاط', 'error');
    }
}

// تحديث واجهة اللعبة
function updateGameUI() {
    const startBtn = document.getElementById('startGameBtn');
    const stopBtn = document.getElementById('stopGameBtn');
    const gameStatus = document.getElementById('gameStatus');
    const gameFrame = document.getElementById('gameFrame');
    const gameStartMessage = document.getElementById('gameStartMessage');

    if (startBtn && stopBtn && gameStatus) {
        if (isGameActive) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            gameStatus.textContent = `🎮 اللعب نشط - حصلت على ${pointsEarned} نقطة`;
            gameStatus.className = 'game-status active';

            // إظهار اللعبة وإخفاء الرسالة
            if (gameFrame) gameFrame.style.display = 'block';
            if (gameStartMessage) gameStartMessage.style.display = 'none';
        } else {
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            gameStatus.textContent = '⏸️ اللعب متوقف - اضغط "ابدأ اللعب" للمتابعة';
            gameStatus.className = 'game-status inactive';

            // إخفاء اللعبة وإظهار الرسالة
            if (gameFrame) gameFrame.style.display = 'none';
            if (gameStartMessage) gameStartMessage.style.display = 'block';
        }
    }
}

// تحديث عرض النقاط
function updatePointsDisplay(totalPoints, dailyPoints) {
    const totalEl = document.getElementById('totalPoints');
    const dailyEl = document.getElementById('dailyPointsEarned');

    if (totalEl) totalEl.textContent = totalPoints.toLocaleString();
    if (dailyEl) dailyEl.textContent = dailyPoints.toLocaleString();
}

// إشعار بصري للنقطة
function showPointNotification() {
    const notification = document.createElement('div');
    notification.className = 'point-notification';
    notification.textContent = '+1 نقطة! 🎯';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #4CAF50, #45a049);
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.5s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// إيقاف اللعب عند مغادرة الصفحة
window.addEventListener('beforeunload', () => {
    if (isGameActive) {
        stopAutoPoints();
    }
});

// إضافة مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function () {
    const startBtn = document.getElementById('startGameBtn');
    const stopBtn = document.getElementById('stopGameBtn');

    if (startBtn) {
        startBtn.addEventListener('click', startAutoPoints);
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', stopAutoPoints);
    }

    // تحديث الواجهة الأولية
    updateGameUI();
});

// CSS للإشعارات
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

.game-status {
    padding: 10px;
    border-radius: 5px;
    margin: 10px 0;
    font-weight: bold;
}

.game-status.active {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.game-status.inactive {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.game-start-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 600px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
    border-radius: 10px;
}

.game-info-box {
    background: rgba(255,255,255,0.1);
    padding: 20px;
    border-radius: 10px;
    margin-top: 20px;
}

.game-info-box p {
    margin: 10px 0;
    font-size: 1.1rem;
}
`;
document.head.appendChild(style);