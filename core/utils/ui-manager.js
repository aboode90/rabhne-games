/**
 * مدير واجهة المستخدم المحسن - Rabhne Games
 * نظام إدارة واجهة المستخدم مع تأثيرات متقدمة
 */

class UIManager {
    constructor() {
        this.toasts = [];
        this.modals = new Map();
        this.animations = new Map();
        this.debounceTimers = new Map();
        this.init();
    }

    init() {
        this.setupGlobalStyles();
        this.setupEventListeners();
        this.initializeAnimations();
    }

    // إعداد الأنماط العامة
    setupGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ui-fade-in {
                animation: uiFadeIn ${APP_CONFIG.UI.ANIMATION_DURATION}ms ease-out;
            }
            
            .ui-fade-out {
                animation: uiFadeOut ${APP_CONFIG.UI.ANIMATION_DURATION}ms ease-out;
            }
            
            .ui-slide-up {
                animation: uiSlideUp ${APP_CONFIG.UI.ANIMATION_DURATION}ms ease-out;
            }
            
            .ui-slide-down {
                animation: uiSlideDown ${APP_CONFIG.UI.ANIMATION_DURATION}ms ease-out;
            }
            
            .ui-pulse {
                animation: uiPulse 2s infinite;
            }
            
            .ui-loading {
                position: relative;
                pointer-events: none;
                opacity: 0.7;
            }
            
            .ui-loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                margin: -10px 0 0 -10px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #3498db;
                border-radius: 50%;
                animation: uiSpin 1s linear infinite;
            }
            
            @keyframes uiFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes uiFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes uiSlideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes uiSlideDown {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes uiPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes uiSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            }
            
            .toast {
                padding: 16px 20px;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                font-size: 14px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                transform: translateX(400px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .toast.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .toast::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
            }
            
            .toast-success {
                background: linear-gradient(135deg, #27ae60, #2ecc71);
            }
            
            .toast-error {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
            }
            
            .toast-warning {
                background: linear-gradient(135deg, #f39c12, #e67e22);
            }
            
            .toast-info {
                background: linear-gradient(135deg, #3498db, #2980b9);
            }
            
            .toast-close {
                position: absolute;
                top: 8px;
                left: 8px;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                font-size: 16px;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .toast-close:hover {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }
            
            @media (max-width: 768px) {
                .toast-container {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .toast {
                    transform: translateY(-100px);
                    font-size: 13px;
                    padding: 12px 16px;
                }
                
                .toast.show {
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // إضافة حاوي الإشعارات
        this.createToastContainer();
        
        // مراقبة تغيير حجم النافذة
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // مراقبة التمرير
        window.addEventListener('scroll', this.debounce(() => {
            this.handleScroll();
        }, 100));
    }

    // إنشاء حاوي الإشعارات
    createToastContainer() {
        if (document.getElementById('toast-container')) return;
        
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // عرض إشعار
    showToast(message, type = 'info', duration = APP_CONFIG.UI.TOAST_DURATION) {
        // التحقق من صحة المدخلات
        const validation = securityManager.validateInput(message, 'string', {
            minLength: 1,
            maxLength: 200
        });
        
        if (!validation.valid) {
            console.error('Invalid toast message:', validation.error);
            return;
        }

        // إزالة الإشعارات الزائدة
        if (this.toasts.length >= APP_CONFIG.UI.MAX_TOASTS) {
            this.removeToast(this.toasts[0]);
        }

        const container = document.getElementById('toast-container');
        if (!container) return;

        // إنشاء عنصر الإشعار
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <button class="toast-close" onclick="uiManager.removeToast(this.parentElement)">&times;</button>
            <div class="toast-content">${validation.sanitized}</div>
        `;

        // إضافة الإشعار للحاوي
        container.appendChild(toast);
        this.toasts.push(toast);

        // إظهار الإشعار مع تأثير
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // إزالة تلقائية
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    // إزالة إشعار
    removeToast(toast) {
        if (!toast || !toast.parentElement) return;

        toast.classList.remove('show');
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, APP_CONFIG.UI.ANIMATION_DURATION);
    }

    // إظهار حالة التحميل
    showLoading(element, text = 'جاري التحميل...') {
        if (!element) return;
        
        element.classList.add('ui-loading');
        element.setAttribute('data-original-text', element.textContent);
        element.textContent = text;
        element.disabled = true;
    }

    // إخفاء حالة التحميل
    hideLoading(element) {
        if (!element) return;
        
        element.classList.remove('ui-loading');
        const originalText = element.getAttribute('data-original-text');
        if (originalText) {
            element.textContent = originalText;
            element.removeAttribute('data-original-text');
        }
        element.disabled = false;
    }

    // تأثير الظهور التدريجي
    fadeIn(element, duration = APP_CONFIG.UI.ANIMATION_DURATION) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const animation = element.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], {
            duration,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        animation.onfinish = () => {
            element.style.opacity = '';
        };
        
        return animation;
    }

    // تأثير الاختفاء التدريجي
    fadeOut(element, duration = APP_CONFIG.UI.ANIMATION_DURATION) {
        if (!element) return;
        
        const animation = element.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], {
            duration,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        animation.onfinish = () => {
            element.style.display = 'none';
            element.style.opacity = '';
        };
        
        return animation;
    }

    // تأثير الانزلاق للأعلى
    slideUp(element, duration = APP_CONFIG.UI.ANIMATION_DURATION) {
        if (!element) return;
        
        const animation = element.animate([
            { transform: 'translateY(20px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
        ], {
            duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
        
        return animation;
    }

    // تأثير النبضة
    pulse(element, duration = 600) {
        if (!element) return;
        
        const animation = element.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ], {
            duration,
            easing: 'ease-in-out'
        });
        
        return animation;
    }

    // تأثير الاهتزاز
    shake(element, duration = 500) {
        if (!element) return;
        
        const animation = element.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], {
            duration,
            easing: 'ease-in-out'
        });
        
        return animation;
    }

    // تهيئة الرسوم المتحركة
    initializeAnimations() {
        // مراقبة العناصر التي تدخل منطقة الرؤية
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    if (element.classList.contains('animate-on-scroll')) {
                        this.slideUp(element);
                        element.classList.remove('animate-on-scroll');
                        observer.unobserve(element);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // مراقبة العناصر المحددة
        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            observer.observe(element);
        });
    }

    // تأخير التنفيذ (Debounce)
    debounce(func, delay) {
        return (...args) => {
            const key = func.toString();
            
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        };
    }

    // التعامل مع تغيير حجم النافذة
    handleResize() {
        // إعادة تنسيق العناصر حسب الحاجة
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer && window.innerWidth <= 768) {
            toastContainer.style.left = '10px';
            toastContainer.style.right = '10px';
        } else if (toastContainer) {
            toastContainer.style.left = '';
            toastContainer.style.right = '20px';
        }
    }

    // التعامل مع التمرير
    handleScroll() {
        // إضافة تأثيرات التمرير حسب الحاجة
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(44, 62, 80, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            } else {
                navbar.style.background = '#2c3e50';
                navbar.style.backdropFilter = 'none';
            }
        }
    }

    // تحديث عداد النقاط مع تأثير
    updatePointsCounter(element, newValue, animated = true) {
        if (!element) return;
        
        const currentValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        
        if (!animated) {
            element.textContent = newValue.toLocaleString();
            return;
        }
        
        const difference = newValue - currentValue;
        const steps = 30;
        const stepValue = difference / steps;
        let currentStep = 0;
        
        const animation = setInterval(() => {
            currentStep++;
            const value = Math.round(currentValue + (stepValue * currentStep));
            element.textContent = value.toLocaleString();
            
            if (currentStep >= steps) {
                clearInterval(animation);
                element.textContent = newValue.toLocaleString();
            }
        }, 50);
    }

    // إضافة تأثير التحميل للنموذج
    setFormLoading(form, loading = true) {
        if (!form) return;
        
        const submitButton = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input, select, textarea');
        
        if (loading) {
            if (submitButton) this.showLoading(submitButton);
            inputs.forEach(input => input.disabled = true);
            form.classList.add('ui-loading');
        } else {
            if (submitButton) this.hideLoading(submitButton);
            inputs.forEach(input => input.disabled = false);
            form.classList.remove('ui-loading');
        }
    }

    // إنشاء مؤشر تقدم
    createProgressBar(container, progress = 0) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-fill" style="width: ${progress}%"></div>
            <div class="progress-text">${progress}%</div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .progress-bar {
                width: 100%;
                height: 20px;
                background: #ecf0f1;
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(45deg, #3498db, #2980b9);
                transition: width 0.3s ease;
                border-radius: 10px;
            }
            
            .progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 12px;
                font-weight: bold;
                color: #2c3e50;
            }
        `;
        
        if (!document.getElementById('progress-bar-styles')) {
            style.id = 'progress-bar-styles';
            document.head.appendChild(style);
        }
        
        if (container) {
            container.appendChild(progressBar);
        }
        
        return {
            element: progressBar,
            update: (newProgress) => {
                const fill = progressBar.querySelector('.progress-fill');
                const text = progressBar.querySelector('.progress-text');
                if (fill) fill.style.width = `${newProgress}%`;
                if (text) text.textContent = `${newProgress}%`;
            }
        };
    }
}

// إنشاء مثيل مدير واجهة المستخدم
const uiManager = new UIManager();

// ربط الدالة العامة لعرض الرسائل
window.showMessage = (message, type) => uiManager.showToast(message, type);

// تصدير المدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
    window.uiManager = uiManager;
}