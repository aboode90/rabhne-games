// نظام الجلسات الآمن - مقاوم للتلاعب
class SecureGameSession {
    constructor() {
        this.sessionId = null;
        this.isActive = false;
        this.heartbeatInterval = null;
        this.pointsEarned = 0;
        this.startTime = null;
        this.gameId = null;
    }

    // بدء جلسة آمنة
    async startSession(gameId) {
        if (!currentUser) {
            showMessage('يجب تسجيل الدخول أولاً', 'error');
            return false;
        }

        if (this.isActive) {
            showMessage('لديك جلسة نشطة بالفعل', 'warning');
            return false;
        }

        try {
            // استدعاء Cloud Function لبدء الجلسة
            const startSession = firebase.functions().httpsCallable('startGameSession');
            const result = await startSession({ gameId });

            this.sessionId = result.data.sessionId;
            this.gameId = gameId;
            this.isActive = true;
            this.startTime = new Date();
            this.pointsEarned = 0;

            // بدء نبضات القلب كل دقيقة
            this.startHeartbeat();
            
            // تحديث الواجهة
            this.updateUI();
            
            showMessage('🎮 بدأت الجلسة! ستحصل على نقطة كل دقيقة', 'success');
            return true;

        } catch (error) {
            console.error('Error starting session:', error);
            showMessage(error.message || 'خطأ في بدء الجلسة', 'error');
            return false;
        }
    }

    // نبضات القلب الآمنة
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(async () => {
            if (!this.isActive || !this.sessionId) {
                this.stopHeartbeat();
                return;
            }

            try {
                const heartbeat = firebase.functions().httpsCallable('sessionHeartbeat');
                const result = await heartbeat({ sessionId: this.sessionId });
                
                this.pointsEarned = result.data.approvedMinutes;
                this.updateUI();

                // إشعار بصري للنقطة الجديدة
                if (result.data.approvedMinutes > 0) {
                    this.showPointNotification();
                }

            } catch (error) {
                console.error('Heartbeat error:', error);
                if (error.code === 'not-found') {
                    this.forceStop();
                }
            }
        }, 60000); // كل دقيقة
    }

    // إيقاف نبضات القلب
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // إنهاء الجلسة وحساب النقاط
    async endSession() {
        if (!this.isActive || !this.sessionId) {
            showMessage('لا توجد جلسة نشطة', 'warning');
            return;
        }

        try {
            this.stopHeartbeat();

            const submitSession = firebase.functions().httpsCallable('submitGameSession');
            const result = await submitSession({ sessionId: this.sessionId });

            const { pointsEarned, newTotal } = result.data;

            this.isActive = false;
            this.sessionId = null;
            this.updateUI();

            showMessage(`🏁 انتهت الجلسة! حصلت على ${pointsEarned} نقطة`, 'success');

            // تحديث عرض النقاط
            if (window.loadUserPoints) {
                window.loadUserPoints();
            }

        } catch (error) {
            console.error('Error ending session:', error);
            showMessage(error.message || 'خطأ في إنهاء الجلسة', 'error');
            this.forceStop();
        }
    }

    // إيقاف قسري للجلسة
    forceStop() {
        this.stopHeartbeat();
        this.isActive = false;
        this.sessionId = null;
        this.pointsEarned = 0;
        this.updateUI();
        showMessage('تم إيقاف الجلسة', 'info');
    }

    // تحديث واجهة المستخدم
    updateUI() {
        const startBtn = document.getElementById('startGameBtn');
        const stopBtn = document.getElementById('stopGameBtn');
        const gameStatus = document.getElementById('gameStatus');
        const gameFrame = document.getElementById('gameFrame');
        const gameStartMessage = document.getElementById('gameStartMessage');

        if (startBtn && stopBtn && gameStatus) {
            if (this.isActive) {
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
                
                const minutes = Math.floor((new Date() - this.startTime) / 60000);
                gameStatus.textContent = `🎮 الجلسة نشطة - ${minutes} دقيقة - ${this.pointsEarned} نقطة`;
                gameStatus.className = 'game-status active';

                if (gameFrame) gameFrame.style.display = 'block';
                if (gameStartMessage) gameStartMessage.style.display = 'none';
            } else {
                startBtn.style.display = 'inline-block';
                stopBtn.style.display = 'none';
                gameStatus.textContent = '⏸️ لا توجد جلسة نشطة';
                gameStatus.className = 'game-status inactive';

                if (gameFrame) gameFrame.style.display = 'none';
                if (gameStartMessage) gameStartMessage.style.display = 'block';
            }
        }
    }

    // إشعار بصري للنقطة
    showPointNotification() {
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

    // الحصول على حالة الجلسة
    getStatus() {
        return {
            isActive: this.isActive,
            sessionId: this.sessionId,
            pointsEarned: this.pointsEarned,
            gameId: this.gameId,
            startTime: this.startTime
        };
    }
}

// إنشاء مثيل عام
const secureGameSession = new SecureGameSession();

// ربط الأحداث
window.startSecureGame = function(gameId = 'default') {
    secureGameSession.startSession(gameId);
};

window.stopSecureGame = function() {
    secureGameSession.endSession();
};

// إيقاف الجلسة عند مغادرة الصفحة
window.addEventListener('beforeunload', () => {
    if (secureGameSession.isActive) {
        secureGameSession.forceStop();
    }
});

// إيقاف الجلسة عند فقدان التركيز لفترة طويلة
let visibilityTimer = null;
document.addEventListener('visibilitychange', () => {
    if (document.hidden && secureGameSession.isActive) {
        visibilityTimer = setTimeout(() => {
            secureGameSession.forceStop();
            showMessage('تم إيقاف الجلسة بسبب عدم النشاط', 'warning');
        }, 300000); // 5 دقائق
    } else if (!document.hidden && visibilityTimer) {
        clearTimeout(visibilityTimer);
        visibilityTimer = null;
    }
});

// تحديث الأزرار عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startGameBtn');
    const stopBtn = document.getElementById('stopGameBtn');

    if (startBtn) {
        startBtn.onclick = () => startSecureGame();
    }

    if (stopBtn) {
        stopBtn.onclick = () => stopSecureGame();
    }

    secureGameSession.updateUI();
});