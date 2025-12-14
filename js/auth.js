// Authentication functions - Optimized

let currentUser = null;
let authInitialized = false;
let userDataCache = null;

// Optimized auth state listener
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    authInitialized = true;
    
    // Update UI immediately
    updateUI();
    
    if (user) {
        // Load user data in background
        loadUserDataAsync(user);
    } else {
        userDataCache = null;
        sessionStorage.removeItem('userDataCache');
    }
});

// Async user data loading
async function loadUserDataAsync(user) {
    try {
        // Check cache first
        const cachedData = sessionStorage.getItem('userDataCache');
        const cacheTime = sessionStorage.getItem('userDataCacheTime');
        const now = Date.now();
        
        // Use cache if less than 2 minutes old
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 120000) {
            userDataCache = JSON.parse(cachedData);
            updateUserPoints();
            return;
        }
        
        await ensureUserDocument(user);
        await loadUserPoints();
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Optimized user document creation
async function ensureUserDocument(user) {
    if (!user?.uid) return;
    
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        const isMainAdmin = user.email === 'abdullaalbder185@gmail.com';
        
        if (!userDoc.exists) {
            const userData = {
                displayName: user.displayName || 'مستخدم جديد',
                email: user.email,
                photoURL: user.photoURL || null,
                points: 0,
                dailyPoints: 0,
                lastClaimAt: null,
                isAdmin: isMainAdmin,
                blocked: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await userRef.set(userData);
            userDataCache = { ...userData, points: 0 };
        } else {
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

// Fast UI update
function updateUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const mobileNavDashboard = document.getElementById('mobileNavDashboard');
    const mobileAuthButton = document.getElementById('mobileAuthButton');

    if (currentUser) {
        // Show user elements
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            userMenu.style.alignItems = 'center';
            userMenu.style.gap = '15px';
        }
        if (userName) userName.textContent = currentUser.displayName || currentUser.email;
        if (mobileNavDashboard) mobileNavDashboard.style.display = 'flex';
        if (mobileAuthButton) mobileAuthButton.style.display = 'none';
        
        // Load points if cached
        if (userDataCache) {
            updateUserPoints();
        }
        
    } else {
        // Show auth elements
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (mobileNavDashboard) mobileNavDashboard.style.display = 'none';
        if (mobileAuthButton) mobileAuthButton.style.display = 'flex';
    }
}

// Optimized points loading
async function loadUserPoints() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        
        if (userData) {
            userDataCache = userData;
            // Cache for 2 minutes
            sessionStorage.setItem('userDataCache', JSON.stringify(userData));
            sessionStorage.setItem('userDataCacheTime', Date.now().toString());
            
            updateUserPoints();
        }
        
    } catch (error) {
        console.error('Error loading user points:', error);
    }
}

// Update points in UI
function updateUserPoints() {
    if (!userDataCache) return;
    
    const userPointsElements = [
        'userPointsNav',
        'userPoints', 
        'footerPoints'
    ];
    
    userPointsElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = (userDataCache.points || 0).toLocaleString();
        }
    });
    
    // Update cash value
    const cashElements = ['cashValue', 'footerCash'];
    cashElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const cashValue = ((userDataCache.points || 0) / 10000).toFixed(2);
            element.textContent = `$${cashValue}`;
        }
    });
}

// Fast Google login
function loginWithGoogle() {
    if (!firebase?.auth) {
        showMessage('جاري تحميل النظام...', 'info');
        return;
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    
    auth.signInWithPopup(provider)
        .then((result) => {
            showMessage('تم تسجيل الدخول بنجاح!', 'success');
        })
        .catch((error) => {
            if (!['auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(error.code)) {
                const errorMessages = {
                    'auth/popup-blocked': 'تم حظر النافذة المنبثقة. يرجى السماح بها',
                    'auth/network-request-failed': 'خطأ في الاتصال. تأكد من الإنترنت',
                    'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلاً'
                };
                
                const message = errorMessages[error.code] || 'حدث خطأ في تسجيل الدخول';
                showMessage(message, 'error');
            }
        });
}

// Fast logout
async function logout() {
    try {
        await auth.signOut();
        userDataCache = null;
        sessionStorage.removeItem('userDataCache');
        sessionStorage.removeItem('userDataCacheTime');
        sessionStorage.removeItem('gamesCache');
        sessionStorage.removeItem('gamesCacheTime');
        
        showMessage('تم تسجيل الخروج بنجاح!', 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        showMessage('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// Auth requirement check
function requireAuth() {
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        return false;
    }
    return true;
}

// Get cached user data
function getCachedUserData() {
    return userDataCache;
}