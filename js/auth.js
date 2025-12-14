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
        
        const isMainAdmin = user.email === 'abdullaalbder185@gmail.com';

        if (!userDoc.exists) {
            await userRef.set({
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
            });
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

function updateUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');

    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            userMenu.style.alignItems = 'center';
            userMenu.style.gap = '15px';
        }
        if (userName) userName.textContent = currentUser.displayName || currentUser.email;

        loadUserPoints();
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

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

async function checkAdminAccess() {
    if (!currentUser) return;

    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();

    if (userData && userData.isAdmin) {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'block';
    }
}

// Google Login function
function loginWithGoogle() {
    console.log('loginWithGoogle called');
    
    if (!window.firebase || !window.auth) {
        alert('Firebase غير محمل');
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
            console.log('Login successful:', result.user);
            showMessage('تم تسجيل الدخول بنجاح!', 'success');
        })
        .catch((error) => {
            console.error('Login error:', error);
            handleAuthError(error);
        });
}

function handleAuthError(error) {
    const errorMessages = {
        'auth/popup-blocked': 'تم حظر النافذة المنبثقة. يرجى السماح بها',
        'auth/network-request-failed': 'خطأ في الاتصال. تأكد من الإنترنت',
        'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلاً',
        'auth/operation-not-allowed': 'تسجيل الدخول غير مفعل'
    };

    const message = errorMessages[error.code] || 'حدث خطأ في تسجيل الدخول';
    
    if (!['auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(error.code)) {
        showMessage(message, 'error');
    }
}

async function logout() {
    try {
        await auth.signOut();
        showMessage('تم تسجيل الخروج بنجاح!', 'success');
        window.location.href = '/';
    } catch (error) {
        showMessage('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

function requireAuth() {
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        window.location.href = '/';
        return false;
    }
    return true;
}