// Admin Panel Logic

// 1. Security Check on Load
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Double check admin status from DB
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists || !userDoc.data().isAdmin) {
            alert('⛔ غير مصرح لك بالدخول هنا!');
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('adminName').textContent = user.email;
        loadAdminDashboard();

    } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء التحقق: ' + error.message);
        window.location.href = 'index.html';
    }
});

// Load Dashboard Data
async function loadAdminDashboard() {
    loadPendingWithdrawals();
    loadAdminStats();
}

// Load Pending Withdrawals
async function loadPendingWithdrawals() {
    const tableBody = document.getElementById('withdrawalsTableBody');

    try {
        const snapshot = await db.collection('withdraw_requests')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">لا توجد طلبات معلقة ✅</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const req = doc.data();
            const date = req.createdAt ? req.createdAt.toDate().toLocaleString('ar-EG') : '---';

            html += `
                <tr>
                    <td><small>${req.uid}</small></td>
                    <td>${req.amountPoints.toLocaleString()}</td>
                    <td style="color:green; font-weight:bold">$${req.amountCash.toFixed(2)}</td>
                    <td style="direction:ltr; text-align:right; font-family:monospace">${req.account}</td>
                    <td>${date}</td>
                    <td>
                        <div class="admin-controls">
                            <button class="btn btn-success btn-small" onclick="approveWithdraw('${doc.id}', '${req.uid}', ${req.amountPoints})">✅ قبول</button>
                            <button class="btn btn-danger btn-small" onclick="rejectWithdraw('${doc.id}', '${req.uid}', ${req.amountPoints})">❌ رفض</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        document.getElementById('statsPending').textContent = snapshot.size;

    } catch (error) {
        console.error('Error loading withdrawals:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">حدث خطأ في التحميل</td></tr>';
    }
}

// Stats (Placeholder)
async function loadAdminStats() { }

// Action: Approve
window.approveWithdraw = async function (reqId, userId, points) {
    if (!confirm('تأكيد الموافقة؟ سيتم خصم النقاط نهائياً.')) return;

    try {
        await db.collection('withdraw_requests').doc(reqId).update({
            status: 'approved',
            processedAt: firebase.firestore.FieldValue.serverTimestamp(),
            adminNote: 'تم الدفع بنجاح'
        });

        alert('تمت الموافقة بنجاح ✅');
        loadPendingWithdrawals();
    } catch (error) {
        console.error(error);
        alert('حدث خطأ: ' + error.message);
    }
}

// Action: Reject
window.rejectWithdraw = async function (reqId, userId, points) {
    const reason = prompt('سبب الرفض (سيظهر للمستخدم):', 'بيانات غير صحيحة');
    if (!reason) return;

    try {
        const batch = db.batch();

        // 1. Update Request Status
        const reqRef = db.collection('withdraw_requests').doc(reqId);
        batch.update(reqRef, {
            status: 'rejected',
            processedAt: firebase.firestore.FieldValue.serverTimestamp(),
            adminNote: reason
        });

        // 2. Refund Points to User
        const userRef = db.collection('users').doc(userId);
        batch.update(userRef, {
            points: firebase.firestore.FieldValue.increment(points)
        });

        // 3. Add Transaction Log for Refund
        const transRef = db.collection('transactions').doc();
        batch.set(transRef, {
            uid: userId,
            type: 'refund',
            pointsDelta: points,
            note: `استرجاع نقاط: طلب سحب مرفوض (${reason})`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();
        alert('تم الرفض واسترجاع النقاط للمستخدم ↩️');
        loadPendingWithdrawals();

    } catch (error) {
        console.error(error);
        alert('حدث خطأ: ' + error.message);
    }
}
