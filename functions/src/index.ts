import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()

// Request withdraw function
export const requestWithdraw = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const { walletTRC20, amountUSDT } = data
  const uid = context.auth.uid

  // Validation
  if (!walletTRC20 || typeof walletTRC20 !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid wallet address')
  }

  if (!amountUSDT || typeof amountUSDT !== 'number' || amountUSDT < 2) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid amount')
  }

  // Validate TRC20 address format
  if (!walletTRC20.startsWith('T') || walletTRC20.length !== 34) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid TRC20 address format')
  }

  const pointsCost = amountUSDT * 10000 // 10,000 points = $1

  try {
    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(uid)
      const userDoc = await transaction.get(userRef)

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found')
      }

      const userData = userDoc.data()!
      const currentPoints = userData.points || 0

      if (currentPoints < pointsCost) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient points')
      }

      // Create withdraw request
      const withdrawRef = db.collection('withdraw_requests').doc()
      const withdrawData = {
        uid,
        walletTRC20,
        amountUSDT,
        pointsCost,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }

      // Lock points (deduct from user balance)
      const newPoints = currentPoints - pointsCost
      transaction.update(userRef, { points: newPoints })

      // Create withdraw request
      transaction.set(withdrawRef, withdrawData)

      // Create transaction record
      const transactionRef = db.collection('transactions').doc()
      const transactionData = {
        uid,
        type: 'withdraw_lock',
        pointsDelta: -pointsCost,
        pointsBalance: newPoints,
        meta: {
          withdrawRequestId: withdrawRef.id,
          reason: `طلب سحب $${amountUSDT}`,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }
      transaction.set(transactionRef, transactionData)

      return withdrawRef.id
    })

    return { success: true, message: 'Withdraw request created successfully' }
  } catch (error) {
    console.error('Error creating withdraw request:', error)
    throw new functions.https.HttpsError('internal', 'Failed to create withdraw request')
  }
})

// Admin approve withdraw
export const adminApproveWithdraw = functions.https.onCall(async (data, context) => {
  // Verify authentication and admin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const userRecord = await admin.auth().getUser(context.auth.uid)
  const isAdmin = userRecord.customClaims?.admin === true

  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'User must be admin')
  }

  const { withdrawRequestId } = data

  if (!withdrawRequestId) {
    throw new functions.https.HttpsError('invalid-argument', 'Withdraw request ID is required')
  }

  try {
    const withdrawRef = db.collection('withdraw_requests').doc(withdrawRequestId)
    const withdrawDoc = await withdrawRef.get()

    if (!withdrawDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Withdraw request not found')
    }

    const withdrawData = withdrawDoc.data()!

    if (withdrawData.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Withdraw request is not pending')
    }

    // Update withdraw request status
    await withdrawRef.update({
      status: 'approved',
      processedBy: context.auth.uid,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true, message: 'Withdraw request approved' }
  } catch (error) {
    console.error('Error approving withdraw request:', error)
    throw new functions.https.HttpsError('internal', 'Failed to approve withdraw request')
  }
})

// Admin reject withdraw
export const adminRejectWithdraw = functions.https.onCall(async (data, context) => {
  // Verify authentication and admin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const userRecord = await admin.auth().getUser(context.auth.uid)
  const isAdmin = userRecord.customClaims?.admin === true

  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'User must be admin')
  }

  const { withdrawRequestId, reason } = data

  if (!withdrawRequestId) {
    throw new functions.https.HttpsError('invalid-argument', 'Withdraw request ID is required')
  }

  try {
    await db.runTransaction(async (transaction) => {
      const withdrawRef = db.collection('withdraw_requests').doc(withdrawRequestId)
      const withdrawDoc = await transaction.get(withdrawRef)

      if (!withdrawDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Withdraw request not found')
      }

      const withdrawData = withdrawDoc.data()!

      if (withdrawData.status !== 'pending') {
        throw new functions.https.HttpsError('failed-precondition', 'Withdraw request is not pending')
      }

      // Return points to user
      const userRef = db.collection('users').doc(withdrawData.uid)
      const userDoc = await transaction.get(userRef)

      if (userDoc.exists) {
        const userData = userDoc.data()!
        const newPoints = (userData.points || 0) + withdrawData.pointsCost

        transaction.update(userRef, { points: newPoints })

        // Create transaction record for points return
        const transactionRef = db.collection('transactions').doc()
        const transactionData = {
          uid: withdrawData.uid,
          type: 'withdraw_unlock',
          pointsDelta: withdrawData.pointsCost,
          pointsBalance: newPoints,
          meta: {
            withdrawRequestId,
            reason: `إلغاء طلب سحب - ${reason || 'لم يتم تحديد السبب'}`,
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }
        transaction.set(transactionRef, transactionData)
      }

      // Update withdraw request status
      transaction.update(withdrawRef, {
        status: 'rejected',
        processedBy: context.auth.uid,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        notes: reason || 'لم يتم تحديد السبب',
      })
    })

    return { success: true, message: 'Withdraw request rejected and points returned' }
  } catch (error) {
    console.error('Error rejecting withdraw request:', error)
    throw new functions.https.HttpsError('internal', 'Failed to reject withdraw request')
  }
})

// Admin mark as paid
export const adminMarkPaid = functions.https.onCall(async (data, context) => {
  // Verify authentication and admin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const userRecord = await admin.auth().getUser(context.auth.uid)
  const isAdmin = userRecord.customClaims?.admin === true

  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'User must be admin')
  }

  const { withdrawRequestId, txHash } = data

  if (!withdrawRequestId) {
    throw new functions.https.HttpsError('invalid-argument', 'Withdraw request ID is required')
  }

  try {
    const withdrawRef = db.collection('withdraw_requests').doc(withdrawRequestId)
    const withdrawDoc = await withdrawRef.get()

    if (!withdrawDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Withdraw request not found')
    }

    const withdrawData = withdrawDoc.data()!

    if (withdrawData.status !== 'approved') {
      throw new functions.https.HttpsError('failed-precondition', 'Withdraw request must be approved first')
    }

    // Update withdraw request status
    await withdrawRef.update({
      status: 'paid',
      txHash: txHash || null,
      processedBy: context.auth.uid,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true, message: 'Withdraw request marked as paid' }
  } catch (error) {
    console.error('Error marking withdraw as paid:', error)
    throw new functions.https.HttpsError('internal', 'Failed to mark withdraw as paid')
  }
})

// Placeholder functions for Phase 2
export const startSession = functions.https.onCall(async (data, context) => {
  // Phase 2: Implement game session tracking
  return { success: true, message: 'Session tracking will be implemented in Phase 2' }
})

export const heartbeat = functions.https.onCall(async (data, context) => {
  // Phase 2: Implement session heartbeat
  return { success: true, message: 'Heartbeat tracking will be implemented in Phase 2' }
})

export const submitSession = functions.https.onCall(async (data, context) => {
  // Phase 2: Implement session submission and points awarding
  return { success: true, message: 'Session submission will be implemented in Phase 2' }
})