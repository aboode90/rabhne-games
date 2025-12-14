/**
 * تكوين التطبيق المحسن - نظام Rabhne Games
 * إعدادات آمنة ومحسنة للأداء
 */

// إعدادات Firebase المحسنة
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDSwDU_B4OgMo2gh2vfbX7UEi6Cef9AUZM",
    authDomain: "www.rabhne.online",
    projectId: "rabhne-game-site",
    storageBucket: "rabhne-game-site.firebasestorage.app",
    messagingSenderId: "285444503306",
    appId: "1:285444503306:web:72ea8d37e5bc34b77a6cf3"
};

// إعدادات التطبيق الأساسية
const APP_CONFIG = {
    // نظام النقاط
    POINTS: {
        PER_CLAIM: 1,
        COOLDOWN_SECONDS: 30,
        DAILY_LIMIT: 2880,
        MIN_WITHDRAW: 2000,
        TO_DOLLAR_RATE: 10000,
        MAX_PER_UPDATE: 5
    },
    
    // إعدادات الأمان
    SECURITY: {
        SESSION_TIMEOUT: 3600000, // ساعة واحدة
        MAX_DAILY_SESSIONS: 100,
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION: 900000, // 15 دقيقة
        RATE_LIMIT_WINDOW: 60000, // دقيقة واحدة
        MAX_REQUESTS_PER_MINUTE: 60
    },
    
    // إعدادات الواجهة
    UI: {
        TOAST_DURATION: 4000,
        MAX_TOASTS: 3,
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500
    },
    
    // إعدادات الألعاب
    GAMES: {
        MAX_PLAY_TIME: 3600000, // ساعة واحدة
        MIN_PLAY_TIME: 30000,   // 30 ثانية
        AUTO_SAVE_INTERVAL: 30000
    },
    
    // طرق السحب المدعومة
    WITHDRAW_METHODS: ['USDT', 'PayPal'],
    
    // إعدادات الإشعارات
    NOTIFICATIONS: {
        ENABLED: true,
        SOUND: false,
        VIBRATION: true
    }
};

// إعدادات البيئة
const ENV_CONFIG = {
    DEVELOPMENT: {
        DEBUG: true,
        LOG_LEVEL: 'debug',
        CACHE_ENABLED: false
    },
    PRODUCTION: {
        DEBUG: false,
        LOG_LEVEL: 'error',
        CACHE_ENABLED: true
    }
};

// تحديد البيئة الحالية
const CURRENT_ENV = window.location.hostname === 'localhost' ? 'DEVELOPMENT' : 'PRODUCTION';
const ENV = ENV_CONFIG[CURRENT_ENV];

// تصدير الإعدادات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FIREBASE_CONFIG, APP_CONFIG, ENV_CONFIG, ENV };
} else {
    window.FIREBASE_CONFIG = FIREBASE_CONFIG;
    window.APP_CONFIG = APP_CONFIG;
    window.ENV = ENV;
}