// Demo games for testing
const DEMO_GAMES = [
    {
        id: 'demo_1',
        title: 'لعبة الألغاز',
        description: 'لعبة ألغاز ممتعة ومسلية',
        thumbnail: 'https://via.placeholder.com/300x200/3498db/ffffff?text=🧩+ألغاز',
        category: 'puzzle',
        gameUrl: 'https://html5games.com/Game/puzzle-game/embed/',
        width: 800,
        height: 600
    },
    {
        id: 'demo_2', 
        title: 'لعبة السباق',
        description: 'سباق سيارات مثير',
        thumbnail: 'https://via.placeholder.com/300x200/e74c3c/ffffff?text=🏎️+سباق',
        category: 'racing',
        gameUrl: 'https://html5games.com/Game/racing-game/embed/',
        width: 800,
        height: 600
    },
    {
        id: 'demo_3',
        title: 'لعبة الأكشن',
        description: 'مغامرة مليئة بالإثارة',
        thumbnail: 'https://via.placeholder.com/300x200/27ae60/ffffff?text=⚔️+أكشن',
        category: 'action', 
        gameUrl: 'https://html5games.com/Game/action-game/embed/',
        width: 800,
        height: 600
    }
];

// إضافة الألعاب التجريبية
async function addDemoGames() {
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    try {
        const batch = db.batch();
        
        DEMO_GAMES.forEach(game => {
            const gameRef = db.collection('games').doc(`demo_${game.id}`);
            batch.set(gameRef, {
                title: game.title,
                description: game.description,
                thumbnail: game.thumbnail,
                category: game.category,
                gameUrl: game.gameUrl,
                source: 'demo',
                gameId: game.id,
                width: game.width,
                height: game.height,
                active: true,
                slug: `demo-${game.id}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        showMessage('تم إضافة الألعاب التجريبية بنجاح!', 'success');
        
    } catch (error) {
        console.error('Error adding demo games:', error);
        showMessage('حدث خطأ في إضافة الألعاب التجريبية', 'error');
    }
}