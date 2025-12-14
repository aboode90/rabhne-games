// Withdraw page functionality

// Real-time listener for stats
let statsUnsubscribe = null;

async function setupRealtimeStats() {
    if (!currentUser) return;

    // Stop previous listener if exists
    if (statsUnsubscribe) {
        statsUnsubscribe();
    }

    // Start new listener
    statsUnsubscribe = db.collection('users').doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                updateWithdrawStats(userData);
            }
        }, (error) => {
            console.error('Error listening to stats:', error);
        });

    // Also load history once
    loadWithdrawHistory();
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

// Load withdraw history
async function loadWithdrawHistory() {
    if (!currentUser) return;

    try {
        const withdrawsSnapshot = await db.collection('withdraw_requests')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const historyList = document.getElementById('withdrawHistoryList');

        if (withdrawsSnapshot.empty) {
            historyList.innerHTML = '<p>لا توجد طلبات سحب سابقة</p>';
            return;
        }

        let html = '';
        withdrawsSnapshot.forEach(doc => {
            const withdraw = doc.data();
            const statusClass = `status-${withdraw.status}`;
            const statusText = getStatusText(withdraw.status);

            html += `
                <div class="withdraw-item">
                    <div class="withdraw-details">
                        <h4>${withdraw.amountPoints.toLocaleString()} نقطة</h4>
                        <p><strong>الطريقة:</strong> ${withdraw.method}</p>
                        <p><strong>المحفظة:</strong> ${withdraw.account}</p>
                        <p><strong>التاريخ:</strong> ${formatTime(withdraw.createdAt)}</p>
                        ${withdraw.adminNote ? `<p style="margin-top:5px; color:#e74c3c;"><strong>ملاحظة الإدارة:</strong> ${withdraw.adminNote}</p>` : ''}
                    </div>
                    <div class="withdraw-status">
                        <span class="${statusClass}">${statusText}</span>
                        <div class="withdraw-amount">$${withdraw.amountCash.toFixed(2)}</div>
                    </div>
                </div>
            `;
        });

        historyList.innerHTML = html;

    } catch (error) {
        console.error('Error loading withdraw history:', error);
        document.getElementById('withdrawHistoryList').innerHTML = '<p>حدث خطأ أثناء التحميل</p>';
    }
}

// Get status text in Arabic
function getStatusText(status) {
    const statuses = {
        'pending': 'قيد المراجعة',
        'approved': 'تم الموافقة',
        'rejected': 'مرفوض'
    };

    return statuses[status] || status;
}

// Initialize withdraw page
document.addEventListener('DOMContentLoaded', function () {
    // Wait for auth to initialize
    setTimeout(() => {
        if (requireAuth()) {
            setupRealtimeStats();
        }
    }, 1000);

    // Add event listeners
    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', submitWithdrawRequest);
    }

    const withdrawPoints = document.getElementById('withdrawPoints');
    if (withdrawPoints) {
        withdrawPoints.addEventListener('input', calculateCash);
    }
});

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        setupRealtimeStats();
    }
});