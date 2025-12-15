// UI State Management System
class UIStateManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentState = 'loading';
  }

  // Show loading state with skeleton
  showLoading(type = 'cards', count = 8) {
    if (!this.container) return;
    
    this.currentState = 'loading';
    let skeletonHTML = '';
    
    if (type === 'cards') {
      for (let i = 0; i < count; i++) {
        skeletonHTML += `
          <div class="card skeleton skeleton-card">
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        `;
      }
    } else if (type === 'table') {
      skeletonHTML = `
        <div class="table-container">
          <table class="table">
            <tbody>
              ${Array(count).fill().map(() => `
                <tr>
                  <td><div class="skeleton skeleton-text"></div></td>
                  <td><div class="skeleton skeleton-text short"></div></td>
                  <td><div class="skeleton skeleton-text short"></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (type === 'list') {
      for (let i = 0; i < count; i++) {
        skeletonHTML += `<div class="skeleton skeleton-row"></div>`;
      }
    }
    
    this.container.innerHTML = skeletonHTML;
  }

  // Show empty state
  showEmpty(message = 'لا توجد بيانات', icon = '📭', actionButton = null) {
    if (!this.container) return;
    
    this.currentState = 'empty';
    let actionHTML = '';
    
    if (actionButton) {
      actionHTML = `<button class="btn btn-primary" onclick="${actionButton.action}">${actionButton.text}</button>`;
    }
    
    this.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <h3 class="empty-state-title">${message}</h3>
        <p class="empty-state-description">لا توجد عناصر للعرض حالياً</p>
        ${actionHTML}
      </div>
    `;
  }

  // Show data
  showData(html) {
    if (!this.container) return;
    
    this.currentState = 'data';
    this.container.innerHTML = html;
  }

  // Show error state
  showError(message = 'حدث خطأ في تحميل البيانات') {
    if (!this.container) return;
    
    this.currentState = 'error';
    this.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">خطأ في التحميل</h3>
        <p class="empty-state-description">${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">إعادة المحاولة</button>
      </div>
    `;
  }

  getCurrentState() {
    return this.currentState;
  }
}

// Global utility functions
window.createUIState = (containerId) => new UIStateManager(containerId);

// Fast data fetcher with timeout and error handling
window.fetchWithTimeout = async (promise, timeoutMs = 10000) => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('انتهت مهلة التحميل')), timeoutMs)
  );
  
  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Batch Firebase operations
window.batchFirebaseOps = async (operations) => {
  try {
    const results = await Promise.all(operations);
    return results;
  } catch (error) {
    console.error('Batch operation failed:', error);
    throw error;
  }
};