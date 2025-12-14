// Users management functionality

let allUsers = [];

// Expose functions to global scope immediately
window.loadUsers = loadUsers;
window.setupSearch = setupSearch;
window.setupForms = setupForms;
window.showAddPoints = showAddPoints;
window.removePoints = removePoints;
window.toggleBlock = toggleBlock;
window.closeModal = closeModal;
window.formatDate = formatDate;

document.addEventListener('DOMContentLoaded', function () {
    // Expose functions immediately
    window.loadUsers = loadUsers;
    window.setupSearch = setupSearch;
    window.setupForms = setupForms;
    window.showAddPoints = showAddPoints;
    window.removePoints = removePoints;
    window.toggleBlock = toggleBlock;
    window.closeModal = closeModal;
    window.formatDate = formatDate;
    
    setTimeout(async () => {
        try {
            const isAdmin = await requireAdmin();
            if (isAdmin) {
                loadUsers();
                setupSearch();
                setupForms();
            }
        } catch (error) {
            console.error('Error initializing users admin functions:', error);
            // Still expose functions
            window.loadUsers = loadUsers;
            window.setupSearch = setupSearch;
            window.setupForms = setupForms;
            window.showAddPoints = showAddPoints;
            window.removePoints = removePoints;
            window.toggleBlock = toggleBlock;
            window.closeModal = closeModal;
            window.formatDate = formatDate;
        }
    }, 1000);
});

async function loadUsers() {
    try {
        const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();

        allUsers = [];
        usersSnapshot.forEach(doc => {
            allUsers.push({
                id: doc.id,
                ...doc.data()
            });
        });

        displayUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6">حدث خطأ أثناء التحميل</td></tr>';
    }
}

function displayUsers() {
    const tbody = document.getElementById('usersTableBody');
    const searchTerm = document.getElementById('searchUsers')?.value.toLowerCase() || '';

    // Filter users based on search term
    let filteredUsers = allUsers;
    if (searchTerm) {
        filteredUsers = allUsers.filter(user => 
            (user.displayName && user.displayName.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.id && user.id.toLowerCase().includes(searchTerm))
        );
    }

    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">لا توجد مستخدمين</td></tr>';
        return;
    }

    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>
                ${user.displayName || 'غير محدد'}
                <br><small style="color: #666; font-size: 0.8em;">ID: ${user.id}</small>
            </td>
            <td>${user.email}</td>
            <td>${(user.points || 0).toLocaleString()}</td>
            <td>${user.lastClaimAt ? formatDate(user.lastClaimAt) : 'لم يلعب بعد'}</td>
            <td>
                <span class="${user.blocked ? 'status-rejected' : 'status-approved'}">
                    ${user.blocked ? 'محظور' : 'نشط'}
                </span>
                ${user.isAdmin ? '<br><small>مدير</small>' : ''}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-primary" onclick="showAddPoints('${user.id}', '${user.displayName}')">إضافة نقاط</button>
                    <button class="btn btn-small btn-warning" onclick="removePoints('${user.id}')">خصم نقاط</button>
                    <button class="btn btn-small ${user.blocked ? 'btn-success' : 'btn-danger'}" 
                            onclick="toggleBlock('${user.id}', ${user.blocked})">
                        ${user.blocked ? 'إلغاء الحظر' : 'حظر'}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupSearch() {
    const searchInput = document.getElementById('searchUsers');
    if (searchInput) {
        searchInput.addEventListener('input', displayUsers);
    }
}

function setupForms() {
    const addPointsForm = document.getElementById('addPointsForm');
    if (addPointsForm) {
        addPointsForm.addEventListener('submit', handleAddPoints);
    }
}

function showAddPoints(userId, userName) {
    document.getElementById('userId').value = userId;
    document.getElementById('pointsUserName').textContent = userName;
    document.getElementById('addPointsModal').style.display = 'block';
}

async function handleAddPoints(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const points = parseInt(document.getElementById('pointsAmount').value);
    const reason = document.getElementById('pointsReason').value;

    if (!userId || isNaN(points) || points <= 0 || !reason) {
        showMessage('يرجى ملء جميع الحقول بشكل صحيح', 'error');
        return;
    }

    try {
        await db.collection('users').doc(userId).update({
            points: firebase.firestore.FieldValue.increment(points)
        });

        await db.collection('transactions').add({
            uid: userId,
            type: 'earn',
            pointsDelta: points,
            note: `إضافة من الإدارة: ${reason}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage(`تم إضافة ${points} نقطة بنجاح`, 'success');
        closeModal('addPointsModal');
        loadUsers();

    } catch (error) {
        console.error('Error adding points:', error);
        showMessage('حدث خطأ أثناء إضافة النقاط', 'error');
    }
}

async function removePoints(userId) {
    const points = prompt('عدد النقاط المراد خصمها:');
    if (!points || isNaN(points)) return;

    const reason = prompt('سبب الخصم:');
    if (!reason) return;

    try {
        await db.collection('users').doc(userId).update({
            points: firebase.firestore.FieldValue.increment(-parseInt(points))
        });

        await db.collection('transactions').add({
            uid: userId,
            type: 'withdraw',
            pointsDelta: -parseInt(points),
            note: `خصم من الإدارة: ${reason}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage(`تم خصم ${points} نقطة بنجاح`, 'success');
        loadUsers();

    } catch (error) {
        console.error('Error removing points:', error);
        showMessage('حدث خطأ أثناء خصم النقاط', 'error');
    }
}

async function toggleBlock(userId, isBlocked) {
    const action = isBlocked ? 'إلغاء الحظر' : 'حظر';
    if (!confirm(`هل أنت متأكد من ${action} هذا المستخدم؟`)) return;

    try {
        await db.collection('users').doc(userId).update({
            blocked: !isBlocked
        });

        showMessage(`تم ${action} المستخدم بنجاح`, 'success');
        loadUsers();

    } catch (error) {
        console.error('Error toggling block:', error);
        showMessage(`حدث خطأ أثناء ${action} المستخدم`, 'error');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Make functions globally available
window.loadUsers = loadUsers;
window.setupSearch = setupSearch;
window.setupForms = setupForms;
window.showAddPoints = showAddPoints;
window.removePoints = removePoints;
window.toggleBlock = toggleBlock;
window.closeModal = closeModal;
window.formatDate = formatDate;