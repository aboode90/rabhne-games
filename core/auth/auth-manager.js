/**
 * مدير التوثيق المحسن - Rabhne Games
 * نظام توثيق آمن ومحسن مع إدارة الجلسات
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authInitialized = false;
        this.authCallbacks = [];
        this.init();
    }

    async init() {
        try {
            // تهيئة Firebase Auth
            if (!window.firebase || !window.auth) {
                throw new Error('Firebase not initialized');
            }

            // مراقبة حالة التوثيق
            auth.onAuthStateChanged(async (user) => {
                await this.handleAuthStateChange(user);
            });

            this.authInitialized = true;
        } catch (error) {
            console.error('Auth initialization failed:', error);
            this.handleAuthError(error);
        }
    }

    // التعامل مع تغيير حالة التوثيق
    async handleAuthStateChange(user) {
        const previousUser = this.currentUser;
        this.currentUser = user;

        try {
            if (user) {
                // فحص الأمان
                if (!securityManager.validateSession(user.uid)) {
                    securityManager.createSession(user.uid);
                }

                // التأكد من وجود مستند المستخدم
                await this.ensureUserDocument(user);
                
                // فحص صلاحيات الإدارة
                await this.checkAdminAccess(user);
                
                // تحديث آخر نشاط
                await this.updateLastActivity(user.uid);
            } else {
                // تنظيف الجلسة
                if (previousUser) {
                    securityManager.sessionData.delete(previousUser.uid);
                }
            }

            // تحديث واجهة المستخدم
            this.updateUI();
            
            // تنفيذ callbacks
            this.executeAuthCallbacks(user);

        } catch (error) {
            console.error('Error in auth state change:', error);
            this.handleAuthError(error);
        }
    }

    // التأكد من وجود مستند المستخدم
    async ensureUserDocument(user) {
        if (!user || !user.uid) return;

        try {
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            const isMainAdmin = user.email === 'abdullaalbder185@gmail.com';
            const now = firebase.firestore.FieldValue.serverTimestamp();

            if (!userDoc.exists) {
                // إنشاء مستند مستخدم جديد
                const userData = {
                    displayName: this.sanitizeDisplayName(user.displayName),
                    email: user.email,
                    photoURL: user.photoURL || null,
                    points: 0,
                    dailyPoints: 0,
                    totalEarned: 0,
                    totalWithdrawn: 0,
                    lastClaimAt: null,
                    isAdmin: isMainAdmin,
                    blocked: false,
                    verified: user.emailVerified,
                    createdAt: now,
                    lastLoginAt: now,
                    loginCount: 1,
                    securityLevel: 'standard'
                };

                await userRef.set(userData);
                
                // تسجيل حدث إنشاء المستخدم
                await this.logUserActivity(user.uid, 'user_created', userData);
                
            } else {
                // تحديث بيانات المستخدم الموجود
                const updateData = {
                    lastLoginAt: now,
                    loginCount: firebase.firestore.FieldValue.increment(1)
                };

                // تحديث معلومات الملف الشخصي إذا تغيرت
                const currentData = userDoc.data();
                if (currentData.displayName !== user.displayName) {
                    updateData.displayName = this.sanitizeDisplayName(user.displayName);
                }
                if (currentData.photoURL !== user.photoURL) {
                    updateData.photoURL = user.photoURL;
                }
                if (currentData.verified !== user.emailVerified) {
                    updateData.verified = user.emailVerified;
                }

                // منح صلاحيات الإدارة للمدير الرئيسي
                if (isMainAdmin && !currentData.isAdmin) {
                    updateData.isAdmin = true;
                }

                await userRef.update(updateData);
                
                // تسجيل حدث تسجيل الدخول
                await this.logUserActivity(user.uid, 'user_login', { 
                    loginCount: (currentData.loginCount || 0) + 1 
                });
            }

        } catch (error) {
            console.error('Error ensuring user document:', error);
            throw error;
        }
    }

    // تنظيف اسم العرض
    sanitizeDisplayName(displayName) {
        if (!displayName) return 'مستخدم جديد';
        
        const validation = securityManager.validateInput(displayName, 'string', {
            minLength: 1,
            maxLength: 50
        });
        
        return validation.valid ? validation.sanitized : 'مستخدم جديد';
    }

    // فحص صلاحيات الإدارة
    async checkAdminAccess(user) {
        if (!user) return false;

        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            const isAdmin = userData && userData.isAdmin;
            
            // إظهار/إخفاء عناصر الإدارة
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(element => {
                element.style.display = isAdmin ? 'block' : 'none';
            });

            return isAdmin;
            
        } catch (error) {
            console.error('Error checking admin access:', error);
            return false;
        }
    }

    // تحديث آخر نشاط
    async updateLastActivity(userId) {
        try {
            await db.collection('users').doc(userId).update({
                lastActivity: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating last activity:', error);
        }
    }

    // تسجيل نشاط المستخدم
    async logUserActivity(userId, action, data = {}) {
        try {
            await db.collection('user_activities').add({
                userId,
                action,
                data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ip: await this.getUserIP(),
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error('Error logging user activity:', error);
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

    // تسجيل الدخول بـ Google
    async loginWithGoogle() {
        try {
            // فحص معدل الطلبات
            const userIP = await this.getUserIP();
            if (!securityManager.checkRateLimit(`login_${userIP}`, 5)) {
                throw new Error('تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول');
            }

            // فحص حالة القفل
            if (securityManager.isLocked(userIP)) {
                throw new Error('تم قفل الحساب مؤقتاً بسبب محاولات تسجيل دخول متكررة');
            }

            // التحقق من وجود مستخدم مسجل بالفعل
            if (this.currentUser) {
                this.showMessage('أنت مسجل دخول بالفعل', 'info');
                return { success: true, user: this.currentUser };
            }

            this.showMessage('جاري تسجيل الدخول...', 'info');

            // إعداد موفر Google
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            // تسجيل الدخول
            const result = await auth.signInWithPopup(provider);
            
            if (result.user) {
                // تسجيل محاولة ناجحة
                securityManager.recordLoginAttempt(userIP, true);
                
                this.showMessage(`مرحباً بك ${result.user.displayName || 'مستخدم'}!`, 'success');
                
                return { success: true, user: result.user };
            }

        } catch (error) {
            // تسجيل محاولة فاشلة
            const userIP = await this.getUserIP();
            securityManager.recordLoginAttempt(userIP, false);
            
            console.error('Login error:', error);
            this.handleAuthError(error);
            return { success: false, error: error.message };
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            if (!this.currentUser) {
                this.showMessage('لست مسجل دخول', 'info');
                return;
            }

            // تسجيل نشاط تسجيل الخروج
            await this.logUserActivity(this.currentUser.uid, 'user_logout');

            // تسجيل الخروج من Firebase
            await auth.signOut();
            
            this.showMessage('تم تسجيل الخروج بنجاح!', 'success');
            
            // إعادة توجيه للصفحة الرئيسية
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);

        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('حدث خطأ أثناء تسجيل الخروج', 'error');
        }
    }

    // تحديث واجهة المستخدم
    updateUI() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const heroAuthButton = document.getElementById('heroAuthButton');

        // عناصر التنقل المحمول
        const mobileAuthButton = document.getElementById('mobileAuthButton');
        const mobileNavDashboard = document.getElementById('mobileNavDashboard');

        if (this.currentUser) {
            // المستخدم مسجل دخول
            if (authButtons) authButtons.style.display = 'none';
            if (heroAuthButton) heroAuthButton.style.display = 'none';
            
            if (userMenu) {
                userMenu.style.display = 'flex';
                userMenu.style.alignItems = 'center';
                userMenu.style.gap = '15px';
            }
            
            if (userName) {
                userName.textContent = this.currentUser.displayName || this.currentUser.email;
            }

            // تحديث التنقل المحمول
            if (mobileAuthButton) {
                mobileAuthButton.innerHTML = `
                    <span class="mobile-nav-icon">👤</span>
                    <span class="mobile-nav-text">الملف</span>
                `;
                mobileAuthButton.onclick = () => window.location.href = 'profile.html';
            }
            
            if (mobileNavDashboard) {
                mobileNavDashboard.style.display = 'flex';
            }

            // تحديث عداد النقاط
            this.loadUserPoints();
            this.loadMobileUserPoints();

        } else {
            // المستخدم غير مسجل دخول
            if (authButtons) authButtons.style.display = 'flex';
            if (heroAuthButton) heroAuthButton.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';

            // إعادة تعيين التنقل المحمول
            if (mobileAuthButton) {
                mobileAuthButton.innerHTML = `
                    <span class="mobile-nav-icon">🔑</span>
                    <span class="mobile-nav-text">دخول</span>
                `;
                mobileAuthButton.onclick = () => this.loginWithGoogle();
            }
            
            if (mobileNavDashboard) {
                mobileNavDashboard.style.display = 'none';
            }
        }
    }

    // تحميل نقاط المستخدم
    async loadUserPoints() {
        if (!this.currentUser) return;

        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
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
    async loadMobileUserPoints() {
        if (!this.currentUser) return;

        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            const userData = userDoc.data();
            const mobileUserPoints = document.getElementById('mobileUserPoints');

            if (mobileUserPoints && userData) {
                mobileUserPoints.textContent = `${(userData.points || 0).toLocaleString()} نقطة`;
            }
        } catch (error) {
            console.error('Error loading mobile user points:', error);
        }
    }

    // التعامل مع أخطاء التوثيق
    handleAuthError(error) {
        const errorMessages = {
            'auth/popup-blocked': 'تم حظر النافذة المنبثقة. يرجى السماح بها',
            'auth/network-request-failed': 'خطأ في الاتصال. تأكد من الإنترنت',
            'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلاً',
            'auth/operation-not-allowed': 'تسجيل الدخول غير مفعل',
            'auth/user-disabled': 'تم تعطيل هذا الحساب',
            'auth/user-not-found': 'المستخدم غير موجود',
            'auth/wrong-password': 'كلمة المرور غير صحيحة'
        };

        const message = errorMessages[error.code] || error.message || 'حدث خطأ في تسجيل الدخول';
        
        // عدم إظهار رسالة للإجراءات المُلغاة من المستخدم
        if (!['auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(error.code)) {
            this.showMessage(message, 'error');
        }
    }

    // حماية الصفحات
    requireAuth() {
        if (!this.currentUser) {
            this.showMessage('يجب تسجيل الدخول أولاً', 'error');
            window.location.href = '/';
            return false;
        }
        return true;
    }

    // حماية صفحات الإدارة
    async requireAdmin() {
        if (!this.currentUser) {
            window.location.href = '/';
            return false;
        }

        const isAdmin = await this.checkAdminAccess(this.currentUser);
        if (!isAdmin) {
            this.showMessage('ليس لديك صلاحية للوصول لهذه الصفحة', 'error');
            window.location.href = '/';
            return false;
        }

        return true;
    }

    // إضافة callback للتوثيق
    onAuthStateChanged(callback) {
        this.authCallbacks.push(callback);
        
        // تنفيذ فوري إذا كان التوثيق مُهيأ
        if (this.authInitialized) {
            callback(this.currentUser);
        }
    }

    // تنفيذ callbacks التوثيق
    executeAuthCallbacks(user) {
        this.authCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth callback error:', error);
            }
        });
    }

    // عرض الرسائل
    showMessage(message, type = 'info') {
        if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// إنشاء مثيل مدير التوثيق
const authManager = new AuthManager();

// تصدير المدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} else {
    window.AuthManager = AuthManager;
    window.authManager = authManager;
}