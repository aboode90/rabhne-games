// Authentication functions
let currentUser = null;
let authInitialized = false;

// Check auth state
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    authInitialized = true;
    updateUI();

    if (user) {
        try {
            await ensureUserDocument(user);
            await checkAdminAccess();
        } catch (error) {
            console.error('Error in auth state change:', error);
        }
    }
});

async function ensureUserDocument(user) {
    if (!user || !user.uid) return;
    
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        // Check if user is the main admin
        const isMainAdmin = user.email === 'abdullaalbder185@gmail.com';

        if (!userDoc.exists) {
            await userRef.set({
                displayName: user.displayName || 'مستخدم جديد',
                email: user.email,
                photoURL: user.photoURL || null,
                points: 0,
                dailyPoints: 0,
                lastClaimAt: null,
                isAdmin: isMainAdmin, // Main admin gets admin rights automatically
                blocked: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Update last login and ensure main admin has admin rights
            const updateData = {
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (isMainAdmin) {
                updateData.isAdmin = true;
            }
            
            await userRef.update(updateData);
        }
    } catch (error) {
        console.error('Error ensuring user document:', error);
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
        // Check if already in progress
        if (auth.currentUser) {
            showMessage('أنت مسجل دخول بالفعل', 'info');
            return true;
        }

        showMessage('جاري تسجيل الدخول...', 'info');

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        const result = await auth.signInWithPopup(provider);
        
        if (result.user) {
            showMessage(`مرحباً بك ${result.user.displayName || 'مستخدم'}!`, 'success');
            return true;
        }
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError(error);
        return false;
    }
}

// Handle authentication errors
function handleAuthError(error) {
    const errorMessages = {
        'auth/popup-blocked': 'تم حظر النافذة المنبثقة. يرجى السماح بها',
        'auth/network-request-failed': 'خطأ في الاتصال. تأكد من الإنترنت',
        'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلاً',
        'auth/operation-not-allowed': 'تسجيل الدخول غير مفعل'
    };

    const message = errorMessages[error.code] || 'حدث خطأ في تسجيل الدخول';
    
    // Don't show message for user-cancelled actions
    if (!['auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(error.code)) {
        showMessage(message, 'error');
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