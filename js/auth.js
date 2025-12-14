// Authentication functions
let currentUser = null;

// Check auth state
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    updateUI();

    if (user) {
        await ensureUserDocument(user);
        checkAdminAccess();
    }
});

async function ensureUserDocument(user) {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        await userRef.set({
            displayName: user.displayName || 'مستخدم جديد',
            email: user.email,
            points: 0,
            dailyPoints: 0,
            lastClaimAt: null,
            isAdmin: false,
            blocked: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

function updateUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const heroAuthButton = document.getElementById('heroAuthButton');

    // Mobile navigation elements
    const mobileAuthButton = document.getElementById('mobileAuthButton');
    const mobileNavDashboard = document.getElementById('mobileNavDashboard');

    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (heroAuthButton) heroAuthButton.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            userMenu.style.alignItems = 'center';
            userMenu.style.gap = '15px';
        }
        if (userName) userName.textContent = currentUser.displayName || currentUser.email;

        // Update mobile navigation
        if (mobileAuthButton) {
            mobileAuthButton.innerHTML = `
                <span class="mobile-nav-icon">👤</span>
                <span class="mobile-nav-text">الملف</span>
            `;
            mobileAuthButton.onclick = () => window.location.href = 'profile.html';
        }
        if (mobileNavDashboard) mobileNavDashboard.style.display = 'flex';

        // تحديث عداد النقاط
        loadUserPoints();
        loadMobileUserPoints();
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (heroAuthButton) heroAuthButton.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';

        // Reset mobile navigation
        if (mobileAuthButton) {
            mobileAuthButton.innerHTML = `
                <span class="mobile-nav-icon">🔑</span>
                <span class="mobile-nav-text">دخول</span>
            `;
            mobileAuthButton.onclick = loginWithGoogle;
        }
        if (mobileNavDashboard) mobileNavDashboard.style.display = 'none';
    }
}

// تحميل نقاط المستخدم
async function loadUserPoints() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        const userPointsNav = document.getElementById('userPointsNav');

        if (userPointsNav && userData) {
            userPointsNav.textContent = (userData.points || 0).toLocaleString();
        }
    } catch (error) {
        console.error('Error loading user points:', error);
    }
}

// تحميل نقاط المستخدم في شريط الجوال
async function loadMobileUserPoints() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        const mobileUserPoints = document.getElementById('mobileUserPoints');

        if (mobileUserPoints && userData) {
            mobileUserPoints.textContent = `${(userData.points || 0).toLocaleString()} نقطة`;
        }
    } catch (error) {
        console.error('Error loading mobile user points:', error);
    }
}

async function checkAdminAccess() {
    if (!currentUser) return;

    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();

    if (userData && userData.isAdmin) {
        // Show admin menu if exists
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'block';
    }
}

// Google Login function
async function loginWithGoogle() {
    try {
        // إظهار رسالة تحميل
        showMessage('جاري تسجيل الدخول...', 'info');

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        // إعدادات إضافية للمزود
        provider.setCustomParameters({
            'prompt': 'select_account'
        });

        const result = await auth.signInWithPopup(provider);

        if (result.user) {
            showMessage(`مرحباً بك ${result.user.displayName || 'مستخدم'}! تم تسجيل الدخول بنجاح`, 'success');
        }

        return true;
    } catch (error) {
        console.error('Login error:', error);

        // عدم إظهار رسالة إذا أغلق المستخدم النافذة
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            showMessage(getErrorMessage(error.code), 'error');
        }

        return false;
    }
}

// Logout function
async function logout() {
    try {
        await auth.signOut();
        showMessage('تم تسجيل الخروج بنجاح!', 'success');
        window.location.href = '/';
    } catch (error) {
        showMessage('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// Error messages in Arabic
function getErrorMessage(errorCode) {
    const messages = {
        'auth/popup-blocked': 'تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة وإعادة المحاولة',
        'auth/cancelled-popup-request': 'تم إلغاء عملية تسجيل الدخول',
        'auth/popup-closed-by-user': 'تم إغلاق نافذة تسجيل الدخول',
        'auth/account-exists-with-different-credential': 'يوجد حساب بنفس البريد الإلكتروني بطريقة دخول مختلفة',
        'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت. تأكد من اتصالك وحاول مرة أخرى',
        'auth/too-many-requests': 'محاولات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى',
        'auth/operation-not-allowed': 'تسجيل الدخول بجوجل غير مفعل. يرجى التواصل مع الإدارة',
        'auth/invalid-api-key': 'خطأ في إعدادات التطبيق. يرجى التواصل مع الإدارة',
        'auth/app-deleted': 'التطبيق غير متاح حالياً. يرجى المحاولة لاحقاً',
        'auth/user-disabled': 'تم تعطيل حسابك. يرجى التواصل مع الإدارة'
    };

    return messages[errorCode] || 'حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى';
}





// Auth guard for protected pages
function requireAuth() {
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        window.location.href = '/';
        return false;
    }
    return true;
}

// Admin guard
async function requireAdmin() {
    if (!currentUser) {
        window.location.href = '/';
        return false;
    }

    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();

    if (!userData || !userData.isAdmin) {
        showMessage('ليس لديك صلاحية للوصول لهذه الصفحة', 'error');
        window.location.href = '/';
        return false;
    }

    return true;
}