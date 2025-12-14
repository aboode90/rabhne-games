// Games management functionality

let allGames = [];

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        const isAdmin = await requireAdmin();
        if (isAdmin) {
            loadGames();
            setupForms();
        }
    }, 1000);
});

async function loadGames() {
    try {
        const gamesSnapshot = await db.collection('games')
            .orderBy('createdAt', 'desc')
            .get();
        
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
        document.getElementById('gamesTableBody').innerHTML = '<tr><td colspan="6">حدث خطأ أثناء التحميل</td></tr>';
    }
}

function displayGames() {
    const tbody = document.getElementById('gamesTableBody');
    
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
                <span class="${game.isActive ? 'status-approved' : 'status-rejected'}">
                    ${game.isActive ? 'نشطة' : 'معطلة'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small ${game.isActive ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleGame('${game.id}', ${game.isActive})">
                        ${game.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button class="btn btn-small btn-primary" onclick="editGame('${game.id}')">تعديل</button>
                    <button class="btn btn-small btn-danger" onclick="deleteGame('${game.id}')">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupForms() {
    document.getElementById('addGameForm').addEventListener('submit', handleAddGame);
    
    // Auto-generate slug from title
    document.getElementById('gameTitle').addEventListener('input', (e) => {
        const slug = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        document.getElementById('gameSlug').value = slug;
    });
}

function showAddGame() {
    document.getElementById('addGameForm').reset();
    document.getElementById('addGameModal').style.display = 'block';
}

async function handleAddGame(e) {
    e.preventDefault();
    
    const gameData = {
        title: document.getElementById('gameTitle').value,
        slug: document.getElementById('gameSlug').value,
        iframeUrl: document.getElementById('gameIframe').value,
        thumbnailUrl: document.getElementById('gameThumbnail').value,
        category: document.getElementById('gameCategory').value,
        isActive: document.getElementById('gameActive').checked,
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
        showMessage('حدث خطأ أثناء إضافة اللعبة', 'error');
    }
}

async function toggleGame(gameId, isActive) {
    const action = isActive ? 'تعطيل' : 'تفعيل';
    if (!confirm(`هل أنت متأكد من ${action} هذه اللعبة؟`)) return;
    
    try {
        await db.collection('games').doc(gameId).update({
            isActive: !isActive
        });
        
        showMessage(`تم ${action} اللعبة بنجاح`, 'success');
        loadGames();
        
    } catch (error) {
        console.error('Error toggling game:', error);
        showMessage(`حدث خطأ أثناء ${action} اللعبة`, 'error');
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
        showMessage('حدث خطأ أثناء حذف اللعبة', 'error');
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
    document.getElementById('gameActive').checked = game.isActive;
    
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
        isActive: document.getElementById('gameActive').checked
    };
    
    try {
        await db.collection('games').doc(gameId).update(gameData);
        
        showMessage('تم تحديث اللعبة بنجاح', 'success');
        closeModal('addGameModal');
        resetForm();
        loadGames();
        
    } catch (error) {
        console.error('Error updating game:', error);
        showMessage('حدث خطأ أثناء تحديث اللعبة', 'error');
    }
}

function resetForm() {
    const form = document.getElementById('addGameForm');
    form.onsubmit = handleAddGame;
    document.querySelector('#addGameModal h2').textContent = 'إضافة لعبة جديدة';
    document.querySelector('#addGameForm button').textContent = 'إضافة اللعبة';
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
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'addGameModal') {
        resetForm();
    }
}