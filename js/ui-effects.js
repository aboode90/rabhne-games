// UI Effects and Animations

// Add particles effect to hero section
function createParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const particles = document.createElement('div');
    particles.className = 'particles';
    hero.appendChild(particles);
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particles.appendChild(particle);
    }
}

// Enhanced notification system
function showEnhancedMessage(message, type = 'info', duration = 4000) {
    // إزالة أي رسائل سابقة
    const existingNotifications = document.querySelectorAll('.toast-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `toast-notification toast-${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    notification.innerHTML = `${icon} ${message}`;
    
    document.body.appendChild(notification);
    
    // إضافة تأثير الظهور
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // إزالة الرسالة بعد المدة المحددة
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Points animation effect
function animatePointsGain(element, points) {
    if (!element) return;
    
    const pointsEl = document.createElement('div');
    pointsEl.textContent = `+${points}`;
    pointsEl.style.cssText = `
        position: absolute;
        color: #f39c12;
        font-weight: bold;
        font-size: 1.5rem;
        pointer-events: none;
        z-index: 1000;
        animation: pointsFloat 2s ease-out forwards;
    `;
    
    const rect = element.getBoundingClientRect();
    pointsEl.style.left = rect.left + rect.width/2 + 'px';
    pointsEl.style.top = rect.top + 'px';
    
    document.body.appendChild(pointsEl);
    
    setTimeout(() => pointsEl.remove(), 2000);
}

// Add CSS for points animation
const pointsAnimationCSS = `
@keyframes pointsFloat {
    0% {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    100% {
        transform: translateY(-50px) scale(1.2);
        opacity: 0;
    }
}
`;

// Add the CSS to the page
const style = document.createElement('style');
style.textContent = pointsAnimationCSS;
document.head.appendChild(style);

// Enhanced button click effects
function addButtonEffects() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn')) {
            const btn = e.target;
            
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255,255,255,0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            btn.style.position = 'relative';
            btn.style.overflow = 'hidden';
            btn.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        }
    });
}

// Add ripple animation CSS
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

style.textContent += rippleCSS;

// Loading animation for buttons
function showButtonLoading(button, text = 'جاري التحميل...') {
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `<div class="loading-spinner"></div> ${text}`;
    
    return () => {
        button.disabled = false;
        button.textContent = originalText;
    };
}

// Smooth scroll to sections
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Add hover sound effects (optional)
function addHoverSounds() {
    const hoverSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    
    document.addEventListener('mouseenter', (e) => {
        if (e.target.classList.contains('btn') || e.target.classList.contains('game-card')) {
            // Uncomment to enable sound effects
            // hoverSound.currentTime = 0;
            // hoverSound.play().catch(() => {});
        }
    }, true);
}

// Initialize all effects
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    addButtonEffects();
    addHoverSounds();
    
    // Override the original showMessage function
    window.showMessage = showEnhancedMessage;
    
    // Add enhanced animations to existing elements
    setTimeout(() => {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.animationDelay = (index * 0.1) + 's';
            card.classList.add('float-animation');
        });
        
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach((card, index) => {
            card.style.animationDelay = (index * 0.1) + 's';
            card.classList.add('game-card-enhanced');
        });
    }, 1000);
});

// Enhanced claim points function with animations
window.claimPointsWithAnimation = async function(gameSlug) {
    const claimBtn = document.getElementById('claimBtn');
    if (!claimBtn) return;
    
    const stopLoading = showButtonLoading(claimBtn, 'جاري إضافة النقاط...');
    
    try {
        await claimPoints(gameSlug);
        
        // Add success animation
        animatePointsGain(claimBtn, 5);
        claimBtn.classList.add('success-bounce');
        
        setTimeout(() => {
            claimBtn.classList.remove('success-bounce');
        }, 1000);
        
    } catch (error) {
        claimBtn.classList.add('shake-animation');
        setTimeout(() => {
            claimBtn.classList.remove('shake-animation');
        }, 500);
    } finally {
        stopLoading();
    }
};