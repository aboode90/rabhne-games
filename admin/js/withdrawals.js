// Withdrawals management functionality

let currentTab = 'pending';
let withdrawalsData = {};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        const isAdmin = await requireAdmin();
        if (isAdmin) {
            loadWithdrawals();
        }
    }, 1000);
});

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
        
        for (const doc of withdrawalsSnapshot.docs) {
            const withdraw = { id: doc.id, ...doc.data() };
            
            // Get user name
            const userDoc = await db.collection('users').doc(withdraw.uid).get();
            withdraw.userName = userDoc.exists ? userDoc.data().displayName : 'مستخدم محذوف';
            
            withdrawalsData[withdraw.status].push(withdraw);
        }
        
        updateStats();
        displayWithdrawals();
        
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        document.getElementById('withdrawalsTableBody').innerHTML = '<tr><td colspan="7">حدث خطأ أثناء التحميل</td></tr>';
    }
}

function updateStats() {
    document.getElementById('pendingCount').textContent = withdrawalsData.pending.length;
    document.getElementById('approvedCount').textContent = withdrawalsData.approved.length;
    document.getElementById('rejectedCount').textContent = withdrawalsData.rejected.length;
    
    const totalPayout = withdrawalsData.approved.reduce((sum, w) => sum + (w.amountCash || 0), 0);
    document.getElementById('totalPayout').textContent = `$${totalPayout.toFixed(2)}`;
}

function showTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    displayWithdrawals();
}

function displayWithdrawals() {
    const tbody = document.getElementById('withdrawalsTableBody');
    const withdrawals = withdrawalsData[currentTab] || [];
    
    if (withdrawals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">لا توجد طلبات</td></tr>';
        return;
    }
    
    tbody.innerHTML = withdrawals.map(withdraw => `
        <tr>
            <td>${withdraw.userName}</td>
            <td>${withdraw.amountPoints.toLocaleString()}</td>
            <td>$${withdraw.amountCash.toFixed(2)}</td>
            <td>${withdraw.method}</td>
            <td>${withdraw.account}</td>
            <td>${formatTime(withdraw.createdAt)}</td>
            <td>
                ${getActionButtons(withdraw)}
                ${withdraw.adminNote ? `<br><small>ملاحظة: ${withdraw.adminNote}</small>` : ''}
            </td>
        </tr>
    `).join('');
}

function getActionButtons(withdraw) {
    if (withdraw.status === 'pending') {
        return `
            <div class="action-buttons">
                <button class="btn btn-small btn-success" onclick="approveWithdraw('${withdraw.id}')">موافقة</button>
                <button class="btn btn-small btn-danger" onclick="rejectWithdraw('${withdraw.id}')">رفض</button>
            </div>
        `;
    }
    return `<span class="status-${withdraw.status}">${getStatusText(withdraw.status)}</span>`;
}

function getStatusText(status) {
    const statuses = {
        'pending': 'معلق',
        'approved': 'موافق عليه',
        'rejected': 'مرفوض'
    };
    return statuses[status] || status;
}

async function approveWithdraw(withdrawId) {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟\nسيتم خصم النقاط من المستخدم.')) return;
    
    try {
        const withdrawRef = db.collection('withdraw_requests').doc(withdrawId);
        const withdrawDoc = await withdrawRef.get();
        const withdrawData = withdrawDoc.data();
        
        // Check if user has enough points
        const userDoc = await db.collection('users').doc(withdrawData.uid).get();
        const userData = userDoc.data();
        
        if (userData.points < withdrawData.amountPoints) {
            showMessage('المستخدم ليس لديه نقاط كافية', 'error');
            return;
        }
        
        // Update withdrawal status
        await withdrawRef.update({
            status: 'approved',
            adminNote: 'تم الموافقة والدفع',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Deduct points from user
        await db.collection('users').doc(withdrawData.uid).update({
            points: firebase.firestore.FieldValue.increment(-withdrawData.amountPoints)
        });
        
        // Add transaction record
        await db.collection('transactions').add({
            uid: withdrawData.uid,
            type: 'withdraw',
            pointsDelta: -withdrawData.amountPoints,
            note: `سحب ${withdrawData.method} - ${withdrawData.account}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('تم الموافقة على الطلب بنجاح', 'success');
        loadWithdrawals();
        
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        showMessage('حدث خطأ أثناء الموافقة على الطلب', 'error');
    }
}

async function rejectWithdraw(withdrawId) {
    const reason = prompt('سبب الرفض:');
    if (reason === null) return;
    
    try {
        await db.collection('withdraw_requests').doc(withdrawId).update({
            status: 'rejected',
            adminNote: reason || 'تم الرفض بدون سبب محدد',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('تم رفض الطلب', 'success');
        loadWithdrawals();
        
    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        showMessage('حدث خطأ أثناء رفض الطلب', 'error');
    }
}