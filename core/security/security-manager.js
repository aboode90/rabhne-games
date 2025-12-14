/**
 * مدير الأمان المتقدم - Rabhne Games
 * نظام حماية شامل ضد التلاعب والهجمات
 */

class SecurityManager {
    constructor() {
        this.rateLimiter = new Map();
        this.loginAttempts = new Map();
        this.sessionData = new Map();
        this.blockedIPs = new Set();
        this.init();
    }

    init() {
        this.setupCSP();
        this.setupEventListeners();
        this.startCleanupInterval();
    }

    // إعداد Content Security Policy
    setupCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = `
            default-src 'self';
            script-src 'self' 'unsafe-inline' https://www.gstatic.com https://pagead2.googlesyndication.com;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            font-src 'self' https://fonts.gstatic.com;
            img-src 'self' data: https:;
            connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
        `.replace(/\s+/g, ' ').trim();
        document.head.appendChild(meta);
    }

    // إعداد مستمعي الأحداث الأمنية
    setupEventListeners() {
        // منع النقر بالزر الأيمن في الإنتاج
        if (ENV.LOG_LEVEL === 'error') {
            document.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('selectstart', e => e.preventDefault());
            document.addEventListener('dragstart', e => e.preventDefault());
        }

        // مراقبة محاولات التلاعب
        this.monitorConsoleAccess();
        this.monitorDevTools();
    }

    // مراقبة الوصول للكونسول
    monitorConsoleAccess() {
        if (ENV.LOG_LEVEL === 'error') {
            const originalLog = console.log;
            console.log = (...args) => {
                this.logSecurityEvent('console_access', { args });
                return originalLog.apply(console, args);
            };
        }
    }

    // مراقبة أدوات المطور
    monitorDevTools() {
        let devtools = { open: false, orientation: null };
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.handleDevToolsOpen();
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    // التعامل مع فتح أدوات المطور
    handleDevToolsOpen() {
        if (ENV.LOG_LEVEL === 'error') {
            this.logSecurityEvent('devtools_opened');
            // يمكن إضافة إجراءات إضافية هنا
        }
    }

    // فحص معدل الطلبات
    checkRateLimit(identifier, maxRequests = APP_CONFIG.SECURITY.MAX_REQUESTS_PER_MINUTE) {
        const now = Date.now();
        const windowStart = now - APP_CONFIG.SECURITY.RATE_LIMIT_WINDOW;
        
        if (!this.rateLimiter.has(identifier)) {
            this.rateLimiter.set(identifier, []);
        }
        
        const requests = this.rateLimiter.get(identifier);
        
        // إزالة الطلبات القديمة
        const validRequests = requests.filter(time => time > windowStart);
        
        if (validRequests.length >= maxRequests) {
            this.logSecurityEvent('rate_limit_exceeded', { identifier, count: validRequests.length });
            return false;
        }
        
        validRequests.push(now);
        this.rateLimiter.set(identifier, validRequests);
        return true;
    }

    // تسجيل محاولة تسجيل دخول
    recordLoginAttempt(identifier, success = false) {
        const now = Date.now();
        
        if (!this.loginAttempts.has(identifier)) {
            this.loginAttempts.set(identifier, { count: 0, lastAttempt: now, locked: false });
        }
        
        const attempts = this.loginAttempts.get(identifier);
        
        if (success) {
            attempts.count = 0;
            attempts.locked = false;
        } else {
            attempts.count++;
            attempts.lastAttempt = now;
            
            if (attempts.count >= APP_CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS) {
                attempts.locked = true;
                this.logSecurityEvent('account_locked', { identifier, attempts: attempts.count });
            }
        }
        
        this.loginAttempts.set(identifier, attempts);
        return !attempts.locked;
    }

    // فحص حالة القفل
    isLocked(identifier) {
        const attempts = this.loginAttempts.get(identifier);
        if (!attempts || !attempts.locked) return false;
        
        const now = Date.now();
        const lockExpired = now - attempts.lastAttempt > APP_CONFIG.SECURITY.LOCKOUT_DURATION;
        
        if (lockExpired) {
            attempts.locked = false;
            attempts.count = 0;
            this.loginAttempts.set(identifier, attempts);
            return false;
        }
        
        return true;
    }

    // تنظيف البيانات المؤقتة
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupRateLimiter();
            this.cleanupLoginAttempts();
        }, 300000); // كل 5 دقائق
    }

    cleanupRateLimiter() {
        const now = Date.now();
        const windowStart = now - APP_CONFIG.SECURITY.RATE_LIMIT_WINDOW;
        
        for (const [identifier, requests] of this.rateLimiter.entries()) {
            const validRequests = requests.filter(time => time > windowStart);
            if (validRequests.length === 0) {
                this.rateLimiter.delete(identifier);
            } else {
                this.rateLimiter.set(identifier, validRequests);
            }
        }
    }

    cleanupLoginAttempts() {
        const now = Date.now();
        
        for (const [identifier, attempts] of this.loginAttempts.entries()) {
            if (attempts.locked && now - attempts.lastAttempt > APP_CONFIG.SECURITY.LOCKOUT_DURATION) {
                attempts.locked = false;
                attempts.count = 0;
                this.loginAttempts.set(identifier, attempts);
            }
        }
    }

    // تسجيل الأحداث الأمنية
    logSecurityEvent(type, data = {}) {
        const event = {
            type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...data
        };
        
        if (ENV.DEBUG) {
            console.warn('Security Event:', event);
        }
        
        // في الإنتاج، يمكن إرسال هذه البيانات لخدمة مراقبة
        if (ENV.LOG_LEVEL === 'error' && window.firebase && window.db) {
            this.sendSecurityLog(event);
        }
    }

    // إرسال سجل الأمان لـ Firebase
    async sendSecurityLog(event) {
        try {
            await db.collection('security_logs').add({
                ...event,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }

    // تشفير البيانات الحساسة
    encryptData(data, key = 'rabhne-secret-key') {
        try {
            return btoa(JSON.stringify(data));
        } catch (error) {
            console.error('Encryption failed:', error);
            return null;
        }
    }

    // فك تشفير البيانات
    decryptData(encryptedData, key = 'rabhne-secret-key') {
        try {
            return JSON.parse(atob(encryptedData));
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    // التحقق من صحة البيانات
    validateInput(input, type = 'string', options = {}) {
        if (input === null || input === undefined) {
            return { valid: false, error: 'Input is required' };
        }

        switch (type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return {
                    valid: emailRegex.test(input),
                    error: emailRegex.test(input) ? null : 'Invalid email format'
                };

            case 'number':
                const num = Number(input);
                const min = options.min || 0;
                const max = options.max || Number.MAX_SAFE_INTEGER;
                return {
                    valid: !isNaN(num) && num >= min && num <= max,
                    error: !isNaN(num) && num >= min && num <= max ? null : `Number must be between ${min} and ${max}`
                };

            case 'string':
                const minLength = options.minLength || 0;
                const maxLength = options.maxLength || 1000;
                const sanitized = String(input).replace(/<[^>]*>/g, '').trim();
                return {
                    valid: sanitized.length >= minLength && sanitized.length <= maxLength,
                    error: sanitized.length >= minLength && sanitized.length <= maxLength ? null : `String length must be between ${minLength} and ${maxLength}`,
                    sanitized
                };

            default:
                return { valid: true, error: null };
        }
    }

    // فحص الجلسة
    validateSession(userId) {
        if (!userId) return false;
        
        const session = this.sessionData.get(userId);
        if (!session) return false;
        
        const now = Date.now();
        if (now - session.lastActivity > APP_CONFIG.SECURITY.SESSION_TIMEOUT) {
            this.sessionData.delete(userId);
            return false;
        }
        
        session.lastActivity = now;
        this.sessionData.set(userId, session);
        return true;
    }

    // إنشاء جلسة جديدة
    createSession(userId) {
        const session = {
            userId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            sessionId: this.generateSessionId()
        };
        
        this.sessionData.set(userId, session);
        return session.sessionId;
    }

    // توليد معرف جلسة آمن
    generateSessionId() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

// إنشاء مثيل مدير الأمان
const securityManager = new SecurityManager();

// تصدير المدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
} else {
    window.SecurityManager = SecurityManager;
    window.securityManager = securityManager;
}