// Rabhne Games - UI Helper Functions v3.0

class UIManager {
  constructor() {
    this.toastContainer = null;
    this.init();
  }

  init() {
    this.createToastContainer();
    this.initSkeletonLoaders();
    this.initMobileNav();
  }

  // Toast Notifications
  createToastContainer() {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(this.toastContainer);
    }
  }

  showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="toast-icon">${this.getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 18px; margin-right: -8px;">×</button>
      </div>
    `;

    this.toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  }

  getToastIcon(type) {
    const icons = {
      success: '✅',
      warning: '⚠️',
      danger: '❌',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  // Modal System
  showModal(content, title = '') {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        ${title ? `<h3 class="mb-4">${title}</h3>` : ''}
        <div class="modal-body">${content}</div>
        <div class="flex justify-end gap-4 mt-6">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">إغلاق</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 100);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
      }
    });

    return modal;
  }

  // Skeleton Loaders
  initSkeletonLoaders() {
    this.skeletonTemplates = {
      card: `
        <div class="card">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 80%;"></div>
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
        </div>
      `,
      table: `
        <div class="card">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      `,
      stats: `
        <div class="card text-center">
          <div class="skeleton skeleton-card"></div>
        </div>
      `
    };
  }

  showSkeleton(container, type = 'card', count = 1) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) return;

    const template = this.skeletonTemplates[type] || this.skeletonTemplates.card;
    container.innerHTML = Array(count).fill(template).join('');
  }

  hideSkeleton(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) return;
    container.innerHTML = '';
  }

  // Empty States
  showEmptyState(container, icon, title, description, actionButton = null) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) return;

    const actionHtml = actionButton ? 
      `<button class="btn btn-primary" onclick="${actionButton.onclick}">${actionButton.text}</button>` : '';

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-description">${description}</p>
        ${actionHtml}
      </div>
    `;
  }

  // Loading States
  showLoading(container, message = 'جاري التحميل...') {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) return;

    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8">
        <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%; margin-bottom: 16px;"></div>
        <p class="text-muted">${message}</p>
      </div>
    `;
  }

  // Mobile Navigation
  initMobileNav() {
    const mobileNav = document.querySelector('.mobile-nav');
    if (!mobileNav) return;

    // Update active state based on current page
    const currentPath = window.location.pathname;
    const navItems = mobileNav.querySelectorAll('.mobile-nav-item');
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && (currentPath === href || currentPath.endsWith(href))) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Form Validation
  validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!input.value.trim()) {
        this.showFieldError(input, 'هذا الحقل مطلوب');
        isValid = false;
      } else {
        this.clearFieldError(input);
      }
    });

    return isValid;
  }

  showFieldError(input, message) {
    this.clearFieldError(input);
    
    const error = document.createElement('div');
    error.className = 'field-error';
    error.style.cssText = 'color: var(--danger); font-size: var(--font-size-sm); margin-top: var(--space-1);';
    error.textContent = message;
    
    input.style.borderColor = 'var(--danger)';
    input.parentNode.appendChild(error);
  }

  clearFieldError(input) {
    const error = input.parentNode.querySelector('.field-error');
    if (error) {
      error.remove();
    }
    input.style.borderColor = '';
  }

  // Utility Functions
  formatNumber(num) {
    return new Intl.NumberFormat('ar-SA').format(num);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  // Animation Helpers
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      
      element.style.opacity = Math.min(progress / duration, 1);
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  fadeOut(element, duration = 300) {
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      
      element.style.opacity = Math.max(1 - (progress / duration), 0);
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    
    requestAnimationFrame(animate);
  }

  slideUp(element, duration = 300) {
    element.style.maxHeight = element.scrollHeight + 'px';
    element.style.overflow = 'hidden';
    element.style.transition = `max-height ${duration}ms ease-out`;
    
    setTimeout(() => {
      element.style.maxHeight = '0';
    }, 10);
    
    setTimeout(() => {
      element.style.display = 'none';
      element.style.maxHeight = '';
      element.style.overflow = '';
      element.style.transition = '';
    }, duration);
  }

  slideDown(element, duration = 300) {
    element.style.display = 'block';
    element.style.maxHeight = '0';
    element.style.overflow = 'hidden';
    element.style.transition = `max-height ${duration}ms ease-out`;
    
    setTimeout(() => {
      element.style.maxHeight = element.scrollHeight + 'px';
    }, 10);
    
    setTimeout(() => {
      element.style.maxHeight = '';
      element.style.overflow = '';
      element.style.transition = '';
    }, duration);
  }

  // Copy to Clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('تم النسخ بنجاح!', 'success');
      return true;
    } catch (err) {
      this.showToast('فشل في النسخ', 'danger');
      return false;
    }
  }

  // Debounce Function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle Function
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Local Storage Helpers
  setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('Storage error:', err);
      return false;
    }
  }

  getStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
      console.error('Storage error:', err);
      return defaultValue;
    }
  }

  removeStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error('Storage error:', err);
      return false;
    }
  }
}

// Initialize UI Manager
const UI = new UIManager();

// Global helper functions for backward compatibility
window.showToast = (message, type, duration) => UI.showToast(message, type, duration);
window.showModal = (content, title) => UI.showModal(content, title);
window.showSkeleton = (container, type, count) => UI.showSkeleton(container, type, count);
window.hideSkeleton = (container) => UI.hideSkeleton(container);
window.showEmptyState = (container, icon, title, description, actionButton) => 
  UI.showEmptyState(container, icon, title, description, actionButton);
window.showLoading = (container, message) => UI.showLoading(container, message);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}