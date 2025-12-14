// إضافة لعبة Foxy Eco Sort مباشرة إلى Firebase
// انسخ هذا الكود في وحدة التحكم بعد تسجيل الدخول

const foxyEcoSortGame = {
    title: "Foxy Eco Sort",
    slug: "foxy-eco-sort",
    iframeUrl: "https://html5.gamedistribution.com/rvvASWA4/8e3527971f5c4457b0691897f02111bb/index.html",
    thumbnail: "https://img.gamedistribution.com/8e3527971f5c4457b0691897f02111bb-512x384.jpeg",
    category: "puzzle",
    active: true,
    plays: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

// تنفيذ الإضافة
db.collection('games').add(foxyEcoSortGame)
.then(docRef => {
    console.log('✅ تمت إضافة Foxy Eco Sort بنجاح!');
    console.log('🆔 معرف اللعبة:', docRef.id);
    alert('🎮 تمت إضافة لعبة Foxy Eco Sort بنجاح!\n\n🆔 المعرف: ' + docRef.id + '\n📂 الفئة: ألغاز\n🔗 يمكنك الآن العثور عليها في صفحة الألعاب');
})
.catch(error => {
    if (error.code === 'permission-denied') {
        alert('❌ ليس لديك صلاحيات لإضافة الألعاب\nيرجى التأكد من تسجيل الدخول كمسؤول');
    } else {
        console.error('❌ خطأ في الإضافة:', error);
        alert('❌ حدث خطأ: ' + error.message);
    }
});