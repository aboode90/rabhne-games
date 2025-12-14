// انسخ هذا الكود في Console بعد تسجيل الدخول

async function fixDuplicateGames() {
    try {
        console.log('جاري البحث عن الألعاب المكررة...');
        
        const games = await db.collection('games').get();
        console.log('تم العثور على', games.size, 'ألعاب');
        
        const gamesByTitle = {};
        const toDelete = [];
        
        games.forEach(doc => {
            const game = doc.data();
            const title = game.title;
            
            if (gamesByTitle[title]) {
                // احتفظ بالأحدث، احذف الأقدم
                toDelete.push(doc.id);
                console.log('سيتم حذف:', doc.id, '-', title);
            } else {
                gamesByTitle[title] = doc.id;
                console.log('سيتم الاحتفاظ بـ:', doc.id, '-', title);
            }
        });
        
        console.log('سيتم حذف', toDelete.length, 'لعبة مكررة');
        
        // حذف المكررات
        for (const id of toDelete) {
            await db.collection('games').doc(id).delete();
            console.log('تم حذف:', id);
        }
        
        console.log('✅ تم الانتهاء! تم حذف', toDelete.length, 'لعبة مكررة');
        alert('تم حذف ' + toDelete.length + ' لعبة مكررة بنجاح!');
        
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ: ' + error.message);
    }
}

// تشغيل الدالة
fixDuplicateGames();