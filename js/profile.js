// Profile page functionality

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (requireAuth()) {
            loadProfile();
            setupForm();
        }
    }, 1000);
});

async function loadProfile() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        
        // Fill form
        document.getElementById('displayName').value = userData.displayName || '';
        document.getElementById('email').value = userData.email || '';
        
        // Update stats
        document.getElementById('userPoints').textContent = (userData.points || 0).toLocaleString();
        document.getElementById('joinDate').textContent = formatDate(userData.createdAt);
        
        // Calculate earned and withdrawn points
        await loadTransactionStats();
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadTransactionStats() {
    if (!currentUser) return;
    
    try {
        const transactionsSnapshot = await db.collection('transactions')
            .where('uid', '==', currentUser.uid)
            .get();
        
        let totalEarned = 0;
        let totalWithdrawn = 0;
        
        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            if (transaction.pointsDelta > 0) {
                totalEarned += transaction.pointsDelta;
            } else {
                totalWithdrawn += Math.abs(transaction.pointsDelta);
            }
        });
        
        document.getElementById('totalEarned').textContent = totalEarned.toLocaleString();
        document.getElementById('totalWithdrawn').textContent = totalWithdrawn.toLocaleString();
        
    } catch (error) {
        console.error('Error loading transaction stats:', error);
    }
}

function setupForm() {
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const newDisplayName = document.getElementById('displayName').value.trim();
    
    if (!newDisplayName) {
        showMessage('يرجى إدخال الاسم', 'error');
        return;
    }
    
    try {
        // Update in Firestore
        await db.collection('users').doc(currentUser.uid).update({
            displayName: newDisplayName
        });
        
        // Update in Firebase Auth
        await currentUser.updateProfile({
            displayName: newDisplayName
        });
        
        showMessage('تم حفظ التغييرات بنجاح', 'success');
        
        // Update UI
        const userNameElements = document.querySelectorAll('#userName');
        userNameElements.forEach(el => {
            el.textContent = newDisplayName;
        });
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('حدث خطأ أثناء حفظ التغييرات', 'error');
    }
}

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        loadProfile();
    }
});