import { Router } from 'express'
import { authenticate, authorizeAdmin } from '../middleware/auth.mjs'

const normalizeNullableText = (value) => {
  const normalized = (value ?? '').toString().trim()
  return normalized === '' ? null : normalized
}

export const createCredentialsRouter = (pool) => {
  const router = Router()

  router.use(authenticate, authorizeAdmin)

  router.get('/', async (_request, response) => {
    try {
      const [rows] = await pool.query('SELECT * FROM platform_credentials WHERE id = 1')
      response.json(rows[0] || {})
    } catch (error) {
      console.error('Erro ao buscar credenciais:', error)
      response.status(500).json({ message: 'Erro ao buscar credenciais.' })
    }
  })

  router.put('/', async (request, response) => {
    const {
      mpPublicKey,
      mpAccessToken,
      mpWebhookSecret,
      dailyApiKey,
      dailyDomain,
      dailyRoomName,
      pixKey,
      pixReceiverName,
      pixReceiverCity
    } = request.body

    try {
      // Usar COALESCE para manter valores atuais se vierem undefined/null no body (salvamento parcial)
      await pool.query(
        `
          UPDATE platform_credentials
          SET
            mpPublicKey = COALESCE(?, mpPublicKey),
            mpAccessToken = COALESCE(?, mpAccessToken),
            mpWebhookSecret = COALESCE(?, mpWebhookSecret),
            dailyApiKey = COALESCE(?, dailyApiKey),
            dailyDomain = COALESCE(?, dailyDomain),
            dailyRoomName = COALESCE(?, dailyRoomName),
            pixKey = COALESCE(?, pixKey),
            pixReceiverName = COALESCE(?, pixReceiverName),
            pixReceiverCity = COALESCE(?, pixReceiverCity)
          WHERE id = 1
        `,
        [
          normalizeNullableText(mpPublicKey),
          normalizeNullableText(mpAccessToken),
          normalizeNullableText(mpWebhookSecret),
          normalizeNullableText(dailyApiKey),
          normalizeNullableText(dailyDomain),
          normalizeNullableText(dailyRoomName),
          normalizeNullableText(pixKey),
          normalizeNullableText(pixReceiverName),
          normalizeNullableText(pixReceiverCity),
        ],
      )
      response.json({ message: 'Configurações atualizadas com sucesso.' })
    } catch (error) {
      console.error('Erro ao atualizar credenciais:', error)
      response.status(500).json({ message: 'Erro ao atualizar credenciais.' })
    }
  })

  return router
}
