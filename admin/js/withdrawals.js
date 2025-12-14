// Withdrawals management functionality

let currentTab = 'pending';
let withdrawalsData = {};

// Expose functions to global scope immediately
window.loadWithdrawals = loadWithdrawals;
window.switchTab = switchTab;
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.formatDate = formatDate;

document.addEventListener('DOMContentLoaded', function() {
    // Expose functions immediately
    window.loadWithdrawals = loadWithdrawals;
    window.switchTab = switchTab;
    window.approveWithdrawal = approveWithdrawal;
    window.rejectWithdrawal = rejectWithdrawal;
    window.formatDate = formatDate;
    
    setTimeout(async () => {
        try {
            const isAdmin = await requireAdmin();
            if (isAdmin) {
                loadWithdrawals();
                setupTabs();
            }
        } catch (error) {
            console.error('Error initializing withdrawals admin functions:', error);
            // Still expose functions
            window.loadWithdrawals = loadWithdrawals;
            window.switchTab = switchTab;
            window.approveWithdrawal = approveWithdrawal;
            window.rejectWithdrawal = rejectWithdrawal;
            window.formatDate = formatDate;
        }
    }, 1000);
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
}

async function loadWithdrawals() {
    try {
        const withdrawalsSnapshot = await db.collection('withdraw_requests')
            .orderBy('createdAt', 'desc')
            .get();

        withdrawalsData = {
            pending: [],
            approved: [],
            rejected: []
        };

        withdrawalsSnapshot.forEach(doc => {
            const withdrawal = {
                id: doc.id,
                ...doc.data()
            };
            
            withdrawalsData[withdrawal.status].push(withdrawal);
        });

        displayWithdrawals();
        updateStats();
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        document.getElementById('withdrawalsTableBody').innerHTML = '<tr><td colspan="7">حدث خطأ أثناء التحميل</td></tr>';
    }
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update active tab
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    displayWithdrawals();
}

function displayWithdrawals() {
    const tbody = document.getElementById('withdrawalsTableBody');
    const withdrawals = withdrawalsData[currentTab] || [];

    if (withdrawals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">لا توجد طلبات سحب</td></tr>';
        return;
    }

    tbody.innerHTML = withdrawals.map(withdrawal => `
        <tr>
            <td>${withdrawal.userName || 'مستخدم محذوف'}</td>
            <td>${withdrawal.userEmail || ''}</td>
            <td>${withdrawal.amountPoints.toLocaleString()} نقطة</td>
            <td>$${withdrawal.amountCash.toFixed(2)}</td>
            <td>${withdrawal.walletAddress}</td>
            <td>${formatDate(withdrawal.createdAt)}</td>
            <td>
                ${currentTab === 'pending' ? `
                    <button class="btn btn-small btn-success" onclick="approveWithdrawal('${withdrawal.id}')">موافقة</button>
                    <button class="btn btn-small btn-danger" onclick="rejectWithdrawal('${withdrawal.id}')">رفض</button>
                ` : `
                    <span class="status-${withdrawal.status === 'approved' ? 'approved' : 'rejected'}">
                        ${withdrawal.status === 'approved' ? 'موافق عليه' : 'مرفوض'}
                    </span>
                `}
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    document.getElementById('pendingCount').textContent = (withdrawalsData.pending || []).length;
    document.getElementById('approvedCount').textContent = (withdrawalsData.approved || []).length;
    document.getElementById('rejectedCount').textContent = (withdrawalsData.rejected || []).length;
}

async function approveWithdrawal(withdrawalId) {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟')) return;

    try {
        const withdrawalRef = db.collection('withdraw_requests').doc(withdrawalId);
        const withdrawalDoc = await withdrawalRef.get();
        const withdrawalData = withdrawalDoc.data();

        // Update withdrawal status
        await withdrawalRef.update({
            status: 'approved',
            adminNote: 'تم الموافقة والدفع',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Deduct points from user
        const userRef = db.collection('users').doc(withdrawalData.uid);
        await userRef.update({
            points: firebase.firestore.FieldValue.increment(-withdrawalData.amountPoints)
        });

        // Add transaction record
        await db.collection('transactions').add({
            uid: withdrawalData.uid,
            type: 'withdraw',
            pointsDelta: -withdrawalData.amountPoints,
            note: `سحب ${withdrawalData.method}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('تم الموافقة على الطلب بنجاح', 'success');
        loadWithdrawals();

    } catch (error) {
        console.error('Error approving withdrawal:', error);
        showMessage('حدث خطأ أثناء الموافقة على الطلب', 'error');
    }
}

async function rejectWithdrawal(withdrawalId) {
    const reason = prompt('سبب الرفض (اختياري):');
    if (reason === null) return; // User cancelled

    try {
        await db.collection('withdraw_requests').doc(withdrawalId).update({
            status: 'rejected',
            adminNote: reason || 'تم الرفض',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('تم رفض الطلب', 'success');
        loadWithdrawals();

    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        showMessage('حدث خطأ أثناء رفض الطلب', 'error');
    }
}

function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Make functions globally available
window.loadWithdrawals = loadWithdrawals;
window.switchTab = switchTab;
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.formatDate = formatDate;