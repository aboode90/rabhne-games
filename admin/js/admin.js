// Admin dashboard functionality

// Check admin access on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        const isAdmin = await requireAdmin();
        if (isAdmin) {
            loadAdminDashboard();
        }
    }, 1000);
});

// Load admin dashboard data
async function loadAdminDashboard() {
    try {
        await Promise.all([
            loadStats(),
            loadRecentActivities(),
            loadPendingWithdraws()
        ]);
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

// Load statistics
async function loadStats() {
    try {
        // Total users
        const usersSnapshot = await db.collection('users').get();
        document.getElementById('totalUsers').textContent = usersSnapshot.size;
        
        // Active users (claimed points in last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const activeUsersSnapshot = await db.collection('users')
            .where('lastClaimAt', '>=', weekAgo)
            .get();
        document.getElementById('activeUsers').textContent = activeUsersSnapshot.size;
        
        // Total games
        const gamesSnapshot = await db.collection('games').get();
        document.getElementById('totalGames').textContent = gamesSnapshot.size;
        
        // Total plays
        let totalPlays = 0;
        gamesSnapshot.forEach(doc => {
            const game = doc.data();
            totalPlays += game.plays || 0;
        });
        document.getElementById('totalPlays').textContent = totalPlays.toLocaleString();
        
        // Pending withdrawals
        const pendingSnapshot = await db.collection('withdraw_requests')
            .where('status', '==', 'pending')
            .get();
        document.getElementById('pendingWithdraws').textContent = pendingSnapshot.size;
        
        // Total payouts
        const approvedSnapshot = await db.collection('withdraw_requests')
            .where('status', '==', 'approved')
            .get();
            
        let totalPayouts = 0;
        approvedSnapshot.forEach(doc => {
            const withdraw = doc.data();
            totalPayouts += withdraw.amountCash || 0;
        });
        document.getElementById('totalPayouts').textContent = `$${totalPayouts.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const transactionsSnapshot = await db.collection('transactions')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
            
        const activitiesList = document.getElementById('recentActivities');
        
        if (transactionsSnapshot.empty) {
            activitiesList.innerHTML = '<p>لا توجد أنشطة حديثة</p>';
            return;
        }
        
        let html = '';
        for (const doc of transactionsSnapshot.docs) {
            const transaction = doc.data();
            
            // Get user name
            const userDoc = await db.collection('users').doc(transaction.uid).get();
            const userName = userDoc.exists ? userDoc.data().displayName : 'مستخدم محذوف';
            
            const sign = transaction.pointsDelta > 0 ? '+' : '';
            const color = transaction.pointsDelta > 0 ? 'green' : 'red';
            
            html += `
                <div class="activity-item">
                    <div>
                        <strong>${userName}</strong> - ${transaction.note}
                        <br><small>${formatTime(transaction.createdAt)}</small>
                    </div>
                    <div style="color: ${color}; font-weight: bold;">
                        ${sign}${transaction.pointsDelta} نقطة
                    </div>
                </div>
            `;
        }
        
        activitiesList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading recent activities:', error);
        document.getElementById('recentActivities').innerHTML = '<p>حدث خطأ أثناء التحميل</p>';
    }
}

// Load pending withdrawals
async function loadPendingWithdraws() {
    try {
        const pendingSnapshot = await db.collection('withdraw_requests')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
            
        const pendingList = document.getElementById('pendingWithdrawsList');
        
        if (pendingSnapshot.empty) {
            pendingList.innerHTML = '<p>لا توجد طلبات سحب معلقة</p>';
            return;
        }
        
        let html = '';
        for (const doc of pendingSnapshot.docs) {
            const withdraw = doc.data();
            
            // Get user name
            const userDoc = await db.collection('users').doc(withdraw.uid).get();
            const userName = userDoc.exists ? userDoc.data().displayName : 'مستخدم محذوف';
            
            html += `
                <div class="withdraw-item">
                    <div>
                        <strong>${userName}</strong>
                        <br>${withdraw.amountPoints.toLocaleString()} نقطة ($${withdraw.amountCash.toFixed(2)})
                        <br><small>${withdraw.method} - ${formatTime(withdraw.createdAt)}</small>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-success" onclick="approveWithdraw('${doc.id}')">موافقة</button>
                        <button class="btn btn-small btn-danger" onclick="rejectWithdraw('${doc.id}')">رفض</button>
                    </div>
                </div>
            `;
        }
        
        pendingList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading pending withdrawals:', error);
        document.getElementById('pendingWithdrawsList').innerHTML = '<p>حدث خطأ أثناء التحميل</p>';
    }
}

// Approve withdrawal
async function approveWithdraw(withdrawId) {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟')) return;
    
    try {
        const withdrawRef = db.collection('withdraw_requests').doc(withdrawId);
        const withdrawDoc = await withdrawRef.get();
        const withdrawData = withdrawDoc.data();
        
        // Update withdrawal status
        await withdrawRef.update({
            status: 'approved',
            adminNote: 'تم الموافقة والدفع',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Deduct points from user
        const userRef = db.collection('users').doc(withdrawData.uid);
        await userRef.update({
            points: firebase.firestore.FieldValue.increment(-withdrawData.amountPoints)
        });
        
        // Add transaction record
        await db.collection('transactions').add({
            uid: withdrawData.uid,
            type: 'withdraw',
            pointsDelta: -withdrawData.amountPoints,
            note: `سحب ${withdrawData.method}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('تم الموافقة على الطلب بنجاح', 'success');
        loadPendingWithdraws();
        loadStats();
        
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        showMessage('حدث خطأ أثناء الموافقة على الطلب', 'error');
    }
}

// Reject withdrawal
async function rejectWithdraw(withdrawId) {
    const reason = prompt('سبب الرفض (اختياري):');
    if (reason === null) return; // User cancelled
    
    try {
        await db.collection('withdraw_requests').doc(withdrawId).update({
            status: 'rejected',
            adminNote: reason || 'تم الرفض',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('تم رفض الطلب', 'success');
        loadPendingWithdraws();
        loadStats();
        
    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        showMessage('حدث خطأ أثناء رفض الطلب', 'error');
    }
}