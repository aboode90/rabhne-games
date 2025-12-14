// Advanced Games Manager
let allGames = [];
let filteredGames = [];
let selectedGames = new Set();
let currentEditingGame = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAccess();
});

// Check admin access
async function checkAdminAccess() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                console.log('Checking admin for user:', user.email);
                
                // Check if user is the main admin
                const isMainAdmin = user.email === 'abdullaalbder185@gmail.com';
                
                const userRef = db.collection('users').doc(user.uid);
                const userDoc = await userRef.get();
                
                if (!userDoc.exists) {
                    // Create user document
                    await userRef.set({
                        email: user.email,
                        displayName: user.displayName,
                        isAdmin: isMainAdmin, // Only main admin gets admin rights
                        points: 0,
                        dailyPoints: 0,
                        blocked: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('Created user document, admin:', isMainAdmin);
                } else if (isMainAdmin) {
                    // Ensure main admin has admin rights
                    await userRef.update({ isAdmin: true });
                    console.log('Ensured main admin rights');
                }
                
                const userData = userDoc.exists ? userDoc.data() : { isAdmin: isMainAdmin };
                const hasAdminRights = userData.isAdmin === true || isMainAdmin;
                
                console.log('User data:', userData, 'Has admin rights:', hasAdminRights);
                
                if (hasAdminRights) {
                    console.log('User has admin access, loading games...');
                    await loadGames();
                    setupEventListeners();
                } else {
                    showMessage('ليس لديك صلاحية للوصول لهذه الصفحة', 'error');
                    setTimeout(() => window.location.href = '../index.html', 2000);
                }
            } catch (error) {
                console.error('Error checking admin:', error);
                showMessage('خطأ في التحقق من الصلاحيات: ' + error.message, 'error');
            }
        } else {
            showMessage('يجب تسجيل الدخول أولاً', 'error');
            setTimeout(() => window.location.href = '../index.html', 2000);
        }
    });
}

// Load all games
async function loadGames() {
    try {
        console.log('Loading games...');
        showLoading();
        
        // Try without orderBy first
        const gamesSnapshot = await db.collection('games').get();
        console.log('Games snapshot size:', gamesSnapshot.size);
        
        allGames = [];
        gamesSnapshot.forEach(doc => {
            const gameData = doc.data();
            console.log('Game found:', doc.id, gameData.title);
            allGames.push({
                id: doc.id,
                ...gameData
            });
        });
        
        console.log('Total games loaded:', allGames.length);
        filteredGames = [...allGames];
        updateStatistics();
        displayGames();
        
    } catch (error) {
        console.error('Error loading games:', error);
        showMessage('خطأ في تحميل الألعاب: ' + error.message, 'error');
        
        // Try alternative loading method
        try {
            console.log('Trying alternative loading...');
            const altSnapshot = await db.collection('games').limit(10).get();
            console.log('Alternative snapshot size:', altSnapshot.size);
            
            allGames = [];
            altSnapshot.forEach(doc => {
                allGames.push({ id: doc.id, ...doc.data() });
            });
            
            filteredGames = [...allGames];
            updateStatistics();
            displayGames();
            
        } catch (altError) {
            console.error('Alternative loading failed:', altError);
            showEmptyState('حدث خطأ في تحميل الألعاب');
        }
    }
}

// Update statistics
function updateStatistics() {
    const totalGames = allGames.length;
    const activeGames = allGames.filter(game => game.active).length;
    const totalPlays = allGames.reduce((sum, game) => sum + (game.plays || 0), 0);
    const categories = new Set(allGames.map(game => game.category)).size;
    
    document.getElementById('totalGames').textContent = totalGames;
    document.getElementById('activeGames').textContent = activeGames;
    document.getElementById('totalPlays').textContent = totalPlays.toLocaleString();
    document.getElementById('categoriesCount').textContent = categories;
}

// Display games in table
function displayGames() {
    const container = document.getElementById('gamesTableContainer');
    
    if (filteredGames.length === 0) {
        showEmptyState('لا توجد ألعاب');
        return;
    }
    
    const tableHTML = `
        <table class="games-table">
            <thead>
                <tr>
                    <th><input type="checkbox" onchange="toggleSelectAll(this)"></th>
                    <th>الصورة</th>
                    <th>اسم اللعبة</th>
                    <th>الفئة</th>
                    <th>مرات اللعب</th>
                    <th>الحالة</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${filteredGames.map(game => `
                    <tr>
                        <td><input type="checkbox" class="game-checkbox" value="${game.id}" onchange="toggleGameSelection('${game.id}')"></td>
                        <td>
                            <img src="${game.thumbnail || 'https://via.placeholder.com/80x60/007bff/ffffff?text=🎮'}" 
                                 alt="${game.title}" class="game-thumbnail"
                                 onerror="this.src='https://via.placeholder.com/80x60/007bff/ffffff?text=🎮'">
                        </td>
                        <td>
                            <strong>${game.title}</strong><br>
                            <small style="color: #666;">/${game.slug}</small>
                        </td>
                        <td>${getCategoryName(game.category)}</td>
                        <td>${(game.plays || 0).toLocaleString()}</td>
                        <td>
                            <span class="${game.active ? 'status-active' : 'status-inactive'}">
                                ${game.active ? '✅ نشطة' : '❌ معطلة'}
                            </span>
                        </td>
                        <td>${formatDate(game.createdAt)}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="editGame('${game.id}')" title="تعديل">✏️</button>
                                <button class="btn ${game.active ? 'btn-warning' : 'btn-success'}" 
                                        onclick="toggleGameStatus('${game.id}')" 
                                        title="${game.active ? 'تعطيل' : 'تفعيل'}">
                                    ${game.active ? '⏸️' : '▶️'}
                                </button>
                                <button class="btn btn-secondary" onclick="viewGame('${game.id}')" title="معاينة">👁️</button>
                                <button class="btn btn-danger" onclick="deleteGame('${game.id}')" title="حذف">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Show loading state
function showLoading() {
    document.getElementById('gamesTableContainer').innerHTML = '<div class="loading">جاري تحميل الألعاب...</div>';
}

// Show empty state
function showEmptyState(message) {
    document.getElementById('gamesTableContainer').innerHTML = `<div class="empty-state">${message}</div>`;
}

// Filter games
function filterGames() {
    const searchTerm = document.getElementById('searchGames').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    filteredGames = allGames.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchTerm) || 
                            game.slug.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || game.category === categoryFilter;
        const matchesStatus = !statusFilter || 
                            (statusFilter === 'active' && game.active) ||
                            (statusFilter === 'inactive' && !game.active);
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    displayGames();
}

// Show add game modal
function showAddGameModal() {
    currentEditingGame = null;
    document.getElementById('modalTitle').textContent = 'إضافة لعبة جديدة';
    document.getElementById('gameForm').reset();
    document.getElementById('gameModal').style.display = 'block';
}

// Edit game
function editGame(gameId) {
    const game = allGames.find(g => g.id === gameId);
    if (!game) return;
    
    currentEditingGame = gameId;
    document.getElementById('modalTitle').textContent = 'تعديل اللعبة';
    
    document.getElementById('gameTitle').value = game.title || '';
    document.getElementById('gameSlug').value = game.slug || '';
    document.getElementById('gameDescription').value = game.description || '';
    document.getElementById('gameIframe').value = game.iframeUrl || '';
    document.getElementById('gameThumbnail').value = game.thumbnail || '';
    document.getElementById('gameCategory').value = game.category || '';
    document.getElementById('gameActive').checked = game.active || false;
    
    document.getElementById('gameModal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('gameModal').style.display = 'none';
    currentEditingGame = null;
}

// Setup event listeners
function setupEventListeners() {
    // Auto-generate slug from title
    document.getElementById('gameTitle').addEventListener('input', function(e) {
        const slug = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        document.getElementById('gameSlug').value = slug;
    });
    
    // Form submission
    document.getElementById('gameForm').addEventListener('submit', handleGameSubmit);
    
    // Close modal on outside click
    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('gameModal')) {
            closeModal();
        }
    });
}

// Handle game form submission
async function handleGameSubmit(e) {
    e.preventDefault();
    
    const gameData = {
        title: document.getElementById('gameTitle').value.trim(),
        slug: document.getElementById('gameSlug').value.trim(),
        description: document.getElementById('gameDescription').value.trim(),
        iframeUrl: document.getElementById('gameIframe').value.trim(),
        thumbnail: document.getElementById('gameThumbnail').value.trim(),
        category: document.getElementById('gameCategory').value,
        active: document.getElementById('gameActive').checked,
        plays: currentEditingGame ? undefined : 0
    };
    
    // Validation
    if (!gameData.title || !gameData.slug || !gameData.iframeUrl || !gameData.category) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    try {
        if (currentEditingGame) {
            // Update existing game
            await db.collection('games').doc(currentEditingGame).update({
                ...gameData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showMessage('تم تحديث اللعبة بنجاح', 'success');
        } else {
            // Check for duplicate slug
            const existingGame = await db.collection('games').where('slug', '==', gameData.slug).get();
            if (!existingGame.empty) {
                showMessage('معرف اللعبة مستخدم بالفعل', 'error');
                return;
            }
            
            // Add new game
            await db.collection('games').add({
                ...gameData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showMessage('تم إضافة اللعبة بنجاح', 'success');
        }
        
        closeModal();
        await loadGames();
        
    } catch (error) {
        console.error('Error saving game:', error);
        showMessage('خطأ في حفظ اللعبة: ' + error.message, 'error');
    }
}

// Toggle game status
async function toggleGameStatus(gameId) {
    const game = allGames.find(g => g.id === gameId);
    if (!game) return;
    
    try {
        await db.collection('games').doc(gameId).update({
            active: !game.active,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage(`تم ${game.active ? 'تعطيل' : 'تفعيل'} اللعبة`, 'success');
        await loadGames();
        
    } catch (error) {
        showMessage('خطأ في تغيير حالة اللعبة', 'error');
    }
}

// Delete game
async function deleteGame(gameId) {
    const game = allGames.find(g => g.id === gameId);
    if (!game) return;
    
    if (!confirm(`هل أنت متأكد من حذف لعبة "${game.title}"؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
        return;
    }
    
    try {
        await db.collection('games').doc(gameId).delete();
        showMessage('تم حذف اللعبة بنجاح', 'success');
        await loadGames();
        
    } catch (error) {
        showMessage('خطأ في حذف اللعبة', 'error');
    }
}

// View game
function viewGame(gameId) {
    const game = allGames.find(g => g.id === gameId);
    if (!game) return;
    
    window.open(`../game.html?slug=${game.slug}`, '_blank');
}

// Remove duplicates
async function removeDuplicates() {
    if (!confirm('هل أنت متأكد من حذف الألعاب المكررة؟')) return;
    
    try {
        const gamesByTitle = {};
        const toDelete = [];
        
        allGames.forEach(game => {
            if (gamesByTitle[game.title]) {
                toDelete.push(game.id);
            } else {
                gamesByTitle[game.title] = game.id;
            }
        });
        
        for (const id of toDelete) {
            await db.collection('games').doc(id).delete();
        }
        
        showMessage(`تم حذف ${toDelete.length} لعبة مكررة`, 'success');
        await loadGames();
        
    } catch (error) {
        showMessage('خطأ في حذف المكررات', 'error');
    }
}

// Export games data
function exportGames() {
    const dataStr = JSON.stringify(allGames, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `games-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Selection functions
function toggleSelectAll(checkbox) {
    const gameCheckboxes = document.querySelectorAll('.game-checkbox');
    gameCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        toggleGameSelection(cb.value);
    });
}

function toggleGameSelection(gameId) {
    if (selectedGames.has(gameId)) {
        selectedGames.delete(gameId);
    } else {
        selectedGames.add(gameId);
    }
    
    updateBulkActions();
}

function updateBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedGames.size > 0) {
        bulkActions.style.display = 'block';
        selectedCount.textContent = `${selectedGames.size} محدد`;
    } else {
        bulkActions.style.display = 'none';
    }
}

// Bulk operations
async function bulkActivate() {
    if (selectedGames.size === 0) return;
    
    try {
        const batch = db.batch();
        selectedGames.forEach(gameId => {
            const gameRef = db.collection('games').doc(gameId);
            batch.update(gameRef, { active: true });
        });
        
        await batch.commit();
        showMessage(`تم تفعيل ${selectedGames.size} لعبة`, 'success');
        selectedGames.clear();
        await loadGames();
        
    } catch (error) {
        showMessage('خطأ في التفعيل الجماعي', 'error');
    }
}

async function bulkDeactivate() {
    if (selectedGames.size === 0) return;
    
    try {
        const batch = db.batch();
        selectedGames.forEach(gameId => {
            const gameRef = db.collection('games').doc(gameId);
            batch.update(gameRef, { active: false });
        });
        
        await batch.commit();
        showMessage(`تم تعطيل ${selectedGames.size} لعبة`, 'success');
        selectedGames.clear();
        await loadGames();
        
    } catch (error) {
        showMessage('خطأ في التعطيل الجماعي', 'error');
    }
}

async function bulkDelete() {
    if (selectedGames.size === 0) return;
    
    if (!confirm(`هل أنت متأكد من حذف ${selectedGames.size} لعبة؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
        return;
    }
    
    try {
        const batch = db.batch();
        selectedGames.forEach(gameId => {
            const gameRef = db.collection('games').doc(gameId);
            batch.delete(gameRef);
        });
        
        await batch.commit();
        showMessage(`تم حذف ${selectedGames.size} لعبة`, 'success');
        selectedGames.clear();
        await loadGames();
        
    } catch (error) {
        showMessage('خطأ في الحذف الجماعي', 'error');
    }
}

// Helper functions
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

// Make functions global
window.showAddGameModal = showAddGameModal;
window.editGame = editGame;
window.closeModal = closeModal;
window.toggleGameStatus = toggleGameStatus;
window.deleteGame = deleteGame;
window.viewGame = viewGame;
window.removeDuplicates = removeDuplicates;
window.exportGames = exportGames;
window.filterGames = filterGames;
window.toggleSelectAll = toggleSelectAll;
window.toggleGameSelection = toggleGameSelection;
window.bulkActivate = bulkActivate;
window.bulkDeactivate = bulkDeactivate;
window.bulkDelete = bulkDelete;