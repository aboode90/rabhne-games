// نظام السحب الآمن مع معاملات ذرية
class SecureWithdrawSystem {
    constructor() {
        this.isProcessing = false;
        this.minWithdraw = 2; // 2 دولار كحد أدنى
        this.pointsPerDollar = 10000;
    }

    // طلب سحب آمن
    async requestWithdraw(amountUSDT, walletTRC20) {
        if (this.isProcessing) {
            showMessage('يتم معالجة طلب سابق...', 'warning');
            return false;
        }

        // التحقق من صحة البيانات
        if (!this.validateWithdrawData(amountUSDT, walletTRC20)) {
            return false;
        }

        this.isProcessing = true;
        this.updateUI(true);

        try {
            // استدعاء Cloud Function للسحب الآمن
            const requestWithdraw = firebase.functions().httpsCallable('requestWithdraw');
            const result = await requestWithdraw({
                amountUSDT: parseFloat(amountUSDT),
                walletTRC20: walletTRC20.trim()
            });

            if (result.data.success) {
                showMessage(`✅ تم إرسال طلب السحب بنجاح! رقم الطلب: ${result.data.requestId}`, 'success');
                
                // إعادة تحميل البيانات
                if (window.loadUserPoints) {
                    window.loadUserPoints();
                }
                if (window.loadWithdrawRequests) {
                    window.loadWithdrawRequests();
                }

                // مسح النموذج
                this.clearForm();
                return true;
            }

        } catch (error) {
            console.error('Withdraw error:', error);
            let errorMessage = 'حدث خطأ في طلب السحب';
            
            if (error.code === 'failed-precondition') {
                errorMessage = 'نقاط غير كافية للسحب';
            } else if (error.code === 'permission-denied') {
                errorMessage = 'حسابك محظور من السحب';
            } else if (error.message) {
                errorMessage = error.message;
            }

            showMessage(errorMessage, 'error');
            return false;

        } finally {
            this.isProcessing = false;
            this.updateUI(false);
        }
    }

    // التحقق من صحة بيانات السحب
    validateWithdrawData(amountUSDT, walletTRC20) {
        // التحقق من المبلغ
        const amount = parseFloat(amountUSDT);
        if (isNaN(amount) || amount < this.minWithdraw) {
            showMessage(`الحد الأدنى للسحب هو ${this.minWithdraw} دولار`, 'error');
            return false;
        }

        if (amount > 1000) {
            showMessage('الحد الأقصى للسحب هو 1000 دولار', 'error');
            return false;
        }

        // التحقق من محفظة TRC20
        if (!walletTRC20 || walletTRC20.trim().length < 34) {
            showMessage('عنوان المحفظة غير صحيح', 'error');
            return false;
        }

        // التحقق من أن العنوان يبدأ بـ T (TRC20)
        if (!walletTRC20.trim().startsWith('T')) {
            showMessage('يجب أن يبدأ عنوان محفظة TRC20 بحرف T', 'error');
            return false;
        }

        return true;
    }

    // حساب النقاط المطلوبة
    calculateRequiredPoints(amountUSDT) {
        return parseFloat(amountUSDT) * this.pointsPerDollar;
    }

    // تحديث واجهة المستخدم
    updateUI(isProcessing) {
        const submitBtn = document.getElementById('submitWithdrawBtn');
        const amountInput = document.getElementById('withdrawAmount');
        const walletInput = document.getElementById('walletAddress');

        if (submitBtn) {
            submitBtn.disabled = isProcessing;
            submitBtn.textContent = isProcessing ? 'جاري المعالجة...' : 'إرسال طلب السحب';
        }

        if (amountInput) amountInput.disabled = isProcessing;
        if (walletInput) walletInput.disabled = isProcessing;
    }

    // مسح النموذج
    clearForm() {
        const amountInput = document.getElementById('withdrawAmount');
        const walletInput = document.getElementById('walletAddress');

        if (amountInput) amountInput.value = '';
        if (walletInput) walletInput.value = '';
    }

    // تحديث عرض النقاط المطلوبة
    updateRequiredPoints() {
        const amountInput = document.getElementById('withdrawAmount');
        const requiredPointsEl = document.getElementById('requiredPoints');

        if (amountInput && requiredPointsEl) {
            const amount = parseFloat(amountInput.value) || 0;
            const requiredPoints = this.calculateRequiredPoints(amount);
            requiredPointsEl.textContent = requiredPoints.toLocaleString();
        }
    }
}

// إنشاء مثيل عام
const secureWithdraw = new SecureWithdrawSystem();

// دالة عامة لطلب السحب
window.requestSecureWithdraw = function() {
    const amountInput = document.getElementById('withdrawAmount');
    const walletInput = document.getElementById('walletAddress');

    if (!amountInput || !walletInput) {
        showMessage('خطأ في النموذج', 'error');
        return;
    }

    secureWithdraw.requestWithdraw(amountInput.value, walletInput.value);
};

// ربط الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const submitBtn = document.getElementById('submitWithdrawBtn');
    const amountInput = document.getElementById('withdrawAmount');

    if (submitBtn) {
        submitBtn.onclick = requestSecureWithdraw;
    }

    if (amountInput) {
        amountInput.addEventListener('input', () => {
            secureWithdraw.updateRequiredPoints();
        });
    }

    // تحديث النقاط المطلوبة عند التحميل
    secureWithdraw.updateRequiredPoints();
});