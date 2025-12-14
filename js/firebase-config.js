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

// App constants
const APP_CONFIG = {
    POINTS_PER_CLAIM: 1,
    COOLDOWN_SECONDS: 30,
    DAILY_LIMIT: 2880, // 24 hours * 60 minutes * 2 points per minute
    MIN_WITHDRAW: 2000,
    POINTS_TO_DOLLAR: 10000, // 10000 points = 1$ (1000 = 0.1$)
    WITHDRAW_METHODS: ['USDT']
};

// Utility functions
function showMessage(message, type = 'info') {
    // إزالة أي رسائل سابقة
    const existingAlerts = document.querySelectorAll('.toast-notification');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `toast-notification toast-${type}`;
    alertDiv.textContent = message;

    // إضافة الرسالة في أعلى الصفحة
    document.body.appendChild(alertDiv);

    // إضافة تأثير الظهور
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 100);

    // إزالة الرسالة بعد 4 ثوان
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 300);
    }, 4000);
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-SA');
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-SA');
}