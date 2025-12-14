// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDSwDU_B4OgMo2gh2vfbX7UEi6Cef9AUZM",
    authDomain: "www.rabhne.online",
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
window.auth = auth;
window.db = db;

// Enable Google Auth popup
auth.useDeviceLanguage();

// Enable Google Auth popup
auth.useDeviceLanguage();

// استخدام الإعدادات من الملف الجديد
const APP_CONFIG = window.APP_CONFIG || {
    POINTS: {
        PER_CLAIM: 1,
        COOLDOWN_SECONDS: 30,
        DAILY_LIMIT: 2880,
        MIN_WITHDRAW: 2000,
        TO_DOLLAR_RATE: 10000,
        MAX_PER_UPDATE: 5
    },
    SECURITY: {
        SESSION_TIMEOUT: 3600000,
        MAX_DAILY_SESSIONS: 100
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