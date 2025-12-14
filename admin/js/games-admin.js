// Games management functionality

let allGames = [];

// Expose functions to global scope immediately
window.showAddGame = showAddGame;
window.closeModal = closeModal;
window.toggleGame = toggleGame;
window.editGame = editGame;
window.deleteGame = deleteGame;

// Check admin access on page load
document.addEventListener('DOMContentLoaded', function() {
    // Expose functions immediately
    window.showAddGame = showAddGame;
    window.closeModal = closeModal;
    window.toggleGame = toggleGame;
    window.editGame = editGame;
    window.deleteGame = deleteGame;
    
    console.log('Games admin page loaded');
    
    // Wait for Firebase auth
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                
                if (userData && userData.isAdmin === true) {
                    loadGames();
                    setupForms();
                } else {
                    showMessage('ليس لديك صلاحية للوصول لهذه الصفحة', 'error');
                }
            } catch (error) {
                console.error('Error checking admin:', error);
                showMessage('حدث خطأ في التحقق', 'error');
            }
        } else {
            showMessage('يجب تسجيل الدخول', 'error');
        }
    });
});

async function loadGames() {
    try {
        console.log('Loading games from database...');
        const gamesSnapshot = await db.collection('games')
            .orderBy('createdAt', 'desc')
            .get();
        
        console.log('Games loaded:', gamesSnapshot.size);
        allGames = [];
        gamesSnapshot.forEach(doc => {
            allGames.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayGames();
        
    } catch (error) {
        console.error('Error loading games:', error);
        showMessage('حدث خطأ أثناء تحميل الألعاب: ' + error.message, 'error');
        document.getElementById('gamesTableBody').innerHTML = '<tr><td colspan="6">حدث خطأ أثناء التحميل: ' + error.message + '</td></tr>';
    }
}

function displayGames() {
    const tbody = document.getElementById('gamesTableBody');
    
    console.log('Displaying games, count:', allGames.length);
    
    if (allGames.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">لا توجد ألعاب</td></tr>';
        return;
    }
    
    tbody.innerHTML = allGames.map(game => `
        <tr>
            <td>
                <img src="${game.thumbnailUrl}" alt="${game.title}" 
                     style="width: 60px; height: 45px; object-fit: cover; border-radius: 5px;"
                     onerror="this.src='https://via.placeholder.com/60x45?text=Game'">
            </td>
            <td>
                <strong>${game.title}</strong><br>
                <small>/${game.slug}</small>
            </td>
            <td>${getCategoryName(game.category)}</td>
            <td>${(game.plays || 0).toLocaleString()}</td>
            <td>
                <span class="${game.active ? 'status-approved' : 'status-rejected'}">
                    ${game.active ? 'نشطة' : 'معطلة'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small ${game.active ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleGame('${game.id}', ${game.active})">
                        ${game.active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button class="btn btn-small btn-primary" onclick="editGame('${game.id}')">تعديل</button>
                    <button class="btn btn-small btn-danger" onclick="deleteGame('${game.id}')">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupForms() {
    const form = document.getElementById('addGameForm');
    if (form) {
        form.addEventListener('submit', handleAddGame);
    }
    
    // Auto-generate slug from title
    const titleInput = document.getElementById('gameTitle');
    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            const slug = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            const slugInput = document.getElementById('gameSlug');
            if (slugInput) {
                slugInput.value = slug;
            }
        });
    }
}

function showAddGame() {
    console.log('Showing add game modal');
    const form = document.getElementById('addGameForm');
    const modal = document.getElementById('addGameModal');
    
    if (form) form.reset();
    if (modal) modal.style.display = 'block';
}

async function handleAddGame(e) {
    e.preventDefault();
    
    const gameData = {
        title: document.getElementById('gameTitle').value,
        slug: document.getElementById('gameSlug').value,
        iframeUrl: document.getElementById('gameIframe').value,
        thumbnailUrl: document.getElementById('gameThumbnail').value,
        category: document.getElementById('gameCategory').value,
        active: document.getElementById('gameActive').checked,
        plays: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Check if slug already exists
        const existingGame = await db.collection('games')
            .where('slug', '==', gameData.slug)
            .get();
            
        if (!existingGame.empty) {
            showMessage('هذا المعرف مستخدم بالفعل', 'error');
            return;
        }
        
        await db.collection('games').add(gameData);
        
        showMessage('تم إضافة اللعبة بنجاح', 'success');
        closeModal('addGameModal');
        loadGames();
        
    } catch (error) {
        console.error('Error adding game:', error);
        showMessage('حدث خطأ أثناء إضافة اللعبة: ' + error.message, 'error');
    }
}

async function toggleGame(gameId, isActive) {
    const action = isActive ? 'تعطيل' : 'تفعيل';
    if (!confirm(`هل أنت متأكد من ${action} هذه اللعبة؟`)) return;
    
    try {
        await db.collection('games').doc(gameId).update({
            active: !isActive
        });
        
        showMessage(`تم ${action} اللعبة بنجاح`, 'success');
        loadGames();
        
    } catch (error) {
        console.error('Error toggling game:', error);
        showMessage(`حدث خطأ أثناء ${action} اللعبة: ' + error.message, 'error');
    }
}

async function deleteGame(gameId) {
    if (!confirm('هل أنت متأكد من حذف هذه اللعبة؟\nلا يمكن التراجع عن هذا الإجراء.')) return;
    
    try {
        await db.collection('games').doc(gameId).delete();
        
        showMessage('تم حذف اللعبة بنجاح', 'success');
        loadGames();
        
    } catch (error) {
        console.error('Error deleting game:', error);
        showMessage('حدث خطأ أثناء حذف اللعبة: ' + error.message, 'error');
    }
}

function editGame(gameId) {
    const game = allGames.find(g => g.id === gameId);
    if (!game) return;
    
    // Fill form with existing data
    document.getElementById('gameTitle').value = game.title;
    document.getElementById('gameSlug').value = game.slug;
    document.getElementById('gameIframe').value = game.iframeUrl;
    document.getElementById('gameThumbnail').value = game.thumbnailUrl;
    document.getElementById('gameCategory').value = game.category;
    document.getElementById('gameActive').checked = game.active;
    
    // Change form to edit mode
    const form = document.getElementById('addGameForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        await updateGame(gameId);
    };
    
    document.querySelector('#addGameModal h2').textContent = 'تعديل اللعبة';
    document.querySelector('#addGameForm button').textContent = 'حفظ التغييرات';
    
    showAddGame();
}

async function updateGame(gameId) {
    const gameData = {
        title: document.getElementById('gameTitle').value,
        slug: document.getElementById('gameSlug').value,
        iframeUrl: document.getElementById('gameIframe').value,
        thumbnailUrl: document.getElementById('gameThumbnail').value,
        category: document.getElementById('gameCategory').value,
        active: document.getElementById('gameActive').checked
    };
    
    try {
        await db.collection('games').doc(gameId).update(gameData);
        
        showMessage('تم تحديث اللعبة بنجاح', 'success');
        closeModal('addGameModal');
        resetForm();
        loadGames();
        
    } catch (error) {
        console.error('Error updating game:', error);
        showMessage('حدث خطأ أثناء تحديث اللعبة: ' + error.message, 'error');
    }
}

function resetForm() {
    const form = document.getElementById('addGameForm');
    if (form) {
        form.onsubmit = handleAddGame;
        const titleElement = document.querySelector('#addGameModal h2');
        const buttonElement = document.querySelector('#addGameForm button');
        
        if (titleElement) titleElement.textContent = 'إضافة لعبة جديدة';
        if (buttonElement) buttonElement.textContent = 'إضافة اللعبة';
    }
}

function getCategoryName(category) {
    const categories = {
        'action': 'أكشن',
        'puzzle': 'ألغاز',
        'racing': 'سباق',
        'sports': 'رياضة',
        'adventure': 'مغامرة'
    };
    return categories[category] || category;
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
    if (modalId === 'addGameModal') {
        resetForm();
    }
}

// Show message helper function
function showMessage(message, type = 'info') {
    // Create message element if it doesn't exist
    let messageEl = document.getElementById('admin-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'admin-message';
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            max-width: 300px;
        `;
        document.body.appendChild(messageEl);
    }
    
    // Set message content and style
    messageEl.textContent = message;
    
    // Set color based on type
    switch(type) {
        case 'success':
            messageEl.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            messageEl.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            messageEl.style.backgroundColor = '#ff9800';
            break;
        default:
            messageEl.style.backgroundColor = '#2196F3';
    }
    
    // Show message
    messageEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// Make functions globally available
window.showAddGame = showAddGame;
window.closeModal = closeModal;
window.toggleGame = toggleGame;
window.editGame = editGame;
window.deleteGame = deleteGame;
window.showMessage = showMessage;