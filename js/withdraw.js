// Withdraw page functionality - Enhanced with UI States

let withdrawHistoryUIState;
let withdrawDataLoaded = false;

// Initialize UI state managers
function initWithdrawUI() {
    withdrawHistoryUIState = createUIState('withdrawHistoryList');
}

// Fast withdraw data loading
async function loadWithdrawData() {
    if (!currentUser || withdrawDataLoaded) return;
    
    try {
        // Show loading state
        withdrawHistoryUIState.showLoading('list', 5);
        
        // Load user stats and history in parallel
        const [userDoc, historySnapshot] = await batchFirebaseOps([
            db.collection('users').doc(currentUser.uid).get(),
            db.collection('withdraw_requests')
                .where('uid', '==', currentUser.uid)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get()
        ]);
        
        // Update stats
        if (userDoc.exists) {
            updateWithdrawStats(userDoc.data());
        }
        
        // Display history
        displayWithdrawHistory(historySnapshot);
        
        withdrawDataLoaded = true;
        
    } catch (error) {
        console.error('Withdraw data loading error:', error);
        withdrawHistoryUIState.showError('فشل في تحميل بيانات السحب');
    }
}

function updateWithdrawStats(userData) {
    const points = userData.points || 0;

    // Update Points Display
    const pointsEl = document.getElementById('userPoints');
    if (pointsEl) {
        pointsEl.textContent = points.toLocaleString();
    }

    // Update Cash Value Display (10000 pts = $1)
    const cashValue = points / APP_CONFIG.POINTS_TO_DOLLAR;
    const cashEl = document.getElementById('cashValue');
    if (cashEl) {
        cashEl.textContent = `$${cashValue.toFixed(2)}`;
    }

    // Update Input Limits
    const inputEl = document.getElementById('withdrawPoints');
    if (inputEl) {
        inputEl.max = points;
    }
}

// Calculate cash value when points change in input
function calculateCash() {
    const points = parseInt(document.getElementById('withdrawPoints').value) || 0;
    const cashValue = points / APP_CONFIG.POINTS_TO_DOLLAR;
    document.getElementById('calculatedCash').textContent = cashValue.toFixed(2);
}

// Submit withdraw request
async function submitWithdrawRequest(e) {
    e.preventDefault();

    const points = parseInt(document.getElementById('withdrawPoints').value);
    const method = document.getElementById('withdrawMethod').value;
    const account = document.getElementById('withdrawAccount').value;

    if (!points || !method || !account) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitWithdraw');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإرسال...';

    try {
        const success = await submitWithdraw(points, method, account);

        if (success) {
            // Reset form
            document.getElementById('withdrawForm').reset();
            document.getElementById('calculatedCash').textContent = '0.00';

            // Reload data (not strictly needed with realtime, but good for reset)
            // setupRealtimeStats(); 
        }

    } catch (error) {
        console.error('Error submitting withdraw:', error);
        showMessage('حدث خطأ أثناء إرسال الطلب', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'إرسال طلب السحب';
    }
}

// Display withdraw history with state management
function displayWithdrawHistory(snapshot) {
    if (snapshot.empty) {
        withdrawHistoryUIState.showEmpty('لا توجد طلبات سحب', '💰', {
            text: 'إنشاء طلب جديد',
            action: 'document.getElementById("withdrawAmount").focus()'
        });
        return;
    }

    const historyHTML = snapshot.docs.map(doc => {
        const wr = doc.data();
        const statusInfo = getStatusInfo(wr.status);
        const amount = wr.amountUSDT || wr.amountCash || (wr.amountPoints / 10000);

        return `
            <div class="card" style="margin-bottom: var(--space-md);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: var(--space-sm);">
                            $${amount.toFixed(2)} USDT
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-xs);">
                            📅 ${formatTime(wr.createdAt)}
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-xs);">
                            🏦 ${(wr.walletTRC20 || wr.account || '').substring(0, 20)}...
                        </div>
                        ${wr.adminNote ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-sm);">📝 ${wr.adminNote}</div>` : ''}
                    </div>
                    <div style="text-align: left;">
                        <span class="badge ${statusInfo.class}">${statusInfo.icon} ${statusInfo.text}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    withdrawHistoryUIState.showData(historyHTML);
}

// Get status info with badge classes
function getStatusInfo(status) {
    const statusMap = {
        'pending': { text: 'قيد المراجعة', icon: '⏳', class: 'badge-warning' },
        'approved': { text: 'موافق عليه', icon: '✅', class: 'badge-success' },
        'rejected': { text: 'مرفوض', icon: '❌', class: 'badge-error' },
        'paid': { text: 'مدفوع', icon: '💰', class: 'badge-success' }
    };
    
    return statusMap[status] || { text: status, icon: '❓', class: 'badge-info' };
}

// Initialize withdraw page
document.addEventListener('DOMContentLoaded', function () {
    // Initialize UI state managers
    initWithdrawUI();
    
    // Load data if user is already authenticated
    if (currentUser) {
        loadWithdrawData();
    }
    
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (user && !withdrawDataLoaded) {
            setTimeout(loadWithdrawData, 300);
        }
    });
});