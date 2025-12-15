# 🚀 دليل النشر - النظام المحسن v2.0

## 📋 المتطلبات الأساسية

### 1. إعداد Firebase
```bash
npm install -g firebase-tools
firebase login
firebase init
```

### 2. إعداد Cloud Functions
```bash
cd functions
npm install
```

### 3. نشر Cloud Functions
```bash
firebase deploy --only functions
```

### 4. تحديث قواعد Firestore
```bash
firebase deploy --only firestore:rules
```

### 5. نشر الموقع
```bash
firebase deploy --only hosting
```

## 🔧 الإعدادات المطلوبة

### Firebase Console
1. **Authentication**: تفعيل Google Sign-in
2. **Firestore**: إنشاء قاعدة البيانات
3. **Functions**: تفعيل Blaze Plan (مطلوب للـ Cloud Functions)

### قواعد Firestore الجديدة
- تم تحديث القواعد لمنع التلاعب في النقاط من الواجهة الأمامية
- فقط Cloud Functions يمكنها تعديل النقاط
- حماية شاملة من التلاعب

## 🛡️ ميزات الأمان الجديدة

### 1. نظام الجلسات الآمن
- **Server-side validation**: حساب النقاط في الخادم فقط
- **Heartbeat system**: نبضات كل دقيقة للتحقق من النشاط
- **Session limits**: حد أقصى 48 دقيقة لكل جلسة
- **Anti-cheat**: كشف محاولات التلاعب

### 2. نظام السحب المحسن
- **Atomic transactions**: معاملات ذرية لمنع الأخطاء
- **Minimum withdrawal**: رفع الحد الأدنى إلى 2 دولار
- **Secure validation**: التحقق من صحة البيانات server-side

### 3. حماية من التلاعب
- **Rate limiting**: حدود على عدد الطلبات
- **Session monitoring**: مراقبة الجلسات المشبوهة
- **Device fingerprinting**: تتبع الأجهزة (اختياري)

## 📊 هيكل البيانات الجديد

### Users Collection
```javascript
{
  uid: "user_id",
  email: "user@example.com",
  displayName: "اسم المستخدم",
  points: 0,
  dailyPoints: 0,
  lastDailyResetAt: timestamp,
  isAdmin: false,
  blocked: false,
  createdAt: timestamp,
  lastLoginAt: timestamp
}
```

### Game Sessions Collection
```javascript
{
  sessionId: "session_id",
  uid: "user_id",
  gameId: "game_id",
  startedAt: timestamp,
  endedAt: timestamp,
  status: "open|approved|rejected",
  heartbeats: 0,
  serverApprovedMinutes: 0,
  pointsAwarded: 0,
  riskScore: 0
}
```

### Withdraw Requests Collection
```javascript
{
  requestId: "request_id",
  uid: "user_id",
  amountUSDT: 2.5,
  pointsCost: 25000,
  walletTRC20: "TRC20_ADDRESS",
  status: "pending|approved|rejected|paid",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Transactions Collection
```javascript
{
  transactionId: "tx_id",
  uid: "user_id",
  type: "earn|withdraw_lock|withdraw_release|admin_adjust",
  pointsDelta: 10,
  meta: { sessionId: "...", gameId: "..." },
  createdAt: timestamp
}
```

## 🔄 Cloud Functions

### 1. startGameSession
- بدء جلسة لعب آمنة
- التحقق من الجلسات النشطة
- إنشاء session record

### 2. sessionHeartbeat
- نبضة كل دقيقة
- حساب النقاط المستحقة
- مراقبة النشاط

### 3. submitGameSession
- إنهاء الجلسة وحساب النقاط
- تحديث رصيد المستخدم
- إضافة سجل المعاملة

### 4. requestWithdraw
- طلب سحب آمن
- خصم النقاط atomically
- إنشاء طلب السحب

## 📱 تحسينات UX

### 1. الصفحات الجديدة
- `login.html`: صفحة تسجيل دخول مخصصة
- `terms.html`: الشروط والأحكام
- `privacy.html`: سياسة الخصوصية

### 2. النظام المحسن
- إشعارات في الوقت الفعلي
- واجهة مستخدم محسنة
- تجربة موبايل أفضل

## 🚨 تحذيرات مهمة

### 1. النشر
- تأكد من نشر Cloud Functions قبل الموقع
- اختبر جميع الوظائف في بيئة التطوير أولاً
- راجع قواعد Firestore قبل النشر

### 2. الأمان
- لا تعرض مفاتيح API الحساسة
- استخدم HTTPS فقط
- راقب الأنشطة المشبوهة

### 3. الأداء
- راقب استهلاك Cloud Functions
- ضع حدود على الطلبات
- استخدم التخزين المؤقت عند الإمكان

## 📞 الدعم الفني

للمساعدة في النشر أو حل المشاكل:
- البريد الإلكتروني: support@rabhne.online
- الموقع: www.rabhne.online

---

**تم تطوير هذا النظام بـ ❤️ في المملكة العربية السعودية**

© 2024 Rabhne Games. جميع الحقوق محفوظة.