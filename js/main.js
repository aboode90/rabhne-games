// توافق مع النظام الجديد

// تحميل إحصائيات الصفحة الرئيسية
async function loadStats() {
    try {
        if (window.appCore && window.appCore.getAppStats) {
            const stats = await window.appCore.getAppStats();
            updateStatsDisplay(stats);
        } else {
            // الطريقة القديمة كبديل
            const [usersSnapshot, gamesSnapshot, withdrawalsSnapshot] = await Promise.all([
                db.collection('users').get(),
                db.collection('games').where('isActive', '==', true).get(),
                db.collection('withdraw_requests').where('status', '==', 'approved').get()
            ]);
            
            const stats = {
                totalUsers: usersSnapshot.size,
                totalGames: gamesSnapshot.size,
                totalPayouts: withdrawalsSnapshot.size
            };
            
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// تحديث عرض الإحصائيات
function updateStatsDisplay(stats) {
    const elements = {
        totalUsers: document.getElementById('totalUsers'),
        totalGames: document.getElementById('totalGames'),
        totalPayouts: document.getElementById('totalPayouts'),
        statPlayers: document.getElementById('statPlayers'),
        statPaid: document.getElementById('statPaid'),
        statGames: document.getElementById('statGames')
    };

    if (elements.totalUsers) elements.totalUsers.textContent = stats.totalUsers;
    if (elements.totalGames) elements.totalGames.textContent = stats.totalGames;
    if (elements.totalPayouts) elements.totalPayouts.textContent = stats.totalPayouts;
    if (elements.statPlayers) elements.statPlayers.textContent = `+${stats.totalUsers || 500}`;
    if (elements.statPaid) elements.statPaid.textContent = `$${(stats.totalPayouts || 125) * 10}`;
    if (elements.statGames) elements.statGames.textContent = `${stats.totalGames || 15}+`;
}

// تأثيرات التمرير للأقسام
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // مراقبة العناصر القابلة للتحريك
    const animatedElements = document.querySelectorAll('.feature-card, .step-card, .benefit-card, .section-title');
    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// تحسين تجربة المستخدم
function enhanceUserExperience() {
    // إضافة تأثيرات hover للبطاقات
    const cards = document.querySelectorAll('.feature-card, .step-card, .benefit-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // تحسين الأزرار
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // تأثير الضغط
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        });
    });
}

// نظام النقاط المحسن
async function claimPoints(gameSlug) {
    if (window.pointsManager) {
        return await window.pointsManager.earnPoints(gameSlug);
    } else {
        // الطريقة القديمة
        if (!currentUser) {
            showMessage('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (userData.blocked) {
            showMessage('حسابك محظور', 'error');
            return;
        }

        // Check cooldown
        const now = new Date();
        const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate() : null;

        if (lastClaim) {
            const timeDiff = (now - lastClaim) / (1000 * 60); // minutes
            if (timeDiff < APP_CONFIG.COOLDOWN_MINUTES) {
                const remaining = Math.ceil(APP_CONFIG.COOLDOWN_MINUTES - timeDiff);
                showMessage(`انتظر ${remaining} دقيقة قبل المحاولة مرة أخرى`, 'error');
                return;
            }
        }

        // Check daily limit
        const today = new Date().toDateString();
        const lastClaimDate = lastClaim ? lastClaim.toDateString() : null;
        let dailyPoints = userData.dailyPoints || 0;

        if (lastClaimDate !== today) {
            dailyPoints = 0; // Reset daily points
        }

        if (dailyPoints >= APP_CONFIG.DAILY_LIMIT) {
            showMessage('وصلت للحد الأقصى اليومي من النقاط', 'error');
            return;
        }

        // Award points
        const newPoints = userData.points + APP_CONFIG.POINTS_PER_CLAIM;
        const newDailyPoints = dailyPoints + APP_CONFIG.POINTS_PER_CLAIM;

        await userRef.update({
            points: firebase.firestore.FieldValue.increment(APP_CONFIG.POINTS_PER_CLAIM),
            dailyPoints: firebase.firestore.FieldValue.increment(APP_CONFIG.POINTS_PER_CLAIM),
            lastClaimAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Add transaction record
        await db.collection('transactions').add({
            uid: currentUser.uid,
            type: 'earn',
            pointsDelta: APP_CONFIG.POINTS_PER_CLAIM,
            note: `لعب ${gameSlug}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage(`تم إضافة ${APP_CONFIG.POINTS_PER_CLAIM} نقطة!`, 'success');
        updateClaimButton();

    } catch (error) {
        console.error('Error claiming points:', error);
        showMessage('حدث خطأ أثناء إضافة النقاط', 'error');
    }
}

// تحديث زر المطالبة
async function updateClaimButton(gameSlug) {
    if (window.pointsManager) {
        return await window.pointsManager.updateClaimButton(gameSlug);
    } else {
        // الطريقة القديمة
        const claimBtn = document.getElementById('claimBtn');
        const cooldownTimer = document.getElementById('cooldownTimer');

        if (!claimBtn || !currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        const now = new Date();
        const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate() : null;

        if (lastClaim) {
            const timeDiff = (now - lastClaim) / (1000 * 60); // minutes
            const remaining = APP_CONFIG.COOLDOWN_MINUTES - timeDiff;

            if (remaining > 0) {
                claimBtn.disabled = true;
                claimBtn.textContent = 'انتظر...';

                if (cooldownTimer) {
                    const minutes = Math.floor(remaining);
                    const seconds = Math.floor((remaining - minutes) * 60);
                    cooldownTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }

                setTimeout(updateClaimButton, 1000);
                return;
            }
        }

        // Check daily limit
        const today = new Date().toDateString();
        const lastClaimDate = lastClaim ? lastClaim.toDateString() : null;
        let dailyPoints = userData.dailyPoints || 0;

        if (lastClaimDate !== today) {
            dailyPoints = 0;
        }

        if (dailyPoints >= APP_CONFIG.DAILY_LIMIT) {
            claimBtn.disabled = true;
            claimBtn.textContent = 'وصلت للحد الأقصى اليومي';
            if (cooldownTimer) cooldownTimer.textContent = '';
        } else {
            claimBtn.disabled = false;
            claimBtn.textContent = `احصل على ${APP_CONFIG.POINTS_PER_CLAIM} نقاط`;
            if (cooldownTimer) cooldownTimer.textContent = '';
        }

    } catch (error) {
        console.error('Error updating claim button:', error);
    }
}

// Withdraw functions
async function submitWithdraw(points, method, account) {
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return false;
    }

    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (userData.blocked) {
            showMessage('حسابك محظور', 'error');
            return false;
        }

        if (userData.points < points) {
            showMessage('ليس لديك نقاط كافية', 'error');
            return false;
        }

        if (points < APP_CONFIG.MIN_WITHDRAW) {
            showMessage(`الحد الأدنى للسحب ${APP_CONFIG.MIN_WITHDRAW} نقطة`, 'error');
            return false;
        }

        // Check for pending withdrawals
        const pendingWithdraws = await db.collection('withdraw_requests')
            .where('uid', '==', currentUser.uid)
            .where('status', '==', 'pending')
            .get();

        if (!pendingWithdraws.empty) {
            showMessage('لديك طلب سحب معلق بالفعل', 'error');
            return false;
        }

        // Calculate cash amount
        const amountCash = (points / APP_CONFIG.POINTS_TO_DOLLAR) * 0.1;

        // Create withdraw request
        await db.collection('withdraw_requests').add({
            uid: currentUser.uid,
            amountPoints: points,
            amountCash: amountCash,
            method: method,
            account: account,
            status: 'pending',
            adminNote: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('تم إرسال طلب السحب بنجاح!', 'success');
        return true;

    } catch (error) {
        console.error('Error submitting withdraw:', error);
        showMessage('حدث خطأ أثناء إرسال الطلب', 'error');
        return false;
    }
}

// Load user dashboard data
async function loadDashboardData() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        // Update user info
        const userNameEl = document.getElementById('dashboardUserName');
        const userPointsEl = document.getElementById('userPoints');
        const dailyPointsEl = document.getElementById('dailyPoints');

        if (userNameEl) userNameEl.textContent = userData.displayName;
        if (userPointsEl) userPointsEl.textContent = userData.points || 0;

        // Calculate daily points
        const today = new Date().toDateString();
        const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate() : null;
        const lastClaimDate = lastClaim ? lastClaim.toDateString() : null;
        const dailyPoints = (lastClaimDate === today) ? (userData.dailyPoints || 0) : 0;

        if (dailyPointsEl) dailyPointsEl.textContent = dailyPoints;

        // Load recent transactions
        loadRecentTransactions();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load recent transactions
async function loadRecentTransactions() {
    if (!currentUser) return;

    try {
        const transactionsSnapshot = await db.collection('transactions')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        const transactionsList = document.getElementById('recentTransactions');
        if (!transactionsList) return;

        transactionsList.innerHTML = '';

        if (transactionsSnapshot.empty) {
            transactionsList.innerHTML = '<p>لا توجد عمليات حديثة</p>';
            return;
        }

        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            const div = document.createElement('div');
            div.className = 'transaction-item';

            const sign = transaction.pointsDelta > 0 ? '+' : '';
            const color = transaction.pointsDelta > 0 ? 'green' : 'red';

            div.innerHTML = `
                <span>${transaction.note}</span>
                <span style="color: ${color}">${sign}${transaction.pointsDelta} نقطة</span>
                <small>${formatTime(transaction.createdAt)}</small>
            `;

            transactionsList.appendChild(div);
        });

    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Initialize page based on current location
document.addEventListener('DOMContentLoaded', function () {
    const path = window.location.pathname;

    if (path === '/' || path === '/index.html') {
        loadStats();
        // تهيئة التأثيرات للصفحة الرئيسية
        setTimeout(() => {
            initScrollAnimations();
            enhanceUserExperience();
        }, 500);
    } else if (path === '/dashboard.html') {
        setTimeout(() => {
            if (requireAuth()) {
                loadDashboardData();
            }
        }, 1000);
    } else if (path.startsWith('/game/')) {
        setTimeout(() => {
            if (requireAuth()) {
                updateClaimButton();
                // Clear any existing interval to prevent multiple intervals
                if (window.claimButtonInterval) {
                    clearInterval(window.claimButtonInterval);
                }
                // Store the interval ID so we can clear it later
                window.claimButtonInterval = setInterval(updateClaimButton, 1000);
            }
        }, 1000);
    }

    // Set active mobile nav item
    setActiveMobileNav();
});

function setActiveMobileNav() {
    const path = window.location.pathname;
    const navItems = document.querySelectorAll('.mobile-nav-item');

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        // Handle root path matches index.html
        if (path === '/' && href === 'index.html' ||
            path === '/index.html' && href === 'index.html' ||
            path.endsWith(href)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Utility function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}