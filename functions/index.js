const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// بدء جلسة لعب
exports.startGameSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const { gameId } = data;
  const uid = context.auth.uid;

  try {
    // التحقق من المستخدم
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data().blocked) {
      throw new functions.https.HttpsError('permission-denied', 'حساب محظور');
    }

    // التحقق من الجلسات النشطة
    const activeSessions = await db.collection('game_sessions')
      .where('uid', '==', uid)
      .where('status', '==', 'open')
      .get();

    if (!activeSessions.empty) {
      throw new functions.https.HttpsError('already-exists', 'لديك جلسة نشطة بالفعل');
    }

    // إنشاء جلسة جديدة
    const sessionRef = await db.collection('game_sessions').add({
      uid,
      gameId,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'open',
      heartbeats: 0,
      clientMinutesClaimed: 0,
      serverApprovedMinutes: 0,
      riskScore: 0
    });

    return { sessionId: sessionRef.id };
  } catch (error) {
    console.error('Error starting session:', error);
    throw new functions.https.HttpsError('internal', 'خطأ في بدء الجلسة');
  }
});

// نبضة الجلسة (كل دقيقة)
exports.sessionHeartbeat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const { sessionId } = data;
  const uid = context.auth.uid;

  try {
    const sessionRef = db.collection('game_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists || sessionDoc.data().uid !== uid || sessionDoc.data().status !== 'open') {
      throw new functions.https.HttpsError('not-found', 'جلسة غير صحيحة');
    }

    const sessionData = sessionDoc.data();
    const now = new Date();
    const startTime = sessionData.startedAt.toDate();
    const minutesElapsed = Math.floor((now - startTime) / 60000);

    // حساب النقاط المستحقة
    const maxMinutes = Math.min(minutesElapsed, 48); // حد أقصى 48 دقيقة (2880 نقطة يومياً / 60)
    const newHeartbeats = sessionData.heartbeats + 1;

    // تحديث الجلسة
    await sessionRef.update({
      heartbeats: newHeartbeats,
      lastHeartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
      serverApprovedMinutes: maxMinutes
    });

    return { 
      approvedMinutes: maxMinutes,
      heartbeats: newHeartbeats
    };
  } catch (error) {
    console.error('Error in heartbeat:', error);
    throw new functions.https.HttpsError('internal', 'خطأ في النبضة');
  }
});

// إنهاء الجلسة وحساب النقاط
exports.submitGameSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const { sessionId } = data;
  const uid = context.auth.uid;

  try {
    return await db.runTransaction(async (transaction) => {
      const sessionRef = db.collection('game_sessions').doc(sessionId);
      const userRef = db.collection('users').doc(uid);

      const sessionDoc = await transaction.get(sessionRef);
      const userDoc = await transaction.get(userRef);

      if (!sessionDoc.exists || sessionDoc.data().uid !== uid) {
        throw new functions.https.HttpsError('not-found', 'جلسة غير صحيحة');
      }

      if (!userDoc.exists || userDoc.data().blocked) {
        throw new functions.https.HttpsError('permission-denied', 'حساب محظور');
      }

      const sessionData = sessionDoc.data();
      const userData = userDoc.data();

      if (sessionData.status !== 'open') {
        throw new functions.https.HttpsError('failed-precondition', 'الجلسة مغلقة بالفعل');
      }

      // حساب النقاط المستحقة
      const pointsEarned = Math.min(sessionData.serverApprovedMinutes, 48); // حد أقصى 48 نقطة لكل جلسة

      // التحقق من الحد اليومي
      const today = new Date().toDateString();
      const lastResetDate = userData.lastDailyResetAt ? userData.lastDailyResetAt.toDate().toDateString() : null;
      let dailyPoints = userData.dailyPoints || 0;

      if (lastResetDate !== today) {
        dailyPoints = 0;
      }

      const newDailyPoints = dailyPoints + pointsEarned;
      if (newDailyPoints > 2880) {
        const allowedPoints = Math.max(0, 2880 - dailyPoints);
        throw new functions.https.HttpsError('resource-exhausted', `تجاوزت الحد اليومي. يمكنك الحصول على ${allowedPoints} نقطة فقط`);
      }

      // تحديث المستخدم
      transaction.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsEarned),
        dailyPoints: newDailyPoints,
        lastDailyResetAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // إغلاق الجلسة
      transaction.update(sessionRef, {
        status: 'approved',
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
        pointsAwarded: pointsEarned
      });

      // إضافة معاملة
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        uid,
        type: 'earn',
        pointsDelta: pointsEarned,
        meta: { sessionId, gameId: sessionData.gameId },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { pointsEarned, newTotal: userData.points + pointsEarned };
    });
  } catch (error) {
    console.error('Error submitting session:', error);
    throw error;
  }
});

// طلب سحب آمن
exports.requestWithdraw = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const { amountUSDT, walletTRC20 } = data;
  const uid = context.auth.uid;

  if (!amountUSDT || amountUSDT < 2 || !walletTRC20) {
    throw new functions.https.HttpsError('invalid-argument', 'بيانات غير صحيحة');
  }

  const pointsCost = amountUSDT * 10000;

  try {
    return await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists || userDoc.data().blocked) {
        throw new functions.https.HttpsError('permission-denied', 'حساب محظور');
      }

      const userData = userDoc.data();
      if (userData.points < pointsCost) {
        throw new functions.https.HttpsError('failed-precondition', 'نقاط غير كافية');
      }

      // خصم النقاط
      transaction.update(userRef, {
        points: admin.firestore.FieldValue.increment(-pointsCost)
      });

      // إنشاء طلب السحب
      const withdrawRef = db.collection('withdraw_requests').doc();
      transaction.set(withdrawRef, {
        uid,
        amountUSDT,
        pointsCost,
        walletTRC20,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // إضافة معاملة
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        uid,
        type: 'withdraw_lock',
        pointsDelta: -pointsCost,
        meta: { withdrawRequestId: withdrawRef.id, amountUSDT },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, requestId: withdrawRef.id };
    });
  } catch (error) {
    console.error('Error requesting withdraw:', error);
    throw error;
  }
});