/**
 * مدير النقاط المحسن - Rabhne Games
 * نظام إدارة النقاط الآمن مع حماية من التلاعب
 */

class PointsManager {
    constructor() {
        this.cooldownTimers = new Map();
        this.dailyLimits = new Map();
        this.transactionQueue = [];
        this.isProcessing = false;
        this.init();
    }

    init() {
        this.startCleanupInterval();
        this.processTransactionQueue();
    }

    // كسب النقاط مع فحص الأمان
    async earnPoints(gameSlug, pointsAmount = APP_CONFIG.POINTS.PER_CLAIM) {
        try {
            // التحقق من تسجيل الدخول
            if (!authManager.currentUser) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            const userId = authManager.currentUser.uid;
            
            // فحص الأمان الأساسي
            await this.validateEarnRequest(userId, pointsAmount);
            
            // فحص معدل الطلبات
            if (!securityManager.checkRateLimit(`earn_${userId}`, 10)) {
                throw new Error('تم تجاوز الحد الأقصى للطلبات');
            }

            // تنفيذ العملية
            const result = await this.processEarnPoints(userId, gameSlug, pointsAmount);
            
            // تحديث واجهة المستخدم
            await this.updateUI(userId);
            
            return result;

        } catch (error) {
            console.error('Error earning points:', error);
            uiManager.showToast(error.message, 'error');
            throw error;
        }
    }

    // التحقق من صحة طلب كسب النقاط
    async validateEarnRequest(userId, pointsAmount) {
        // فحص صحة المدخلات
        if (!userId || typeof userId !== 'string') {
            throw new Error('معرف المستخدم غير صحيح');
        }

        if (!Number.isInteger(pointsAmount) || pointsAmount <= 0 || pointsAmount > APP_CONFIG.POINTS.MAX_PER_UPDATE) {
            throw new Error('كمية النقاط غير صحيحة');
        }

        // الحصول على بيانات المستخدم
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('المستخدم غير موجود');
        }

        const userData = userDoc.data();
        
        // فحص حالة الحظر
        if (userData.blocked) {
            throw new Error('حسابك محظور');
        }

        // فحص فترة الانتظار
        await this.checkCooldown(userId, userData);
        
        // فحص الحد اليومي
        await this.checkDailyLimit(userId, userData, pointsAmount);
    }

    // فحص فترة الانتظار
    async checkCooldown(userId, userData) {
        const now = new Date();
        const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate() : null;

        if (lastClaim) {
            const timeDiff = (now - lastClaim) / 1000; // بالثواني
            const remaining = APP_CONFIG.POINTS.COOLDOWN_SECONDS - timeDiff;

            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60);
                const seconds = Math.floor(remaining % 60);
                throw new Error(`انتظر ${minutes}:${seconds.toString().padStart(2, '0')} قبل المحاولة مرة أخرى`);
            }
        }
    }

    // فحص الحد اليومي
    async checkDailyLimit(userId, userData, pointsAmount) {
        const today = new Date().toDateString();
        const lastClaimDate = userData.lastClaimAt ? userData.lastClaimAt.toDate().toDateString() : null;
        
        let dailyPoints = userData.dailyPoints || 0;
        
        // إعادة تعيين النقاط اليومية إذا كان يوم جديد
        if (lastClaimDate !== today) {
            dailyPoints = 0;
        }

        if (dailyPoints + pointsAmount > APP_CONFIG.POINTS.DAILY_LIMIT) {
            const remaining = APP_CONFIG.POINTS.DAILY_LIMIT - dailyPoints;
            throw new Error(`وصلت للحد الأقصى اليومي. يمكنك كسب ${remaining} نقطة إضافية اليوم`);
        }
    }

    // معالجة كسب النقاط
    async processEarnPoints(userId, gameSlug, pointsAmount) {
        const batch = db.batch();
        const userRef = db.collection('users').doc(userId);
        
        try {
            // الحصول على البيانات الحالية
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            
            // حساب النقاط الجديدة
            const newPoints = (userData.points || 0) + pointsAmount;
            const today = new Date().toDateString();
            const lastClaimDate = userData.lastClaimAt ? userData.lastClaimAt.toDate().toDateString() : null;
            
            let newDailyPoints = userData.dailyPoints || 0;
            if (lastClaimDate !== today) {
                newDailyPoints = 0;
            }
            newDailyPoints += pointsAmount;

            // تحديث بيانات المستخدم
            batch.update(userRef, {
                points: newPoints,
                dailyPoints: newDailyPoints,
                totalEarned: firebase.firestore.FieldValue.increment(pointsAmount),
                lastClaimAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActivity: firebase.firestore.FieldValue.serverTimestamp()
            });

            // إضافة سجل المعاملة
            const transactionRef = db.collection('transactions').doc();
            batch.set(transactionRef, {
                userId: userId,
                type: 'earn',
                pointsDelta: pointsAmount,
                gameSlug: gameSlug,
                note: `لعب ${gameSlug}`,
                balanceAfter: newPoints,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                ip: await this.getUserIP(),
                userAgent: navigator.userAgent
            });

            // تنفيذ العملية
            await batch.commit();

            // تسجيل النشاط
            await this.logPointsActivity(userId, 'points_earned', {
                gameSlug,
                pointsAmount,
                newBalance: newPoints
            });

            uiManager.showToast(`تم إضافة ${pointsAmount} نقطة!`, 'success');
            
            return {
                success: true,
                pointsEarned: pointsAmount,
                newBalance: newPoints,
                dailyPoints: newDailyPoints
            };

        } catch (error) {
            console.error('Error processing earn points:', error);
            throw new Error('حدث خطأ أثناء إضافة النقاط');
        }
    }

    // سحب النقاط
    async withdrawPoints(pointsAmount, method, account) {
        try {
            if (!authManager.currentUser) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            const userId = authManager.currentUser.uid;
            
            // التحقق من صحة البيانات
            await this.validateWithdrawRequest(userId, pointsAmount, method, account);
            
            // معالجة طلب السحب
            const result = await this.processWithdrawRequest(userId, pointsAmount, method, account);
            
            return result;

        } catch (error) {
            console.error('Error withdrawing points:', error);
            uiManager.showToast(error.message, 'error');
            throw error;
        }
    }

    // التحقق من صحة طلب السحب
    async validateWithdrawRequest(userId, pointsAmount, method, account) {
        // فحص صحة المدخلات
        const pointsValidation = securityManager.validateInput(pointsAmount, 'number', {
            min: APP_CONFIG.POINTS.MIN_WITHDRAW,
            max: 1000000
        });
        
        if (!pointsValidation.valid) {
            throw new Error(pointsValidation.error);
        }

        const accountValidation = securityManager.validateInput(account, 'string', {
            minLength: 5,
            maxLength: 100
        });
        
        if (!accountValidation.valid) {
            throw new Error('معلومات الحساب غير صحيحة');
        }

        if (!APP_CONFIG.WITHDRAW_METHODS.includes(method)) {
            throw new Error('طريقة السحب غير مدعومة');
        }

        // فحص رصيد المستخدم
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData) {
            throw new Error('بيانات المستخدم غير موجودة');
        }

        if (userData.blocked) {
            throw new Error('حسابك محظور');
        }

        if ((userData.points || 0) < pointsAmount) {
            throw new Error('ليس لديك نقاط كافية');
        }

        // فحص الطلبات المعلقة
        const pendingWithdraws = await db.collection('withdraw_requests')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .get();

        if (!pendingWithdraws.empty) {
            throw new Error('لديك طلب سحب معلق بالفعل');
        }
    }

    // معالجة طلب السحب
    async processWithdrawRequest(userId, pointsAmount, method, account) {
        try {
            // حساب المبلغ النقدي
            const amountCash = (pointsAmount / APP_CONFIG.POINTS.TO_DOLLAR_RATE) * 0.1;
            
            // إنشاء طلب السحب
            const withdrawRef = await db.collection('withdraw_requests').add({
                userId: userId,
                amountPoints: pointsAmount,
                amountCash: amountCash,
                method: method,
                account: securityManager.validateInput(account, 'string').sanitized,
                status: 'pending',
                adminNote: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                ip: await this.getUserIP(),
                userAgent: navigator.userAgent
            });

            // تسجيل النشاط
            await this.logPointsActivity(userId, 'withdraw_requested', {
                withdrawId: withdrawRef.id,
                pointsAmount,
                amountCash,
                method
            });

            uiManager.showToast('تم إرسال طلب السحب بنجاح!', 'success');
            
            return {
                success: true,
                withdrawId: withdrawRef.id,
                pointsAmount,
                amountCash
            };

        } catch (error) {
            console.error('Error processing withdraw request:', error);
            throw new Error('حدث خطأ أثناء إرسال طلب السحب');
        }
    }

    // تحديث واجهة المستخدم
    async updateUI(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();

            if (!userData) return;

            // تحديث عداد النقاط في الشريط العلوي
            const userPointsNav = document.getElementById('userPointsNav');
            if (userPointsNav) {
                uiManager.updatePointsCounter(userPointsNav, userData.points || 0);
            }

            // تحديث عداد النقاط في الجوال
            const mobileUserPoints = document.getElementById('mobileUserPoints');
            if (mobileUserPoints) {
                mobileUserPoints.textContent = `${(userData.points || 0).toLocaleString()} نقطة`;
            }

            // تحديث لوحة التحكم إذا كانت مفتوحة
            const userPoints = document.getElementById('userPoints');
            if (userPoints) {
                uiManager.updatePointsCounter(userPoints, userData.points || 0);
            }

            const dailyPoints = document.getElementById('dailyPoints');
            if (dailyPoints) {
                const today = new Date().toDateString();
                const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate().toDateString() : null;
                const currentDailyPoints = (lastClaim === today) ? (userData.dailyPoints || 0) : 0;
                uiManager.updatePointsCounter(dailyPoints, currentDailyPoints);
            }

        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    // تحديث زر المطالبة
    async updateClaimButton(gameSlug) {
        const claimBtn = document.getElementById('claimBtn');
        const cooldownTimer = document.getElementById('cooldownTimer');

        if (!claimBtn || !authManager.currentUser) return;

        try {
            const userDoc = await db.collection('users').doc(authManager.currentUser.uid).get();
            const userData = userDoc.data();

            if (!userData) return;

            const now = new Date();
            const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate() : null;

            // فحص فترة الانتظار
            if (lastClaim) {
                const timeDiff = (now - lastClaim) / 1000; // بالثواني
                const remaining = APP_CONFIG.POINTS.COOLDOWN_SECONDS - timeDiff;

                if (remaining > 0) {
                    claimBtn.disabled = true;
                    claimBtn.textContent = 'انتظر...';

                    if (cooldownTimer) {
                        const minutes = Math.floor(remaining / 60);
                        const seconds = Math.floor(remaining % 60);
                        cooldownTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }

                    // تحديث كل ثانية
                    setTimeout(() => this.updateClaimButton(gameSlug), 1000);
                    return;
                }
            }

            // فحص الحد اليومي
            const today = new Date().toDateString();
            const lastClaimDate = lastClaim ? lastClaim.toDateString() : null;
            let dailyPoints = userData.dailyPoints || 0;

            if (lastClaimDate !== today) {
                dailyPoints = 0;
            }

            if (dailyPoints >= APP_CONFIG.POINTS.DAILY_LIMIT) {
                claimBtn.disabled = true;
                claimBtn.textContent = 'وصلت للحد الأقصى اليومي';
                if (cooldownTimer) cooldownTimer.textContent = '';
            } else {
                claimBtn.disabled = false;
                claimBtn.textContent = `احصل على ${APP_CONFIG.POINTS.PER_CLAIM} نقاط`;
                if (cooldownTimer) cooldownTimer.textContent = '';
                
                // إضافة مستمع الحدث
                claimBtn.onclick = () => this.earnPoints(gameSlug);
            }

        } catch (error) {
            console.error('Error updating claim button:', error);
        }
    }

    // تسجيل نشاط النقاط
    async logPointsActivity(userId, action, data = {}) {
        try {
            await db.collection('points_activities').add({
                userId,
                action,
                data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ip: await this.getUserIP(),
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error('Error logging points activity:', error);
        }
    }

    // الحصول على IP المستخدم
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // تنظيف البيانات المؤقتة
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupCooldownTimers();
            this.cleanupDailyLimits();
        }, 300000); // كل 5 دقائق
    }

    cleanupCooldownTimers() {
        const now = Date.now();
        for (const [userId, timer] of this.cooldownTimers.entries()) {
            if (now - timer.timestamp > APP_CONFIG.POINTS.COOLDOWN_SECONDS * 1000) {
                this.cooldownTimers.delete(userId);
            }
        }
    }

    cleanupDailyLimits() {
        const today = new Date().toDateString();
        for (const [userId, limit] of this.dailyLimits.entries()) {
            if (limit.date !== today) {
                this.dailyLimits.delete(userId);
            }
        }
    }

    // معالجة قائمة انتظار المعاملات
    processTransactionQueue() {
        setInterval(async () => {
            if (this.isProcessing || this.transactionQueue.length === 0) return;
            
            this.isProcessing = true;
            
            try {
                const transaction = this.transactionQueue.shift();
                await this.executeTransaction(transaction);
            } catch (error) {
                console.error('Error processing transaction queue:', error);
            } finally {
                this.isProcessing = false;
            }
        }, 1000);
    }

    // تنفيذ معاملة
    async executeTransaction(transaction) {
        // تنفيذ المعاملة حسب النوع
        switch (transaction.type) {
            case 'earn':
                await this.processEarnPoints(
                    transaction.userId,
                    transaction.gameSlug,
                    transaction.pointsAmount
                );
                break;
            case 'withdraw':
                await this.processWithdrawRequest(
                    transaction.userId,
                    transaction.pointsAmount,
                    transaction.method,
                    transaction.account
                );
                break;
        }
    }

    // إحصائيات النقاط
    async getPointsStats(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();

            if (!userData) return null;

            // حساب الإحصائيات
            const today = new Date().toDateString();
            const lastClaimDate = userData.lastClaimAt ? userData.lastClaimAt.toDate().toDateString() : null;
            const dailyPoints = (lastClaimDate === today) ? (userData.dailyPoints || 0) : 0;

            return {
                totalPoints: userData.points || 0,
                dailyPoints: dailyPoints,
                totalEarned: userData.totalEarned || 0,
                totalWithdrawn: userData.totalWithdrawn || 0,
                dailyLimit: APP_CONFIG.POINTS.DAILY_LIMIT,
                remainingDaily: Math.max(0, APP_CONFIG.POINTS.DAILY_LIMIT - dailyPoints)
            };

        } catch (error) {
            console.error('Error getting points stats:', error);
            return null;
        }
    }
}

// إنشاء مثيل مدير النقاط
const pointsManager = new PointsManager();

// تصدير المدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PointsManager;
} else {
    window.PointsManager = PointsManager;
    window.pointsManager = pointsManager;
}