// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDSwDU_B4OgMo2gh2vfbX7UEi6Cef9AUZM",
    authDomain: "rabhne-game-site.firebaseapp.com",
    projectId: "rabhne-game-site",
    storageBucket: "rabhne-game-site.firebasestorage.app",
    messagingSenderId: "285444503306",
    appId: "1:285444503306:web:72ea8d37e5bc34b77a6cf3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// Enable offline persistence for faster loading
db.enablePersistence({ synchronizeTabs: true })
  .catch(err => console.log('Persistence failed:', err.code));

// Performance settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

window.auth = auth;
window.db = db;
window.functions = functions;

// Enable Google Auth popup
auth.useDeviceLanguage();

// Enable Google Auth popup
auth.useDeviceLanguage();

// إعدادات النظام المحسن v2.0
const APP_CONFIG = window.APP_CONFIG || {
    POINTS: {
        PER_MINUTE: 1,              // نقطة واحدة كل دقيقة
        DAILY_LIMIT: 2880,          // 48 ساعة × 60 دقيقة = 2880 نقطة يومياً
        MIN_WITHDRAW_USDT: 2,       // 2 دولار كحد أدنى للسحب
        TO_DOLLAR_RATE: 10000,      // 10,000 نقطة = 1 دولار
        MAX_SESSION_MINUTES: 48     // حد أقصى 48 دقيقة لكل جلسة
    },
    SECURITY: {
        SESSION_TIMEOUT: 300000,    // 5 دقائق عدم نشاط = إيقاف الجلسة
        MAX_DAILY_SESSIONS: 60,     // حد أقصى 60 جلسة يومياً
        HEARTBEAT_INTERVAL: 60000   // نبضة كل دقيقة
    },
    WITHDRAW_METHODS: ['USDT']
};

// Validate configuration
if (APP_CONFIG.POINTS_PER_CLAIM > APP_CONFIG.MAX_POINTS_PER_UPDATE) {
    console.error('Invalid config: POINTS_PER_CLAIM exceeds MAX_POINTS_PER_UPDATE');
}

// Simple message function
function showMessage(message, type = 'info') {
    if (!message) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
    `;
    
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    alertDiv.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 4000);
}

// Safe date formatting functions
function formatDate(timestamp) {
    try {
        if (!timestamp) return 'غير محدد';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        if (isNaN(date.getTime())) return 'تاريخ غير صحيح';
        return date.toLocaleDateString('ar-SA');
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'خطأ في التاريخ';
    }
}

function formatTime(timestamp) {
    try {
        if (!timestamp) return 'غير محدد';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        if (isNaN(date.getTime())) return 'وقت غير صحيح';
        return date.toLocaleString('ar-SA');
    } catch (error) {
        console.error('Error formatting time:', error);
        return 'خطأ في الوقت';
    }
}

// Security helper functions
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '').trim();
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
}

// Performance monitoring
if (typeof performance !== 'undefined') {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        if (loadTime > 3000) {
            console.warn('Slow page load detected:', loadTime + 'ms');
        }
    });
}

// Error tracking
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // In production, send to error tracking service
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, db, firebase, APP_CONFIG, sanitizeInput, validateEmail, isValidNumber };
}