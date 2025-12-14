/**
 * نواة التطبيق المحسنة - Rabhne Games
 * نظام تهيئة وإدارة التطبيق الرئيسي
 */

class AppCore {
    constructor() {
        this.initialized = false;
        this.modules = new Map();
        this.eventListeners = new Map();
        this.performanceMetrics = {
            startTime: performance.now(),
            loadTime: null,
            initTime: null
        };
        this.init();
    }

    async init() {
        try {
            console.log('🚀 بدء تهيئة تطبيق Rabhne Games...');
            
            // تحميل الإعدادات
            await this.loadConfiguration();
            
            // تهيئة Firebase
            await this.initializeFirebase();
            
            // تهيئة الوحدات الأساسية
            await this.initializeModules();
            
            // إعداد مستمعي الأحداث
            this.setupEventListeners();
            
            // تهيئة واجهة المستخدم
            await this.initializeUI();
            
            // تسجيل مقاييس الأداء
            this.recordPerformanceMetrics();
            
            this.initialized = true;
            console.log('✅ تم تهيئة التطبيق بنجاح');
            
            // إطلاق حدث التهيئة
            this.emit('app:initialized');
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة التطبيق:', error);
            this.handleInitializationError(error);
        }
    }

    // تحميل الإعدادات
    async loadConfiguration() {
        try {
            // التحقق من وجود الإعدادات
            if (!window.FIREBASE_CONFIG || !window.APP_CONFIG) {
                throw new Error('إعدادات التطبيق غير موجودة');
            }

            // تطبيق إعدادات البيئة
            if (window.ENV) {
                if (ENV.DEBUG) {
                    console.log('🔧 وضع التطوير مفعل');
                }
                
                // إعداد مستوى السجلات
                this.setupLogging(ENV.LOG_LEVEL);
            }

            console.log('⚙️ تم تحميل الإعدادات');
            
        } catch (error) {
            console.error('خطأ في تحميل الإعدادات:', error);
            throw error;
        }
    }

    // تهيئة Firebase
    async initializeFirebase() {
        try {
            // التحقق من وجود Firebase
            if (!window.firebase) {
                throw new Error('مكتبة Firebase غير محملة');
            }

            // تهيئة Firebase
            firebase.initializeApp(window.FIREBASE_CONFIG);
            
            // تهيئة الخدمات
            window.auth = firebase.auth();
            window.db = firebase.firestore();
            
            // إعداد إعدادات Firestore
            db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
            });
            
            // تمكين الاستمرارية
            await db.enablePersistence({
                synchronizeTabs: true
            }).catch(error => {
                console.warn('تعذر تمكين الاستمرارية:', error);
            });

            console.log('🔥 تم تهيئة Firebase');
            
        } catch (error) {
            console.error('خطأ في تهيئة Firebase:', error);
            throw error;
        }
    }

    // تهيئة الوحدات الأساسية
    async initializeModules() {
        try {
            const modules = [
                { name: 'security', instance: window.securityManager, required: true },
                { name: 'ui', instance: window.uiManager, required: true },
                { name: 'auth', instance: window.authManager, required: true },
                { name: 'points', instance: window.pointsManager, required: true }
            ];

            for (const module of modules) {
                if (module.instance) {
                    this.modules.set(module.name, module.instance);
                    console.log(`📦 تم تحميل وحدة ${module.name}`);
                } else if (module.required) {
                    throw new Error(`الوحدة المطلوبة ${module.name} غير متوفرة`);
                }
            }

            console.log('📚 تم تهيئة جميع الوحدات');
            
        } catch (error) {
            console.error('خطأ في تهيئة الوحدات:', error);
            throw error;
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // مراقبة حالة الاتصال
        window.addEventListener('online', () => {
            this.handleConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.handleConnectionChange(false);
        });

        // مراقبة أخطاء JavaScript
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error);
        });

        // مراقبة الأخطاء غير المعالجة
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event.reason);
        });

        // مراقبة تغيير الصفحة
        window.addEventListener('beforeunload', () => {
            this.handlePageUnload();
        });

        // مراقبة تغيير حجم النافذة
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        console.log('👂 تم إعداد مستمعي الأحداث');
    }

    // تهيئة واجهة المستخدم
    async initializeUI() {
        try {
            // إعداد الثيم
            this.setupTheme();
            
            // تهيئة التنقل
            this.initializeNavigation();
            
            // إعداد PWA
            this.setupPWA();
            
            // تحميل البيانات الأولية
            await this.loadInitialData();

            console.log('🎨 تم تهيئة واجهة المستخدم');
            
        } catch (error) {
            console.error('خطأ في تهيئة واجهة المستخدم:', error);
        }
    }

    // إعداد الثيم
    setupTheme() {
        // إضافة متغيرات CSS للثيم
        const root = document.documentElement;
        root.style.setProperty('--primary-color', '#3498db');
        root.style.setProperty('--secondary-color', '#2c3e50');
        root.style.setProperty('--success-color', '#27ae60');
        root.style.setProperty('--error-color', '#e74c3c');
        root.style.setProperty('--warning-color', '#f39c12');
        root.style.setProperty('--info-color', '#3498db');
        
        // تطبيق الثيم المحفوظ
        const savedTheme = localStorage.getItem('rabhne-theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
    }

    // تهيئة التنقل
    initializeNavigation() {
        // إعداد التنقل النشط
        this.setActiveNavigation();
        
        // إعداد التنقل المحمول
        this.setupMobileNavigation();
    }

    // إعداد التنقل النشط
    setActiveNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-item');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (currentPath === href || currentPath.endsWith(href))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // إعداد التنقل المحمول
    setupMobileNavigation() {
        const mobileNavToggle = document.getElementById('mobileNavToggle');
        const mobileNav = document.getElementById('mobileNav');
        
        if (mobileNavToggle && mobileNav) {
            mobileNavToggle.addEventListener('click', () => {
                mobileNav.classList.toggle('active');
            });
        }
    }

    // إعداد PWA
    setupPWA() {
        // تسجيل Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('📱 تم تسجيل Service Worker');
                })
                .catch(error => {
                    console.error('خطأ في تسجيل Service Worker:', error);
                });
        }

        // إعداد تثبيت التطبيق
        this.setupAppInstall();
    }

    // إعداد تثبيت التطبيق
    setupAppInstall() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            deferredPrompt = event;
            
            // إظهار زر التثبيت
            const installButton = document.getElementById('installApp');
            if (installButton) {
                installButton.style.display = 'block';
                installButton.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const result = await deferredPrompt.userChoice;
                        deferredPrompt = null;
                        installButton.style.display = 'none';
                    }
                });
            }
        });
    }

    // تحميل البيانات الأولية
    async loadInitialData() {
        const currentPath = window.location.pathname;
        
        try {
            // تحميل البيانات حسب الصفحة
            if (currentPath === '/' || currentPath === '/index.html') {
                await this.loadHomePageData();
            } else if (currentPath === '/dashboard.html') {
                await this.loadDashboardData();
            } else if (currentPath === '/games.html') {
                await this.loadGamesData();
            }
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات الأولية:', error);
        }
    }

    // تحميل بيانات الصفحة الرئيسية
    async loadHomePageData() {
        try {
            // تحميل الإحصائيات
            const stats = await this.getAppStats();
            this.updateStatsDisplay(stats);
            
        } catch (error) {
            console.error('خطأ في تحميل بيانات الصفحة الرئيسية:', error);
        }
    }

    // تحميل بيانات لوحة التحكم
    async loadDashboardData() {
        if (!authManager.currentUser) return;
        
        try {
            // تحميل بيانات المستخدم
            const userStats = await pointsManager.getPointsStats(authManager.currentUser.uid);
            this.updateUserStatsDisplay(userStats);
            
        } catch (error) {
            console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
        }
    }

    // تحميل بيانات الألعاب
    async loadGamesData() {
        try {
            // تحميل قائمة الألعاب
            const games = await this.getActiveGames();
            this.updateGamesDisplay(games);
            
        } catch (error) {
            console.error('خطأ في تحميل بيانات الألعاب:', error);
        }
    }

    // الحصول على إحصائيات التطبيق
    async getAppStats() {
        try {
            const [usersSnapshot, gamesSnapshot, withdrawalsSnapshot] = await Promise.all([
                db.collection('users').get(),
                db.collection('games').where('isActive', '==', true).get(),
                db.collection('withdraw_requests').where('status', '==', 'approved').get()
            ]);

            return {
                totalUsers: usersSnapshot.size,
                totalGames: gamesSnapshot.size,
                totalPayouts: withdrawalsSnapshot.size
            };
            
        } catch (error) {
            console.error('خطأ في الحصول على الإحصائيات:', error);
            return { totalUsers: 0, totalGames: 0, totalPayouts: 0 };
        }
    }

    // تحديث عرض الإحصائيات
    updateStatsDisplay(stats) {
        const elements = {
            totalUsers: document.getElementById('totalUsers'),
            totalGames: document.getElementById('totalGames'),
            totalPayouts: document.getElementById('totalPayouts'),
            statPlayers: document.getElementById('statPlayers'),
            statPaid: document.getElementById('statPaid')
        };

        if (elements.totalUsers) elements.totalUsers.textContent = stats.totalUsers;
        if (elements.totalGames) elements.totalGames.textContent = stats.totalGames;
        if (elements.totalPayouts) elements.totalPayouts.textContent = stats.totalPayouts;
        if (elements.statPlayers) elements.statPlayers.textContent = `+${stats.totalUsers}`;
        if (elements.statPaid) elements.statPaid.textContent = `$${stats.totalPayouts * 10}`;
    }

    // تحديث عرض إحصائيات المستخدم
    updateUserStatsDisplay(stats) {
        if (!stats) return;

        const elements = {
            userPoints: document.getElementById('userPoints'),
            dailyPoints: document.getElementById('dailyPoints'),
            totalEarned: document.getElementById('totalEarned'),
            remainingDaily: document.getElementById('remainingDaily')
        };

        if (elements.userPoints) {
            uiManager.updatePointsCounter(elements.userPoints, stats.totalPoints);
        }
        if (elements.dailyPoints) {
            uiManager.updatePointsCounter(elements.dailyPoints, stats.dailyPoints);
        }
        if (elements.totalEarned) {
            uiManager.updatePointsCounter(elements.totalEarned, stats.totalEarned);
        }
        if (elements.remainingDaily) {
            uiManager.updatePointsCounter(elements.remainingDaily, stats.remainingDaily);
        }
    }

    // الحصول على الألعاب النشطة
    async getActiveGames() {
        try {
            const gamesSnapshot = await db.collection('games')
                .where('isActive', '==', true)
                .orderBy('createdAt', 'desc')
                .get();

            return gamesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
        } catch (error) {
            console.error('خطأ في الحصول على الألعاب:', error);
            return [];
        }
    }

    // تحديث عرض الألعاب
    updateGamesDisplay(games) {
        const gamesContainer = document.getElementById('gamesContainer');
        if (!gamesContainer) return;

        gamesContainer.innerHTML = '';

        games.forEach(game => {
            const gameCard = this.createGameCard(game);
            gamesContainer.appendChild(gameCard);
        });
    }

    // إنشاء بطاقة لعبة
    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card animate-on-scroll';
        card.innerHTML = `
            <img src="${game.thumbnail || '/img/placeholder.svg'}" alt="${game.title}" class="game-thumbnail">
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <p class="game-category">${game.category || 'عام'}</p>
                <a href="/game.html?slug=${game.slug}" class="btn btn-primary">العب الآن</a>
            </div>
        `;
        return card;
    }

    // التعامل مع تغيير الاتصال
    handleConnectionChange(isOnline) {
        const message = isOnline ? 'تم استعادة الاتصال' : 'انقطع الاتصال بالإنترنت';
        const type = isOnline ? 'success' : 'warning';
        
        uiManager.showToast(message, type);
        
        // تحديث حالة التطبيق
        document.body.setAttribute('data-online', isOnline.toString());
    }

    // التعامل مع الأخطاء العامة
    handleGlobalError(error) {
        console.error('خطأ عام:', error);
        
        if (ENV && ENV.DEBUG) {
            uiManager.showToast(`خطأ: ${error.message}`, 'error');
        } else {
            uiManager.showToast('حدث خطأ غير متوقع', 'error');
        }
        
        // إرسال تقرير الخطأ
        this.reportError(error);
    }

    // التعامل مع الوعود غير المعالجة
    handleUnhandledRejection(reason) {
        console.error('وعد غير معالج:', reason);
        this.reportError(reason);
    }

    // التعامل مع إغلاق الصفحة
    handlePageUnload() {
        // حفظ البيانات المؤقتة
        this.saveTemporaryData();
        
        // تنظيف الموارد
        this.cleanup();
    }

    // التعامل مع تغيير حجم النافذة
    handleResize() {
        // إعادة حساب التخطيط
        this.recalculateLayout();
        
        // تحديث التنقل المحمول
        this.updateMobileNavigation();
    }

    // التعامل مع خطأ التهيئة
    handleInitializationError(error) {
        // عرض رسالة خطأ للمستخدم
        const errorContainer = document.createElement('div');
        errorContainer.className = 'init-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h2>خطأ في تحميل التطبيق</h2>
                <p>حدث خطأ أثناء تحميل التطبيق. يرجى إعادة تحميل الصفحة.</p>
                <button onclick="window.location.reload()" class="btn btn-primary">إعادة تحميل</button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
        
        // إرسال تقرير الخطأ
        this.reportError(error);
    }

    // تسجيل مقاييس الأداء
    recordPerformanceMetrics() {
        this.performanceMetrics.initTime = performance.now();
        this.performanceMetrics.loadTime = this.performanceMetrics.initTime - this.performanceMetrics.startTime;
        
        console.log(`⚡ وقت التحميل: ${this.performanceMetrics.loadTime.toFixed(2)}ms`);
        
        // إرسال مقاييس الأداء في الإنتاج
        if (ENV && ENV.LOG_LEVEL === 'error') {
            this.sendPerformanceMetrics();
        }
    }

    // إرسال مقاييس الأداء
    async sendPerformanceMetrics() {
        try {
            await db.collection('performance_metrics').add({
                loadTime: this.performanceMetrics.loadTime,
                initTime: this.performanceMetrics.initTime,
                userAgent: navigator.userAgent,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('خطأ في إرسال مقاييس الأداء:', error);
        }
    }

    // إرسال تقرير خطأ
    async reportError(error) {
        if (!ENV || ENV.LOG_LEVEL !== 'error') return;
        
        try {
            await db.collection('error_reports').add({
                message: error.message || 'خطأ غير معروف',
                stack: error.stack || '',
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (reportError) {
            console.error('خطأ في إرسال تقرير الخطأ:', reportError);
        }
    }

    // إعداد نظام السجلات
    setupLogging(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(level);
        
        if (currentLevelIndex === -1) return;
        
        // تعطيل مستويات السجلات الأقل أهمية
        for (let i = 0; i < currentLevelIndex; i++) {
            const levelName = levels[i];
            if (console[levelName]) {
                console[levelName] = () => {};
            }
        }
    }

    // تأخير التنفيذ
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // إطلاق حدث
    emit(eventName, data = null) {
        const event = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(event);
    }

    // الاستماع لحدث
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
        window.addEventListener(eventName, callback);
    }

    // إزالة مستمع حدث
    off(eventName, callback) {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
                window.removeEventListener(eventName, callback);
            }
        }
    }

    // حفظ البيانات المؤقتة
    saveTemporaryData() {
        try {
            const tempData = {
                timestamp: Date.now(),
                path: window.location.pathname,
                scrollPosition: window.scrollY
            };
            
            localStorage.setItem('rabhne-temp-data', JSON.stringify(tempData));
        } catch (error) {
            console.error('خطأ في حفظ البيانات المؤقتة:', error);
        }
    }

    // تنظيف الموارد
    cleanup() {
        // إلغاء المؤقتات
        this.eventListeners.forEach((listeners, eventName) => {
            listeners.forEach(callback => {
                window.removeEventListener(eventName, callback);
            });
        });
        
        this.eventListeners.clear();
    }

    // إعادة حساب التخطيط
    recalculateLayout() {
        // إعادة حساب أحجام العناصر حسب الحاجة
        const elements = document.querySelectorAll('.responsive-element');
        elements.forEach(element => {
            element.style.height = 'auto';
            element.style.height = element.scrollHeight + 'px';
        });
    }

    // تحديث التنقل المحمول
    updateMobileNavigation() {
        const isMobile = window.innerWidth <= 768;
        const mobileNav = document.querySelector('.mobile-bottom-nav');
        const desktopNav = document.querySelector('.navbar');
        
        if (mobileNav) {
            mobileNav.style.display = isMobile ? 'flex' : 'none';
        }
        
        if (desktopNav) {
            desktopNav.style.display = isMobile ? 'block' : 'block';
        }
    }
}

// تهيئة التطبيق عند تحميل DOM
document.addEventListener('DOMContentLoaded', () => {
    window.appCore = new AppCore();
});

// تصدير النواة
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppCore;
} else {
    window.AppCore = AppCore;
}