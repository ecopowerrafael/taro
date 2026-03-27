export const savePushSubscription = async ({ pool, userId, subscription, userAgent = null }) => {
  const endpoint = subscription?.endpoint
  const p256dh = subscription?.keys?.p256dh
  const auth = subscription?.keys?.auth

  if (!userId || !endpoint || !p256dh || !auth) {
    throw new Error('Subscription push inválida.')
  }

  await pool.query(
    `
      INSERT INTO push_subscriptions (
        userId,
        endpoint,
        p256dh,
        auth,
        userAgent,
        isActive,
        failureCount,
        createdAt,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, 1, 0, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        userId = VALUES(userId),
        p256dh = VALUES(p256dh),
        auth = VALUES(auth),
        userAgent = VALUES(userAgent),
        isActive = 1,
        updatedAt = NOW()
    `,
    [userId, endpoint, p256dh, auth, userAgent],
  )
}

export const getActiveSubscriptionsByUserIds = async ({ pool, userIds }) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return []
  }

  const uniqueUserIds = [...new Set(userIds.filter(Boolean))]
  if (uniqueUserIds.length === 0) {
    return []
  }

  const placeholders = uniqueUserIds.map(() => '?').join(', ')
  const [rows] = await pool.query(
    `
      SELECT userId, endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE isActive = 1 AND userId IN (${placeholders})
    `,
    uniqueUserIds,
  )

  return rows.map((row) => ({
    userId: row.userId,
    subscription: {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    },
  }))
}

export const markSubscriptionFailure = async ({ pool, endpoint }) => {
  if (!endpoint) {
    return
  }

  await pool.query(
    `
      UPDATE push_subscriptions
      SET
        failureCount = failureCount + 1,
        lastFailureAt = NOW(),
        isActive = 0,
        updatedAt = NOW()
      WHERE endpoint = ?
    `,
    [endpoint],
  )
}

export const markSubscriptionSuccess = async ({ pool, endpoint }) => {
  if (!endpoint) {
    return
  }

  await pool.query(
    `
      UPDATE push_subscriptions
      SET
        failureCount = 0,
        lastSuccessAt = NOW(),
        isActive = 1,
        updatedAt = NOW()
      WHERE endpoint = ?
    `,
    [endpoint],
  )
}

export const sendPushToUsers = async ({ pool, webpush, userIds, payload }) => {
  const subscriptions = await getActiveSubscriptionsByUserIds({ pool, userIds })
  const results = []

  await Promise.all(
    subscriptions.map(async ({ userId, subscription }) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload))
        await markSubscriptionSuccess({ pool, endpoint: subscription.endpoint })
        results.push({ ok: true, userId, endpoint: subscription.endpoint })
      } catch (error) {
        const statusCode = error?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await markSubscriptionFailure({ pool, endpoint: subscription.endpoint })
        }
        results.push({ ok: false, userId, endpoint: subscription.endpoint, error })
      }
    }),
  )

  return {
    totalSubscriptions: subscriptions.length,
    successCount: results.filter((item) => item.ok).length,
    failureCount: results.filter((item) => !item.ok).length,
    results,
  }
}

export const getUserIdsByRole = async ({ pool, targetRole = 'all' }) => {
  let query = 'SELECT id FROM users'
  const params = []

  if (targetRole !== 'all') {
    query += ' WHERE role = ?'
    params.push(targetRole)
  }

  const [rows] = await pool.query(query, params)
  return rows.map((row) => row.id)
}