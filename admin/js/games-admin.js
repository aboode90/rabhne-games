// Professional Games Management System
class GamesManager {
    constructor() {
        this.games = [];
        this.filteredGames = [];
        this.selectedGames = new Set();
        this.currentEditingGame = null;
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing Games Manager...');
        await this.checkAdminAccess();
        this.setupEventListeners();
    }
    
    async checkAdminAccess() {
        return new Promise((resolve) => {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    try {
                        console.log('Checking admin access for:', user.email);
                        
                        const isMainAdmin = user.email === 'abdullaalbder185@gmail.com';
                        const userRef = db.collection('users').doc(user.uid);
                        const userDoc = await userRef.get();
                        
                        if (!userDoc.exists) {
                            await userRef.set({
                                email: user.email,
                                displayName: user.displayName,
                                isAdmin: isMainAdmin,
                                points: 0,
                                dailyPoints: 0,
                                blocked: false,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        } else if (isMainAdmin) {
                            await userRef.update({ isAdmin: true });
                        }
                        
                        const userData = userDoc.exists ? userDoc.data() : { isAdmin: isMainAdmin };
                        const hasAdminRights = userData.isAdmin === true || isMainAdmin;
                        
                        if (hasAdminRights) {
                            console.log('Admin access granted');
                            await this.loadGames();
                            resolve(true);
                        } else {
                            this.showToast('ليس لديك صلاحية للوصول لهذه الصفحة', 'error');
                            setTimeout(() => window.location.href = '../index.html', 2000);
                            resolve(false);
                        }
                    } catch (error) {
                        console.error('Error checking admin access:', error);
                        this.showToast('خطأ في التحقق من الصلاحيات', 'error');
                        resolve(false);
                    }
                } else {
                    this.showToast('يجب تسجيل الدخول أولاً', 'error');
                    setTimeout(() => window.location.href = '../index.html', 2000);
                    resolve(false);
                }
            });
        });
    }
    
    async loadGames() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoading();
            
            console.log('Loading games...');
            const gamesSnapshot = await db.collection('games').get();
            console.log('Games loaded:', gamesSnapshot.size);
            
            this.games = [];
            gamesSnapshot.forEach(doc => {
                const gameData = doc.data();
                this.games.push({
                    id: doc.id,
                    ...gameData
                });
            });
            
            this.filteredGames = [...this.games];
            this.updateStatistics();
            this.displayGames();
            
        } catch (error) {
            console.error('Error loading games:', error);
            this.showToast('خطأ في تحميل الألعاب: ' + error.message, 'error');
            this.showEmptyState('حدث خطأ في تحميل الألعاب');
        } finally {
            this.isLoading = false;
        }
    }
    
    updateStatistics() {
        const totalGames = this.games.length;
        const activeGames = this.games.filter(game => game.active).length;
        const totalPlays = this.games.reduce((sum, game) => sum + (game.plays || 0), 0);
        const categories = new Set(this.games.map(game => game.category)).size;
        
        this.animateNumber('totalGames', totalGames);
        this.animateNumber('activeGames', activeGames);
        this.animateNumber('totalPlays', totalPlays);
        this.animateNumber('categoriesCount', categories);
    }
    
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    displayGames() {
        const container = document.getElementById('gamesTableContainer');
        
        if (this.filteredGames.length === 0) {
            this.showEmptyState('لا توجد ألعاب');
            return;
        }
        
        const tableHTML = `
            <table class="games-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">
                            <input type="checkbox" id="selectAll" style="cursor: pointer;">
                        </th>
                        <th style="width: 100px;">الصورة</th>
                        <th>اسم اللعبة</th>
                        <th style="width: 120px;">الفئة</th>
                        <th style="width: 100px;">مرات اللعب</th>
                        <th style="width: 100px;">الحالة</th>
                        <th style="width: 120px;">تاريخ الإضافة</th>
                        <th style="width: 200px;">الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredGames.map(game => `
                        <tr>
                            <td>
                                <input type="checkbox" class="game-checkbox" value="${game.id}" style="cursor: pointer;">
                            </td>
                            <td>
                                <img src="${game.thumbnail || 'https://via.placeholder.com/80x60/667eea/ffffff?text=🎮'}" 
                                     alt="${game.title}" class="game-thumbnail"
                                     onerror="this.src='https://via.placeholder.com/80x60/667eea/ffffff?text=🎮'">
                            </td>
                            <td>
                                <div class="game-title">${game.title}</div>
                                <div class="game-slug">/${game.slug}</div>
                            </td>
                            <td>${this.getCategoryName(game.category)}</td>
                            <td>${(game.plays || 0).toLocaleString()}</td>
                            <td>
                                <span class="status-badge ${game.active ? 'status-active' : 'status-inactive'}">
                                    ${game.active ? '✅ نشطة' : '❌ معطلة'}
                                </span>
                            </td>
                            <td>${this.formatDate(game.createdAt)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-primary btn-sm" onclick="gamesManager.editGame('${game.id}')" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn ${game.active ? 'btn-warning' : 'btn-success'} btn-sm" 
                                            onclick="gamesManager.toggleGameStatus('${game.id}')" 
                                            title="${game.active ? 'تعطيل' : 'تفعيل'}">
                                        <i class="fas ${game.active ? 'fa-pause' : 'fa-play'}"></i>
                                    </button>
                                    <button class="btn btn-info btn-sm" onclick="gamesManager.viewGame('${game.id}')" title="معاينة">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="gamesManager.deleteGame('${game.id}')" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        this.setupTableEvents();
    }
    
    setupEventListeners() {
        // Add Game Button
        document.getElementById('addGameBtn').addEventListener('click', () => this.showAddGameModal());
        
        // Remove Duplicates Button
        document.getElementById('removeDuplicatesBtn').addEventListener('click', () => this.removeDuplicates());
        
        // Export Button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportGames());
        
        // Search and Filters
        document.getElementById('searchInput').addEventListener('input', () => this.filterGames());
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterGames());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterGames());
        
        // Modal Events
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('gameForm').addEventListener('submit', (e) => this.handleGameSubmit(e));
        
        // Bulk Actions
        document.getElementById('bulkActivateBtn').addEventListener('click', () => this.bulkActivate());
        document.getElementById('bulkDeactivateBtn').addEventListener('click', () => this.bulkDeactivate());
        document.getElementById('bulkDeleteBtn').addEventListener('click', () => this.bulkDelete());
        
        // Auto-generate slug
        document.getElementById('gameTitle').addEventListener('input', (e) => {
            const slug = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            document.getElementById('gameSlug').value = slug;
        });
        
        // Close modal on outside click
        document.getElementById('gameModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('gameModal')) {
                this.closeModal();
            }
        });
    }
    
    setupTableEvents() {
        // Select All Checkbox
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const gameCheckboxes = document.querySelectorAll('.game-checkbox');
                gameCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                    this.toggleGameSelection(checkbox.value, checkbox.checked);
                });
            });
        }
        
        // Individual Game Checkboxes
        document.querySelectorAll('.game-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleGameSelection(e.target.value, e.target.checked);
            });
        });
    }
    
    toggleGameSelection(gameId, isSelected) {
        if (isSelected) {
            this.selectedGames.add(gameId);
        } else {
            this.selectedGames.delete(gameId);
        }
        this.updateBulkActions();
    }
    
    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.selectedGames.size > 0) {
            bulkActions.classList.add('active');
            selectedCount.textContent = `${this.selectedGames.size} محدد`;
        } else {
            bulkActions.classList.remove('active');
        }
    }
    
    filterGames() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        this.filteredGames = this.games.filter(game => {
            const matchesSearch = game.title.toLowerCase().includes(searchTerm) || 
                                game.slug.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || game.category === categoryFilter;
            const matchesStatus = !statusFilter || 
                                (statusFilter === 'active' && game.active) ||
                                (statusFilter === 'inactive' && !game.active);
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
        
        this.displayGames();
    }
    
    showAddGameModal() {
        this.currentEditingGame = null;
        document.getElementById('modalTitle').textContent = 'إضافة لعبة جديدة';
        document.getElementById('gameForm').reset();
        document.getElementById('gameModal').style.display = 'block';
    }
    
    editGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;
        
        this.currentEditingGame = gameId;
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
    
    closeModal() {
        document.getElementById('gameModal').style.display = 'none';
        this.currentEditingGame = null;
    }
    
    async handleGameSubmit(e) {
        e.preventDefault();
        
        const gameData = {
            title: document.getElementById('gameTitle').value.trim(),
            slug: document.getElementById('gameSlug').value.trim(),
            description: document.getElementById('gameDescription').value.trim(),
            iframeUrl: document.getElementById('gameIframe').value.trim(),
            thumbnail: document.getElementById('gameThumbnail').value.trim(),
            category: document.getElementById('gameCategory').value,
            active: document.getElementById('gameActive').checked,
            plays: this.currentEditingGame ? undefined : 0
        };
        
        if (!gameData.title || !gameData.slug || !gameData.iframeUrl || !gameData.category) {
            this.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        try {
            if (this.currentEditingGame) {
                await db.collection('games').doc(this.currentEditingGame).update({
                    ...gameData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.showToast('تم تحديث اللعبة بنجاح', 'success');
            } else {
                const existingGame = await db.collection('games').where('slug', '==', gameData.slug).get();
                if (!existingGame.empty) {
                    this.showToast('معرف اللعبة مستخدم بالفعل', 'error');
                    return;
                }
                
                await db.collection('games').add({
                    ...gameData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.showToast('تم إضافة اللعبة بنجاح', 'success');
            }
            
            this.closeModal();
            await this.loadGames();
            
        } catch (error) {
            console.error('Error saving game:', error);
            this.showToast('خطأ في حفظ اللعبة: ' + error.message, 'error');
        }
    }
    
    async toggleGameStatus(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;
        
        try {
            await db.collection('games').doc(gameId).update({
                active: !game.active,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showToast(`تم ${game.active ? 'تعطيل' : 'تفعيل'} اللعبة`, 'success');
            await this.loadGames();
            
        } catch (error) {
            this.showToast('خطأ في تغيير حالة اللعبة', 'error');
        }
    }
    
    async deleteGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;
        
        if (!confirm(`هل أنت متأكد من حذف لعبة "${game.title}"؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
            return;
        }
        
        try {
            await db.collection('games').doc(gameId).delete();
            this.showToast('تم حذف اللعبة بنجاح', 'success');
            await this.loadGames();
            
        } catch (error) {
            this.showToast('خطأ في حذف اللعبة', 'error');
        }
    }
    
    viewGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;
        
        window.open(`../game.html?slug=${game.slug}`, '_blank');
    }
    
    async removeDuplicates() {
        if (!confirm('هل أنت متأكد من حذف الألعاب المكررة؟')) return;
        
        try {
            const gamesByTitle = {};
            const toDelete = [];
            
            this.games.forEach(game => {
                if (gamesByTitle[game.title]) {
                    toDelete.push(game.id);
                } else {
                    gamesByTitle[game.title] = game.id;
                }
            });
            
            for (const id of toDelete) {
                await db.collection('games').doc(id).delete();
            }
            
            this.showToast(`تم حذف ${toDelete.length} لعبة مكررة`, 'success');
            await this.loadGames();
            
        } catch (error) {
            this.showToast('خطأ في حذف المكررات', 'error');
        }
    }
    
    exportGames() {
        const dataStr = JSON.stringify(this.games, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `games-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showToast('تم تصدير البيانات بنجاح', 'success');
    }
    
    async bulkActivate() {
        if (this.selectedGames.size === 0) return;
        
        try {
            const batch = db.batch();
            this.selectedGames.forEach(gameId => {
                const gameRef = db.collection('games').doc(gameId);
                batch.update(gameRef, { active: true });
            });
            
            await batch.commit();
            this.showToast(`تم تفعيل ${this.selectedGames.size} لعبة`, 'success');
            this.selectedGames.clear();
            await this.loadGames();
            
        } catch (error) {
            this.showToast('خطأ في التفعيل الجماعي', 'error');
        }
    }
    
    async bulkDeactivate() {
        if (this.selectedGames.size === 0) return;
        
        try {
            const batch = db.batch();
            this.selectedGames.forEach(gameId => {
                const gameRef = db.collection('games').doc(gameId);
                batch.update(gameRef, { active: false });
            });
            
            await batch.commit();
            this.showToast(`تم تعطيل ${this.selectedGames.size} لعبة`, 'success');
            this.selectedGames.clear();
            await this.loadGames();
            
        } catch (error) {
            this.showToast('خطأ في التعطيل الجماعي', 'error');
        }
    }
    
    async bulkDelete() {
        if (this.selectedGames.size === 0) return;
        
        if (!confirm(`هل أنت متأكد من حذف ${this.selectedGames.size} لعبة؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
            return;
        }
        
        try {
            const batch = db.batch();
            this.selectedGames.forEach(gameId => {
                const gameRef = db.collection('games').doc(gameId);
                batch.delete(gameRef);
            });
            
            await batch.commit();
            this.showToast(`تم حذف ${this.selectedGames.size} لعبة`, 'success');
            this.selectedGames.clear();
            await this.loadGames();
            
        } catch (error) {
            this.showToast('خطأ في الحذف الجماعي', 'error');
        }
    }
    
    showLoading() {
        document.getElementById('gamesTableContainer').innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                جاري تحميل الألعاب...
            </div>
        `;
    }
    
    showEmptyState(message) {
        document.getElementById('gamesTableContainer').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎮</div>
                <h3>${message}</h3>
                <p>لا توجد ألعاب لعرضها حالياً</p>
            </div>
        `;
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas fa-${this.getToastIcon(type)}"></i> ${message}`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    getCategoryName(category) {
        const categories = {
            'action': 'أكشن',
            'puzzle': 'ألغاز',
            'racing': 'سباق',
            'sports': 'رياضة',
            'adventure': 'مغامرة'
        };
        return categories[category] || category;
    }
    
    formatDate(timestamp) {
        try {
            if (!timestamp) return 'غير محدد';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            if (isNaN(date.getTime())) return 'تاريخ غير صحيح';
            return date.toLocaleDateString('ar-SA');
        } catch (error) {
            return 'خطأ في التاريخ';
        }
    }
}

// Initialize Games Manager
let gamesManager;
document.addEventListener('DOMContentLoaded', () => {
    gamesManager = new GamesManager();
});