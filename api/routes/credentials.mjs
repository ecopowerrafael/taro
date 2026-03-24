import { Router } from 'express'

const normalizeNullableText = (value) => {
  const normalized = (value ?? '').toString().trim()
  return normalized === '' ? null : normalized
}

export const createCredentialsRouter = (pool) => {
  const router = Router()

  router.get('/', async (_request, response) => {
    const [rows] = await pool.query(
      `
        SELECT
          mpPublicKey,
          mpAccessToken,
          mpWebhookSecret,
          dailyApiKey,
          dailyDomain,
          dailyRoomName
        FROM app_credentials
        WHERE id = 1
        LIMIT 1
      `,
    )

    const row = rows[0] ?? {}
    response.json({
      mpCredentials: {
        publicKey: row.mpPublicKey ?? '',
        accessToken: row.mpAccessToken ?? '',
        webhookSecret: row.mpWebhookSecret ?? '',
      },
      dailyCredentials: {
        apiKey: row.dailyApiKey ?? '',
        domain: row.dailyDomain ?? 'demo.daily.co',
        roomName: row.dailyRoomName ?? 'hello',
      },
    })
  })

  router.put('/', async (request, response) => {
    const mpCredentials = request.body?.mpCredentials ?? {}
    const dailyCredentials = request.body?.dailyCredentials ?? {}

    await pool.query(
      `
        INSERT INTO app_credentials (
          id,
          mpPublicKey,
          mpAccessToken,
          mpWebhookSecret,
          dailyApiKey,
          dailyDomain,
          dailyRoomName
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          mpPublicKey = VALUES(mpPublicKey),
          mpAccessToken = VALUES(mpAccessToken),
          mpWebhookSecret = VALUES(mpWebhookSecret),
          dailyApiKey = VALUES(dailyApiKey),
          dailyDomain = VALUES(dailyDomain),
          dailyRoomName = VALUES(dailyRoomName)
      `,
      [
        1,
        normalizeNullableText(mpCredentials.publicKey),
        normalizeNullableText(mpCredentials.accessToken),
        normalizeNullableText(mpCredentials.webhookSecret),
        normalizeNullableText(dailyCredentials.apiKey),
        normalizeNullableText(dailyCredentials.domain) || 'demo.daily.co',
        normalizeNullableText(dailyCredentials.roomName) || 'hello',
      ],
    )

    response.json({ ok: true })
  })

  return router
}
