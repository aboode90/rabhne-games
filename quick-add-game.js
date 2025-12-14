// نسخ هذا الكود في وحدة التحكم للمتصفح بعد تسجيل الدخول في الموقع الأصلي

const gameData = {
    title: "Foxy Eco Sort",
    slug: "foxy-eco-sort",
    iframeUrl: "https://html5.gamedistribution.com/rvvASWA4/8e3527971f5c4457b0691897f02111bb/index.html",
    thumbnail: "https://img.gamedistribution.com/8e3527971f5c4457b0691897f02111bb-512x384.jpeg",
    category: "puzzle",
    active: true,
    plays: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

// تشغيل الكود
db.collection('games').add(gameData)
.then(docRef => {
    console.log('✅ تمت إضافة اللعبة بنجاح!');
    console.log('🆔 معرف اللعبة:', docRef.id);
    alert('تمت إضافة لعبة Foxy Eco Sort بنجاح!\nالمعرف: ' + docRef.id);
})
.catch(error => {
    console.error('❌ خطأ:', error);
    alert('حدث خطأ: ' + error.message);
});