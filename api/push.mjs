const PUSH_PROFILES = {
  incoming_call: {
    channelId: 'incoming_calls_v2',
    deliveryPriority: 'high',
    urgency: 'call',
    requireInteraction: true,
    fullScreen: true,
    ttlMs: 45000,
  },
  new_question: {
    channelId: 'consultant_questions',
    deliveryPriority: 'high',
    urgency: 'urgent',
    requireInteraction: true,
    fullScreen: false,
    ttlMs: 3600000,
  },
  question_answered: {
    channelId: 'client_answers',
    deliveryPriority: 'high',
    urgency: 'urgent',
    requireInteraction: true,
    fullScreen: false,
    ttlMs: 3600000,
  },
}

const normalizePushPayload = (payload = {}) => {
  const type = payload.type || 'info'
  const profile = PUSH_PROFILES[type] || {}

  return {
    title: payload.title || 'NotificaÃ§Ã£o',
    body: payload.body || '',
    url: payload.url || 'https://appastria.online/',
    nativeRoute: payload.nativeRoute || '/',
    type,
    channelId: payload.channelId || profile.channelId || 'general_updates',
    deliveryPriority: payload.deliveryPriority || profile.deliveryPriority || 'normal',
    urgency: payload.urgency || profile.urgency || 'default',
    requireInteraction:
      typeof payload.requireInteraction === 'boolean'
        ? payload.requireInteraction
        : Boolean(profile.requireInteraction),
    fullScreen:
      typeof payload.fullScreen === 'boolean'
        ? payload.fullScreen
        : Boolean(profile.fullScreen),
    ttlMs: Number(payload.ttlMs) || profile.ttlMs || 3600000,
    data: payload.data && typeof payload.data === 'object' ? payload.data : {},
  }
}

const toFirebaseDataMap = (payload) => {
  const rawData = {
    title: payload.title,
    body: payload.body,
    url: payload.url,
    nativeRoute: payload.nativeRoute,
    type: payload.type,
    channelId: payload.channelId,
    deliveryPriority: payload.deliveryPriority,
    urgency: payload.urgency,
    requireInteraction: String(Boolean(payload.requireInteraction)),
    fullScreen: String(Boolean(payload.fullScreen)),
    ttlMs: String(payload.ttlMs),
    ...payload.data,
  }

  // Se for notificaÃ§Ã£o de chamada, injetar a key "call" que o capacitor-incoming-call-kit intercepta nativamente.
  if (payload.type === 'incoming_call') {
    const callData = {
      id: payload.sessionId || `call-${Date.now()}`,
      nameCaller: payload.customerName || 'Cliente Astria',
      appName: 'Astria Tarot',
      avatar: 'https://appastria.online/pwa-192x192.png',
      handle: 'Consulta por VÃ­deo',
      type: 1, // 0 = Ãudio, 1 = VÃ­deo
      duration: 30000,
      textAccept: 'Atender',
      textDecline: 'Recusar',
      missedCallColor: '#F44336',
      extra: {
        sessionId: payload.sessionId,
        roomUrl: payload.roomUrl,
        consultantId: payload.consultantId
      },
      android: {
        isCustomNotification: true,
        isShowLogo: true,
        ringtonePath: 'system_ringtone_default',
        backgroundColor: '#1E1E2F', // Tema do Astria
        backgroundUrl: '',
        actionColor: '#4CAF50',
        textColor: '#FFFFFF',
        isShowFullLockedScreen: true
      }
    }
    rawData.call = JSON.stringify(callData)
  }
    // Se for cancelamento de chamada, injetar key deleteCall
    if (payload.type === 'cancel_call') {
      rawData.deleteCall = JSON.stringify({
        id: payload.sessionId,
        extra: { sessionId: payload.sessionId }
      })
    }
  return Object.entries(rawData).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null) {
      return accumulator
    }

    accumulator[key] = typeof value === 'string' ? value : JSON.stringify(value)
    return accumulator
  }, {})
}

export const savePushSubscription = async ({ pool, userId, subscription, userAgent = null }) => {
  const endpoint = subscription?.endpoint
  const p256dh = subscription?.keys?.p256dh
  const auth = subscription?.keys?.auth

  if (!userId || !endpoint || !p256dh || !auth) {
    throw new Error('Subscription push invÃ¡lida.')
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

export const saveNativePushToken = async ({
  pool,
  userId,
  token,
  platform = 'android',
  provider = 'fcm',
  deviceId = null,
  appVersion = null,
}) => {
  if (!userId || !token) {
    throw new Error('Token push nativo invÃ¡lido.')
  }

  await pool.query(
    `
      INSERT INTO native_push_tokens (
        userId,
        token,
        platform,
        provider,
        deviceId,
        appVersion,
        isActive,
        failureCount,
        createdAt,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        userId = VALUES(userId),
        platform = VALUES(platform),
        provider = VALUES(provider),
        deviceId = VALUES(deviceId),
        appVersion = VALUES(appVersion),
        isActive = 1,
        updatedAt = NOW()
    `,
    [userId, token, platform, provider, deviceId, appVersion],
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

export const getActiveNativeTokensByUserIds = async ({ pool, userIds }) => {
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
      SELECT userId, token, platform, provider
      FROM native_push_tokens
      WHERE isActive = 1 AND userId IN (${placeholders})
    `,
    uniqueUserIds,
  )

  return rows.map((row) => ({
    userId: row.userId,
    token: row.token,
    platform: row.platform,
    provider: row.provider,
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

export const markNativePushTokenFailure = async ({ pool, token }) => {
  if (!token) {
    return
  }

  await pool.query(
    `
      UPDATE native_push_tokens
      SET
        failureCount = failureCount + 1,
        lastFailureAt = NOW(),
        isActive = 0,
        updatedAt = NOW()
      WHERE token = ?
    `,
    [token],
  )
}

export const markNativePushTokenSuccess = async ({ pool, token }) => {
  if (!token) {
    return
  }

  await pool.query(
    `
      UPDATE native_push_tokens
      SET
        failureCount = 0,
        lastSuccessAt = NOW(),
        isActive = 1,
        updatedAt = NOW()
      WHERE token = ?
    `,
    [token],
  )
}

const sendWebPushToUsers = async ({ pool, webpush, userIds, payload }) => {
  if (!webpush) {
    return {
      totalSubscriptions: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
    }
  }

  const subscriptions = await getActiveSubscriptionsByUserIds({ pool, userIds })
  const results = []

  await Promise.all(
    subscriptions.map(async ({ userId, subscription }) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload))
        await markSubscriptionSuccess({ pool, endpoint: subscription.endpoint })
        results.push({
          ok: true,
          userId,
          endpoint: subscription.endpoint,
          endpointPreview: `${subscription.endpoint.slice(0, 48)}...`,
        })
      } catch (error) {
        const statusCode = error?.statusCode
        const message = error?.body || error?.message || ''
        const hasVapidMismatch =
          statusCode === 403 &&
          typeof message === 'string' &&
          message.toLowerCase().includes('do not correspond to the credentials used to create the subscriptions')

        if (statusCode === 404 || statusCode === 410 || hasVapidMismatch) {
          await markSubscriptionFailure({ pool, endpoint: subscription.endpoint })
        }

        results.push({
          ok: false,
          userId,
          endpoint: subscription.endpoint,
          endpointPreview: `${subscription.endpoint.slice(0, 48)}...`,
          error: {
            statusCode: error?.statusCode || null,
            message: error?.body || error?.message || 'Erro desconhecido no web-push',
            headers: error?.headers || null,
          },
        })
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

const sendNativePushToUsers = async ({ pool, firebaseAdmin, userIds, payload }) => {
  if (!firebaseAdmin) {
    console.warn('[sendNativePushToUsers] âš ï¸ Firebase Admin nÃ£o disponÃ­vel')
    return {
      totalSubscriptions: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
    }
  }

  const registrations = await getActiveNativeTokensByUserIds({ pool, userIds })
  console.log(`[sendNativePushToUsers] ðŸ” Encontrados ${registrations.length} tokens nativos para userIds:`, userIds)
  
  if (registrations.length === 0) {
    console.warn('[sendNativePushToUsers] âš ï¸ Nenhum token nativo encontrado para:', userIds)
    return {
      totalSubscriptions: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
    }
  }

  const results = []
  const data = toFirebaseDataMap(payload)
  
  console.log('[sendNativePushToUsers] ðŸ“¦ Data map keys:', Object.keys(data))

  await Promise.all(
    registrations.map(async ({ userId, token, platform, provider }) => {
      try {
        console.log(`[sendNativePushToUsers] ðŸ“¤ Enviando FCM para ${userId} (${platform}/${provider})`)
        console.log(`[sendNativePushToUsers]   Token: ${token.slice(0, 40)}...`)
        
        const fcmPayload = { token, data }

        if (payload.type !== 'incoming_call' && payload.type !== 'cancel_call') {
          fcmPayload.notification = {
            title: data.title,
            body: data.body,
          }
          fcmPayload.android = {
            notification: {
              channelId: data.channelId,
              clickAction: 'FCM_PLUGIN_ACTIVITY',
              sound: 'default',
            },
            directBootOk: true,
            restrictedPackageName: 'com.astria.taromobile',
            priority: 'high'
          }
        } else {
          // Chamadas DEVEM ser apenas data-messages para acordar o app em background
          fcmPayload.android = {
            priority: 'high',
            directBootOk: true,
            restrictedPackageName: 'com.astria.taromobile',
          }
        }

        const messageId = await firebaseAdmin.messaging().send(fcmPayload)

        console.log(`[sendNativePushToUsers] âœ… FCM enviado com sucesso! messageId: ${messageId}`)
        
        await markNativePushTokenSuccess({ pool, token })
        results.push({
          ok: true,
          userId,
          tokenPreview: `${token.slice(0, 24)}...`,
          platform,
          provider,
          messageId,
        })
      } catch (error) {
        const errorCode = error?.errorInfo?.code || error?.code || null
        console.error(`[sendNativePushToUsers] âŒ Erro FCM para ${userId}:`, {
          code: errorCode,
          message: error?.message,
          fullError: JSON.stringify(error, null, 2),
        })
        
        const shouldDisableToken = [
          'messaging/registration-token-not-registered',
          'messaging/invalid-registration-token',
        ].includes(errorCode)

        if (shouldDisableToken) {
          console.warn(`[sendNativePushToUsers] ðŸ”´ Token invÃ¡lido detectado, marcando como inativo`)
          await markNativePushTokenFailure({ pool, token })
        }

        results.push({
          ok: false,
          userId,
          tokenPreview: `${token.slice(0, 24)}...`,
          platform,
          provider,
          error: {
            code: errorCode,
            message: error?.message || 'Erro desconhecido no FCM',
          },
        })
      }
    }),
  )

  const summary = {
    totalSubscriptions: registrations.length,
    successCount: results.filter((item) => item.ok).length,
    failureCount: results.filter((item) => !item.ok).length,
    results,
  }
  
  console.log(`[sendNativePushToUsers] ðŸ“Š RESUMO:`, {
    total: summary.totalSubscriptions,
    sucesso: summary.successCount,
    falhas: summary.failureCount,
  })

  return summary
}

export const sendPushToUsers = async ({ pool, webpush, firebaseAdmin, userIds, payload }) => {
  const normalizedPayload = normalizePushPayload(payload)

  const [web, native] = await Promise.all([
    sendWebPushToUsers({ pool, webpush, userIds, payload: normalizedPayload }),
    sendNativePushToUsers({ pool, firebaseAdmin, userIds, payload: normalizedPayload }),
  ])

  return {
    payload: normalizedPayload,
    totalSubscriptions: web.totalSubscriptions + native.totalSubscriptions,
    successCount: web.successCount + native.successCount,
    failureCount: web.failureCount + native.failureCount,
    results: [...web.results, ...native.results],
    web,
    native,
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
