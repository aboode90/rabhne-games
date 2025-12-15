// Dashboard functionality - Enhanced with UI States

let dashboardDataLoaded = false;
let transactionsUIState, withdrawsUIState;

// Initialize UI state managers
function initDashboardUI() {
    transactionsUIState = createUIState('recentTransactions');
    withdrawsUIState = createUIState('withdrawHistory');
}

// Fast dashboard data loading
async function loadDashboardData() {
    if (!currentUser || dashboardDataLoaded) return;
    
    try {
        // Show loading states
        transactionsUIState.showLoading('list', 3);
        withdrawsUIState.showLoading('list', 3);
        
        // Load user data with timeout
        const userPromise = db.collection('users').doc(currentUser.uid).get();
        const userDoc = await fetchWithTimeout(userPromise, 5000);
        const userData = userDoc.data();
        
        if (!userData) throw new Error('لم يتم العثور على بيانات المستخدم');
        
        // Update UI immediately
        updateDashboardUI(userData);
        
        // Load additional data in parallel
        await batchFirebaseOps([
            loadRecentTransactions(),
            loadWithdrawHistory()
        ]);
        
        dashboardDataLoaded = true;
        
    } catch (error) {
        console.error('Dashboard loading error:', error);
        transactionsUIState.showError();
        withdrawsUIState.showError();
        showMessage('فشل في تحميل بيانات لوحة التحكم', 'error');
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

// Fast transactions loading with state management
async function loadRecentTransactions() {
    if (!currentUser) return;
    
    try {
        const transactionsPromise = db.collection('transactions')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
            
        const snapshot = await fetchWithTimeout(transactionsPromise, 5000);

        if (snapshot.empty) {
            transactionsUIState.showEmpty('لا توجد عمليات', '📊');
            return;
        }

        const transactionsHTML = snapshot.docs.map(doc => {
            const tx = doc.data();
            const isPositive = tx.pointsDelta > 0;
            const sign = isPositive ? '+' : '';
            const badgeClass = isPositive ? 'badge-success' : 'badge-error';
            const icon = isPositive ? '📈' : '📉';

            return `
                <div class="card" style="padding: var(--space-md); margin-bottom: var(--space-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 500;">${icon} ${tx.note || 'عملية'}</div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">${formatTime(tx.createdAt)}</div>
                        </div>
                        <span class="badge ${badgeClass}">${sign}${tx.pointsDelta.toLocaleString()} نقطة</span>
                    </div>
                </div>
            `;
        }).join('');

        transactionsUIState.showData(transactionsHTML);

    } catch (error) {
        console.error('Transactions loading error:', error);
        transactionsUIState.showError('فشل في تحميل العمليات');
    }
}

// Fast withdraw history loading with state management
async function loadWithdrawHistory() {
    if (!currentUser) return;
    
    try {
        const withdrawsPromise = db.collection('withdraw_requests')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
            
        const snapshot = await fetchWithTimeout(withdrawsPromise, 5000);

        if (snapshot.empty) {
            withdrawsUIState.showEmpty('لا توجد طلبات سحب', '💰');
            return;
        }

        const withdrawsHTML = snapshot.docs.map(doc => {
            const wr = doc.data();
            const statusInfo = getStatusInfo(wr.status);

            return `
                <div class="card" style="padding: var(--space-md); margin-bottom: var(--space-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 500;">${wr.amountUSDT || wr.amountCash} USDT</div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">${formatTime(wr.createdAt)}</div>
                            ${wr.adminNote ? `<div style="font-size: 0.75rem; color: var(--text-muted);">📝 ${wr.adminNote}</div>` : ''}
                        </div>
                        <span class="badge ${statusInfo.class}">${statusInfo.icon} ${statusInfo.text}</span>
                    </div>
                </div>
            `;
        }).join('');

        withdrawsUIState.showData(withdrawsHTML);

    } catch (error) {
        console.error('Withdraws loading error:', error);
        withdrawsUIState.showError('فشل في تحميل طلبات السحب');
    }
}

// Get status info with badge classes
function getStatusInfo(status) {
    const statusMap = {
        'pending': { text: 'معلق', icon: '⏳', class: 'badge-warning' },
        'approved': { text: 'موافق', icon: '✅', class: 'badge-success' },
        'rejected': { text: 'مرفوض', icon: '❌', class: 'badge-error' },
        'paid': { text: 'مدفوع', icon: '💰', class: 'badge-success' }
    };
    
    return statusMap[status] || { text: status, icon: '❓', class: 'badge-info' };
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI state managers
    initDashboardUI();
    
    // Load immediately if user is already authenticated
    if (currentUser) {
        loadDashboardData();
    }
    
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (user && !dashboardDataLoaded) {
            setTimeout(loadDashboardData, 300);
        }
    });
});