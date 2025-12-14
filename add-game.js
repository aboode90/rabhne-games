// إضافة لعبة Foxy Eco Sort
const gameData = {
    title: "Foxy Eco Sort",
    slug: "foxy-eco-sort",
    iframeUrl: "https://html5.gamedistribution.com/rvvASMiM/foxy-eco-sort/index.html",
    thumbnailUrl: "https://img.gamedistribution.com/foxy-eco-sort-thumb.jpg",
    category: "puzzle",
    isActive: true,
    plays: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

// إضافة اللعبة
async function addGame() {
    try {
        await db.collection('games').add(gameData);
        console.log('تم إضافة اللعبة بنجاح!');
    } catch (error) {
        console.error('خطأ في إضافة اللعبة:', error);
    }
}

// تشغيل الدالة
addGame();