// Ads Logic (Placeholder)

// Simulate loading an ad SDK
// In real life, this would initialize AdMob/AdSense
console.log('Ads System Initialized');

function showRewardedAd() {
    const btn = document.getElementById('btnWatchAd');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ جاري تحميل الإعلان...';
    }

    // Simulate waiting for ad (3 seconds)
    setTimeout(() => {
        // In reality, here we call: ad.show()
        // And wait for 'onReward' callback

        const userConfirmed = confirm('🎥 (محاكاة) هل شاهدت الفيديو للنهاية؟\n\nفي النسخة الحقيقية، لن تظهر هذه الرسالة بل سيظهر فيديو إعلاني حقيقي.');

        if (userConfirmed) {
            grantAdReward();
        } else {
            alert('❌ لم تكمل المشاهدة، لن تحصل على المكافأة.');
            resetAdButton();
        }
    }, 2000);
}

async function grantAdReward() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        // Give 10 points for watching ad
        const rewardPoints = 10;

        await db.collection('users').doc(user.uid).update({
            points: firebase.firestore.FieldValue.increment(rewardPoints)
        });

        // Log transaction
        await db.collection('transactions').add({
            uid: user.uid,
            type: 'ad_reward',
            amount: rewardPoints,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            note: 'مكافأة مشاهدة فيديو'
        });

        alert(`🎉 مبروك! حصلت على ${rewardPoints} نقطة.`);
        resetAdButton();

        // Refresh points
        if (typeof loadUserPoints === 'function') loadUserPoints();

    } catch (error) {
        console.error(error);
        alert('حدث خطأ في استلام المكافأة');
        resetAdButton();
    }
}

function resetAdButton(element) {
    const btn = element || document.getElementById('btnWatchAd');
    if (btn) {
        btn.disabled = false;
        // Check context to set correct text
        if (btn.id === 'btnUnlockGame') {
            btn.innerHTML = '🔓 شاهد فيديو لفتح اللعبة';
        } else {
            btn.innerHTML = '🎬 شاهد فيديو واربح (+10)';
        }
    }
}
