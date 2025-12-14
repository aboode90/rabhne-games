// Dashboard functionality

// Load dashboard data
async function loadDashboardData() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        // Update user info
        document.getElementById('dashboardUserName').textContent = userData.displayName;
        document.getElementById('userPoints').textContent = userData.points || 0;

        // Calculate daily points
        const today = new Date().toDateString();
        const lastClaim = userData.lastClaimAt ? userData.lastClaimAt.toDate() : null;
        const lastClaimDate = lastClaim ? lastClaim.toDateString() : null;
        const dailyPoints = (lastClaimDate === today) ? (userData.dailyPoints || 0) : 0;

        document.getElementById('dailyPoints').textContent = dailyPoints;

        // Calculate cash value
        const cashValue = (userData.points || 0) / APP_CONFIG.POINTS_TO_DOLLAR;
        document.getElementById('cashValue').textContent = `$${cashValue.toFixed(2)}`;

        // Load recent data
        loadRecentTransactions();
        loadWithdrawHistory();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load recent transactions
async function loadRecentTransactions() {
    if (!currentUser) return;

    try {
        const transactionsSnapshot = await db.collection('transactions')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        const transactionsList = document.getElementById('recentTransactions');

        if (transactionsSnapshot.empty) {
            transactionsList.innerHTML = '<p>لا توجد عمليات حديثة</p>';
            return;
        }

        let html = '';
        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            const sign = transaction.pointsDelta > 0 ? '+' : '';
            const color = transaction.pointsDelta > 0 ? 'green' : 'red';

            html += `
                <div class="transaction-item">
                    <div>
                        <strong>${transaction.note}</strong>
                        <br><small>${formatTime(transaction.createdAt)}</small>
                    </div>
                    <div style="color: ${color}; font-weight: bold;">
                        ${sign}${transaction.pointsDelta} نقطة
                    </div>
                </div>
            `;
        });

        transactionsList.innerHTML = html;

    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('recentTransactions').innerHTML = '<p>حدث خطأ أثناء التحميل</p>';
    }
}

// Load withdraw history
async function loadWithdrawHistory() {
    if (!currentUser) return;

    try {
        const withdrawsSnapshot = await db.collection('withdraw_requests')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        const withdrawList = document.getElementById('withdrawHistory');

        if (withdrawsSnapshot.empty) {
            withdrawList.innerHTML = '<p>لا توجد طلبات سحب</p>';
            return;
        }

        let html = '';
        withdrawsSnapshot.forEach(doc => {
            const withdraw = doc.data();
            const statusClass = `status-${withdraw.status}`;
            const statusText = getStatusText(withdraw.status);

            html += `
                <div class="withdraw-item">
                    <div>
                        <strong>${withdraw.amountPoints} نقطة</strong>
                        <br><small>${withdraw.method} - ${formatTime(withdraw.createdAt)}</small>
                        ${withdraw.adminNote ? `<br><small>ملاحظة: ${withdraw.adminNote}</small>` : ''}
                    </div>
                    <div>
                        <span class="${statusClass}">${statusText}</span>
                        <br><small>$${withdraw.amountCash.toFixed(2)}</small>
                    </div>
                </div>
            `;
        });

        withdrawList.innerHTML = html;

    } catch (error) {
        console.error('Error loading withdraw history:', error);
        document.getElementById('withdrawHistory').innerHTML = '<p>حدث خطأ أثناء التحميل</p>';
    }
}

// Get status text in Arabic
function getStatusText(status) {
    const statuses = {
        'pending': 'معلق',
        'approved': 'موافق عليه',
        'rejected': 'مرفوض'
    };

    return statuses[status] || status;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    // Check if auth is already ready
    if (currentUser) {
        loadDashboardData();
    }
});

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        loadDashboardData();
    }
});