// Dashboard functionality - Optimized

let dashboardDataLoaded = false;

// Optimized dashboard data loading
async function loadDashboardData() {
    if (!currentUser || dashboardDataLoaded) return;
    
    try {
        // Use cached user data if available
        let userData = getCachedUserData();
        
        if (!userData) {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            userData = userDoc.data();
        }
        
        if (!userData) return;
        
        // Update user info immediately
        updateDashboardUI(userData);
        
        // Load additional data in background
        loadAdditionalData();
        
        dashboardDataLoaded = true;
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('حدث خطأ في تحميل البيانات', 'error');
    }
}

// Update dashboard UI with user data
function updateDashboardUI(userData) {
    // Update user name
    const dashboardUserName = document.getElementById('dashboardUserName');
    if (dashboardUserName) {
        dashboardUserName.textContent = userData.displayName || 'المستخدم';
    }
    
    // Update points
    const userPoints = document.getElementById('userPoints');
    if (userPoints) {
        userPoints.textContent = (userData.points || 0).toLocaleString();
    }
    
    // Calculate and update daily points
    const today = new Date().toDateString();
    const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate() : null;
    const lastClaimDate = lastClaim ? lastClaim.toDateString() : null;
    const dailyPoints = (lastClaimDate === today) ? (userData.dailyPoints || 0) : 0;
    
    const dailyPointsEl = document.getElementById('dailyPoints');
    if (dailyPointsEl) {
        dailyPointsEl.textContent = dailyPoints.toLocaleString();
    }
    
    // Calculate cash value
    const cashValue = (userData.points || 0) / 10000;
    const cashValueEl = document.getElementById('cashValue');
    if (cashValueEl) {
        cashValueEl.textContent = `$${cashValue.toFixed(2)}`;
    }
    
    // Calculate remaining daily points
    const remainingDaily = Math.max(0, 2880 - dailyPoints);
    const remainingDailyEl = document.getElementById('remainingDaily');
    if (remainingDailyEl) {
        remainingDailyEl.textContent = remainingDaily.toLocaleString();
    }
}

// Load additional data in background
async function loadAdditionalData() {
    // Load both in parallel for better performance
    const [transactions, withdraws] = await Promise.allSettled([
        loadRecentTransactions(),
        loadWithdrawHistory()
    ]);
    
    if (transactions.status === 'rejected') {
        console.error('Failed to load transactions:', transactions.reason);
    }
    
    if (withdraws.status === 'rejected') {
        console.error('Failed to load withdraws:', withdraws.reason);
    }
}

// Optimized transactions loading
async function loadRecentTransactions() {
    if (!currentUser) return;
    
    const transactionsList = document.getElementById('recentTransactions');
    if (!transactionsList) return;
    
    try {
        // Check cache first
        const cacheKey = `transactions_${currentUser.uid}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
        const now = Date.now();
        
        // Use cache if less than 1 minute old
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 60000) {
            transactionsList.innerHTML = cachedData;
            return;
        }
        
        const transactionsSnapshot = await db.collection('transactions')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        if (transactionsSnapshot.empty) {
            const html = '<div class="no-data">📊 لا توجد عمليات حديثة</div>';
            transactionsList.innerHTML = html;
            return;
        }

        let html = '';
        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            const sign = transaction.pointsDelta > 0 ? '+' : '';
            const color = transaction.pointsDelta > 0 ? '#27ae60' : '#e74c3c';
            const icon = transaction.pointsDelta > 0 ? '📈' : '📉';

            html += `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-note">${icon} ${transaction.note}</div>
                        <div class="transaction-time">${formatTime(transaction.createdAt)}</div>
                    </div>
                    <div class="transaction-amount" style="color: ${color};">
                        ${sign}${transaction.pointsDelta.toLocaleString()} نقطة
                    </div>
                </div>
            `;
        });

        transactionsList.innerHTML = html;
        
        // Cache the result
        sessionStorage.setItem(cacheKey, html);
        sessionStorage.setItem(`${cacheKey}_time`, now.toString());

    } catch (error) {
        console.error('Error loading transactions:', error);
        transactionsList.innerHTML = '<div class="error-message">⚠️ حدث خطأ في تحميل العمليات</div>';
    }
}

// Optimized withdraw history loading
async function loadWithdrawHistory() {
    if (!currentUser) return;
    
    const withdrawList = document.getElementById('withdrawHistory');
    if (!withdrawList) return;
    
    try {
        // Check cache first
        const cacheKey = `withdraws_${currentUser.uid}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
        const now = Date.now();
        
        // Use cache if less than 1 minute old
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 60000) {
            withdrawList.innerHTML = cachedData;
            return;
        }
        
        const withdrawsSnapshot = await db.collection('withdraw_requests')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        if (withdrawsSnapshot.empty) {
            const html = '<div class="no-data">💰 لا توجد طلبات سحب</div>';
            withdrawList.innerHTML = html;
            return;
        }

        let html = '';
        withdrawsSnapshot.forEach(doc => {
            const withdraw = doc.data();
            const statusInfo = getStatusInfo(withdraw.status);

            html += `
                <div class="withdraw-item">
                    <div class="withdraw-info">
                        <div class="withdraw-amount">${withdraw.amountPoints.toLocaleString()} نقطة</div>
                        <div class="withdraw-method">${withdraw.method} - ${formatTime(withdraw.createdAt)}</div>
                        ${withdraw.adminNote ? `<div class="withdraw-note">📝 ${withdraw.adminNote}</div>` : ''}
                    </div>
                    <div class="withdraw-status">
                        <span class="status-badge ${statusInfo.class}">${statusInfo.icon} ${statusInfo.text}</span>
                        <div class="withdraw-cash">$${withdraw.amountCash.toFixed(2)}</div>
                    </div>
                </div>
            `;
        });

        withdrawList.innerHTML = html;
        
        // Cache the result
        sessionStorage.setItem(cacheKey, html);
        sessionStorage.setItem(`${cacheKey}_time`, now.toString());

    } catch (error) {
        console.error('Error loading withdraw history:', error);
        withdrawList.innerHTML = '<div class="error-message">⚠️ حدث خطأ في تحميل طلبات السحب</div>';
    }
}

// Get status info with icon and styling
function getStatusInfo(status) {
    const statusMap = {
        'pending': { text: 'معلق', icon: '⏳', class: 'status-pending' },
        'approved': { text: 'موافق عليه', icon: '✅', class: 'status-approved' },
        'rejected': { text: 'مرفوض', icon: '❌', class: 'status-rejected' }
    };
    
    return statusMap[status] || { text: status, icon: '❓', class: 'status-unknown' };
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load immediately if user is already authenticated
    if (currentUser) {
        loadDashboardData();
    }
    
    // Also listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (user && !dashboardDataLoaded) {
            setTimeout(loadDashboardData, 500);
        }
    });
});