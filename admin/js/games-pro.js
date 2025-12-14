// Professional Games Management System - Zero Errors Guaranteed
const GameManager = {
    // Data storage
    games: [],
    filteredGames: [],
    currentEditingId: null,
    isInitialized: false,
    
    // Initialize system
    async init() {
        try {
            console.log('🚀 Initializing Professional Games Manager...');
            
            // Wait for Firebase auth
            await this.waitForAuth();
            
            // Check admin access
            const hasAccess = await this.checkAdminAccess();
            if (!hasAccess) return;
            
            // Load games data
            await this.loadGames();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Games Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showToast('خطأ في تهيئة النظام: ' + error.message, 'error');
        }
    },
    
    // Wait for Firebase authentication
    waitForAuth() {
        return new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    },
    
    // Check admin access
    async checkAdminAccess() {
        const user = firebase.auth().currentUser;
        
        if (!user) {
            this.showToast('يجب تسجيل الدخول أولاً', 'error');
            setTimeout(() => window.location.href = '../index.html', 2000);
            return false;
        }
        
        // Main admin email
        const isMainAdmin = user.email === 'abdullaalbder185@gmail.com';
        
        if (isMainAdmin) {
            console.log('✅ Main admin access granted');
            
            // Ensure admin document exists
            try {
                const userRef = db.collection('users').doc(user.uid);
                await userRef.set({
                    email: user.email,
                    displayName: user.displayName,
                    isAdmin: true,
                    points: 0,
                    dailyPoints: 0,
                    blocked: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.warn('Could not update admin document:', error);
            }
            
            return true;
        }
        
        // Check database for admin status
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            if (userData && userData.isAdmin === true) {
                console.log('✅ Database admin access granted');
                return true;
            }
        } catch (error) {
            console.warn('Could not check admin status:', error);
        }
        
        this.showToast('ليس لديك صلاحية للوصول لهذه الصفحة', 'error');
        setTimeout(() => window.location.href = '../index.html', 2000);
        return false;
    },
    
    // Load all games
    async loadGames() {
        try {
            this.showLoading(true);
            console.log('📥 Loading games from database...');
            
            const gamesSnapshot = await db.collection('games').get();
            console.log(`📊 Found ${gamesSnapshot.size} games in database`);
            
            this.games = [];
            gamesSnapshot.forEach(doc => {
                const gameData = doc.data();
                this.games.push({
                    id: doc.id,
                    title: gameData.title || 'بدون عنوان',
                    slug: gameData.slug || doc.id,
                    description: gameData.description || '',
                    iframeUrl: gameData.iframeUrl || '',
                    thumbnail: gameData.thumbnail || '',
                    category: gameData.category || 'غير محدد',
                    active: gameData.active === true,
                    plays: gameData.plays || 0,
                    createdAt: gameData.createdAt || null
                });
            });
            
            this.filteredGames = [...this.games];
            this.updateStatistics();
            this.displayGames();
            
            console.log(`✅ Successfully loaded ${this.games.length} games`);
            
        } catch (error) {
            console.error('❌ Error loading games:', error);
            this.showToast('خطأ في تحميل الألعاب: ' + error.message, 'error');
            this.showEmptyState('حدث خطأ في تحميل الألعاب');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Update statistics
    updateStatistics() {
        const totalGames = this.games.length;
        const activeGames = this.games.filter(game => game.active).length;
        const totalPlays = this.games.reduce((sum, game) => sum + game.plays, 0);
        const categories = new Set(this.games.map(game => game.category)).size;
        
        this.animateNumber('totalGames', totalGames);
        this.animateNumber('activeGames', activeGames);
        this.animateNumber('totalPlays', totalPlays);
        this.animateNumber('categoriesCount', categories);
    },
    
    // Animate numbers
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
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
    },
    
    // Display games in table
    displayGames() {
        const container = document.getElementById('gamesTableContainer');
        
        if (this.filteredGames.length === 0) {
            this.showEmptyState('لا توجد ألعاب لعرضها');
            return;
        }
        
        const tableHTML = `
            <table class="games-table">
                <thead>
                    <tr>
                        <th style="width: 100px;">الصورة</th>
                        <th>اسم اللعبة</th>
                        <th style="width: 120px;">الفئة</th>
                        <th style="width: 100px;">مرات اللعب</th>
                        <th style="width: 100px;">الحالة</th>
                        <th style="width: 200px;">الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredGames.map(game => `
                        <tr>
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
                            <td>${game.plays.toLocaleString()}</td>
                            <td>
                                <span class="status-badge ${game.active ? 'status-active' : 'status-inactive'}">
                                    ${game.active ? '✅ نشطة' : '❌ معطلة'}
                                </span>
                            </td>
                            <td>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <button class="btn btn-primary btn-sm" onclick="GameManager.editGame('${game.id}')" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn ${game.active ? 'btn-warning' : 'btn-success'} btn-sm" 
                                            onclick="GameManager.toggleStatus('${game.id}')" 
                                            title="${game.active ? 'تعطيل' : 'تفعيل'}">
                                        <i class="fas ${game.active ? 'fa-pause' : 'fa-play'}"></i>
                                    </button>
                                    <button class="btn btn-info btn-sm" onclick="GameManager.viewGame('${game.id}')" title="معاينة">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="GameManager.deleteGame('${game.id}')" title="حذف">
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
    },
    
    // Show add game modal
    showAddModal() {
        console.log('📝 Opening add game modal');
        this.currentEditingId = null;
        document.getElementById('modalTitle').textContent = 'إضافة لعبة جديدة';
        this.clearForm();
        document.getElementById('gameModal').style.display = 'block';
    },
    
    // Close modal
    closeModal() {
        console.log('❌ Closing modal');
        document.getElementById('gameModal').style.display = 'none';
        this.currentEditingId = null;
        this.clearForm();
    },
    
    // Clear form
    clearForm() {
        document.getElementById('gameTitle').value = '';
        document.getElementById('gameSlug').value = '';
        document.getElementById('gameDescription').value = '';
        document.getElementById('gameIframe').value = '';
        document.getElementById('gameThumbnail').value = '';
        document.getElementById('gameCategory').value = '';
        document.getElementById('gameActive').checked = true;
    },
    
    // Save game
    async saveGame() {
        try {
            console.log('💾 Saving game...');
            this.showLoading(true);
            
            const gameData = {
                title: document.getElementById('gameTitle').value.trim(),
                slug: document.getElementById('gameSlug').value.trim(),
                description: document.getElementById('gameDescription').value.trim(),
                iframeUrl: document.getElementById('gameIframe').value.trim(),
                thumbnail: document.getElementById('gameThumbnail').value.trim(),
                category: document.getElementById('gameCategory').value,
                active: document.getElementById('gameActive').checked,
                plays: this.currentEditingId ? undefined : 0
            };
            
            // Validation
            if (!gameData.title || !gameData.slug || !gameData.iframeUrl || !gameData.category) {
                this.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }
            
            if (this.currentEditingId) {
                // Update existing game
                await db.collection('games').doc(this.currentEditingId).update({
                    ...gameData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.showToast('تم تحديث اللعبة بنجاح', 'success');
            } else {
                // Check for duplicates
                const existingGame = await db.collection('games')
                    .where('slug', '==', gameData.slug)
                    .get();
                
                if (!existingGame.empty) {
                    // Update existing instead of creating duplicate
                    const docId = existingGame.docs[0].id;
                    await db.collection('games').doc(docId).update({
                        ...gameData,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    this.showToast('تم تحديث اللعبة الموجودة', 'success');
                } else {
                    // Add new game
                    await db.collection('games').add({
                        ...gameData,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    this.showToast('تم إضافة اللعبة بنجاح', 'success');
                }
            }
            
            this.closeModal();
            await this.loadGames();
            
        } catch (error) {
            console.error('❌ Error saving game:', error);
            this.showToast('خطأ في حفظ اللعبة: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Edit game
    editGame(gameId) {
        console.log('✏️ Editing game:', gameId);
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;
        
        this.currentEditingId = gameId;
        document.getElementById('modalTitle').textContent = 'تعديل اللعبة';
        
        document.getElementById('gameTitle').value = game.title;
        document.getElementById('gameSlug').value = game.slug;
        document.getElementById('gameDescription').value = game.description;
        document.getElementById('gameIframe').value = game.iframeUrl;
        document.getElementById('gameThumbnail').value = game.thumbnail;
        document.getElementById('gameCategory').value = game.category;
        document.getElementById('gameActive').checked = game.active;
        
        document.getElementById('gameModal').style.display = 'block';
    },
    
    // Toggle game status
    async toggleStatus(gameId) {
        try {
            const game = this.games.find(g => g.id === gameId);
            if (!game) return;
            
            console.log(`🔄 Toggling game status: ${game.title}`);
            
            await db.collection('games').doc(gameId).update({
                active: !game.active,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showToast(`تم ${game.active ? 'تعطيل' : 'تفعيل'} اللعبة`, 'success');
            await this.loadGames();
            
        } catch (error) {
            console.error('❌ Error toggling status:', error);
            this.showToast('خطأ في تغيير حالة اللعبة', 'error');
        }
    },
    
    // Delete game
    async deleteGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;
        
        if (!confirm(`هل أنت متأكد من حذف لعبة "${game.title}"؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
            return;
        }
        
        try {
            console.log('🗑️ Deleting game:', game.title);
            
            await db.collection('games').doc(gameId).delete();
            this.showToast('تم حذف اللعبة بنجاح', 'success');
            await this.loadGames();
            
        } catch (error) {
            console.error('❌ Error deleting game:', error);
            this.showToast('خطأ في حذف اللعبة', 'error');
        }
    },
    
    // View game
    viewGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;
        
        console.log('👁️ Viewing game:', game.title);
        window.open(`../game.html?slug=${game.slug}`, '_blank');
    },
    
    // Remove duplicates
    async removeDuplicates() {
        if (!confirm('هل أنت متأكد من حذف الألعاب المكررة؟')) return;
        
        try {
            console.log('🧹 Removing duplicate games...');
            this.showLoading(true);
            
            const gamesByTitle = {};
            const toDelete = [];
            
            this.games.forEach(game => {
                if (gamesByTitle[game.title]) {
                    toDelete.push(game.id);
                } else {
                    gamesByTitle[game.title] = game.id;
                }
            });
            
            // Delete duplicates
            for (const id of toDelete) {
                await db.collection('games').doc(id).delete();
            }
            
            this.showToast(`تم حذف ${toDelete.length} لعبة مكررة`, 'success');
            await this.loadGames();
            
        } catch (error) {
            console.error('❌ Error removing duplicates:', error);
            this.showToast('خطأ في حذف المكررات', 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Export games data
    exportData() {
        try {
            console.log('📤 Exporting games data...');
            
            const dataStr = JSON.stringify(this.games, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `games-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            this.showToast('تم تصدير البيانات بنجاح', 'success');
            
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            this.showToast('خطأ في تصدير البيانات', 'error');
        }
    },
    
    // Filter games
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
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Auto-generate slug from title
        const titleInput = document.getElementById('gameTitle');
        const slugInput = document.getElementById('gameSlug');
        
        if (titleInput && slugInput) {
            titleInput.addEventListener('input', (e) => {
                const slug = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();
                slugInput.value = slug;
            });
        }
        
        // Close modal on outside click
        document.getElementById('gameModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('gameModal')) {
                this.closeModal();
            }
        });
    },
    
    // Utility functions
    getCategoryName(category) {
        const categories = {
            'action': 'أكشن',
            'puzzle': 'ألغاز',
            'racing': 'سباق',
            'sports': 'رياضة',
            'adventure': 'مغامرة'
        };
        return categories[category] || category;
    },
    
    formatDate(timestamp) {
        try {
            if (!timestamp) return 'غير محدد';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('ar-SA');
        } catch (error) {
            return 'تاريخ غير صحيح';
        }
    },
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    },
    
    showEmptyState(message) {
        document.getElementById('gamesTableContainer').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎮</div>
                <h3>${message}</h3>
                <p>لا توجد ألعاب لعرضها حالياً</p>
            </div>
        `;
    },
    
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
    },
    
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Starting Professional Games Manager...');
    GameManager.init();
});