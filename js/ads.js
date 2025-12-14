// Ads Logic with AdCash VAST Integration

// Simulate loading an ad SDK
// In real life, this would initialize AdMob/AdSense
console.log('Ads System Initialized');

// Show AdCash rewarded video ad
function showRewardedAd(callback) {
    const btn = document.getElementById('btnWatchAd');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ جاري تحميل الإعلان...';
    }

    // Try to show AdCash VAST video ad first
    showAdCashVASTAd(callback);
}

// Show AdCash VAST video ad
function showAdCashVASTAd(callback) {
    try {
        // AdCash VAST Tag URL for rewarded ads (PROVIDED BY YOU)
        const vastTagUrl = 'https://youradexchange.com/video/select.php?r=10711262';
        
        // Create video player container
        const adContainer = document.createElement('div');
        adContainer.id = 'rewarded-ad-container';
        adContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        `;
        
        adContainer.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; max-width: 90%;">
                <h3>🎬 شاهد الإعلان للمكافأة</h3>
                <p>سيتم احتساب المكافأة تلقائياً بعد مشاهدة الإعلان</p>
                <div id="rewarded-video-container" style="margin: 20px 0; width: 640px; height: 360px;">
                    <div id="rewarded-video-player" class="video-js vjs-default-skin" controls preload="auto" width="640" height="360">
                        <source src="" type="video/mp4">
                    </video>
                </div>
                <button id="close-rewarded-ad-btn" class="btn btn-secondary" style="display: none;">إغلاق</button>
            </div>
        `;
        
        document.body.appendChild(adContainer);
        
        // Load Video.js if not already loaded
        if (typeof videojs === 'undefined') {
            // Load Video.js CSS
            const videoCSS = document.createElement('link');
            videoCSS.rel = 'stylesheet';
            videoCSS.href = 'https://vjs.zencdn.net/8.6.1/video-js.css';
            document.head.appendChild(videoCSS);
            
            // Load Video.js and IMA plugin
            const videoScript = document.createElement('script');
            videoScript.src = 'https://vjs.zencdn.net/8.6.1/video.min.js';
            document.head.appendChild(videoScript);
            
            const imaScript = document.createElement('script');
            imaScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/videojs-contrib-ads/6.9.0/videojs-contrib-ads.min.js';
            document.head.appendChild(imaScript);
            
            videoScript.onload = function() {
                imaScript.onload = function() {
                    initializeVASTPlayer(vastTagUrl, callback, adContainer);
                };
            };
        } else {
            initializeVASTPlayer(vastTagUrl, callback, adContainer);
        }
        
    } catch (error) {
        console.error('Error showing AdCash VAST ad:', error);
        fallbackToSimulation(callback);
    }
}

// Initialize VAST player
function initializeVASTPlayer(vastTagUrl, callback, container) {
    try {
        // Initialize player
        const player = videojs('rewarded-video-player', {
            autoplay: true,
            controls: true,
            responsive: true
        });
        
        // Load contrib-ads plugin
        player.ready(function() {
            player.ads();
            
            // Play VAST ad
            player.src(vastTagUrl);
            
            player.on('ended', function() {
                console.log('AdCash VAST ad completed');
                container.remove();
                if (callback) {
                    callback();
                } else {
                    grantAdReward();
                }
            });
            
            player.on('error', function() {
                console.log('AdCash VAST ad error');
                container.remove();
                fallbackToSimulation(callback);
            });
        });
        
        // Show close button after delay
        setTimeout(() => {
            const closeBtn = document.getElementById('close-rewarded-ad-btn');
            if (closeBtn) {
                closeBtn.style.display = 'block';
                closeBtn.onclick = function() {
                    container.remove();
                    fallbackToSimulation(callback);
                };
            }
        }, 10000);
        
    } catch (error) {
        console.error('Error initializing VAST player:', error);
        container.remove();
        fallbackToSimulation(callback);
    }
}

// Fallback to simulation
function fallbackToSimulation(callback) {
    setTimeout(() => {
        const userConfirmed = confirm('🎥 (محاكاة) هل شاهدت الفيديو للنهاية؟\n\nفي النسخة الحقيقية، لن تظهر هذه الرسالة بل سيظهر فيديو إعلاني حقيقي.');
        
        if (userConfirmed) {
            if (callback) {
                callback();
            } else {
                grantAdReward();
            }
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

// Make functions globally available
window.showRewardedAd = showRewardedAd;