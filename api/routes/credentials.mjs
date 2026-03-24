import { Router } from 'express'
import { authenticate, authorizeAdmin } from '../middleware/auth.mjs'

const normalizeNullableText = (value) => {
  const normalized = (value ?? '').toString().trim()
  return normalized === '' ? null : normalized
}

export const createCredentialsRouter = (pool) => {
  const router = Router()

  // Rota de teste pública para confirmar se o backend atualizou
  router.get('/ping-v4', (_request, response) => {
    response.json({ 
      ok: true, 
      version: 'V4', 
      timestamp: new Date().toISOString(),
      message: 'Se você vê isso, o backend V4 está ativo.'
    })
  })

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
    try {
      console.log('[API/Credentials] Body recebido para atualização:', request.body)
      
      const fieldsMap = {
        mpPublicKey: 'mpPublicKey',
        mpAccessToken: 'mpAccessToken',
        mpWebhookSecret: 'mpWebhookSecret',
        dailyApiKey: 'dailyApiKey',
        dailyDomain: 'dailyDomain',
        dailyRoomName: 'dailyRoomName',
        pixKey: 'pixKey',
        pixReceiverName: 'pixReceiverName',
        pixReceiverCity: 'pixReceiverCity'
      }

      const updates = []
      const values = []

      // Mapear campos do frontend para colunas do banco
      Object.entries(fieldsMap).forEach(([frontendKey, dbColumn]) => {
        if (request.body[frontendKey] !== undefined) {
          updates.push(`${dbColumn} = ?`)
          values.push(normalizeNullableText(request.body[frontendKey]))
        }
      })

      if (updates.length === 0) {
        return response.status(400).json({ message: 'Nenhum campo para atualizar.' })
      }

      // Adicionar id no final para a cláusula WHERE
      values.push(1)

      const sql = `UPDATE platform_credentials SET ${updates.join(', ')} WHERE id = ?`
      console.log('[API/Credentials] Executando SQL:', sql, 'Valores:', values)

      const [result] = await pool.query(sql, values)
      
      // Se não atualizou nada, pode ser que a linha id=1 não exista
      if (result.affectedRows === 0) {
        console.warn('[API/Credentials] Nenhuma linha atualizada. Tentando inserir...')
        // Inserir linha padrão 1 se não existir
        await pool.query('INSERT IGNORE INTO platform_credentials (id) VALUES (1)')
        // Tentar o update novamente
        const [retryResult] = await pool.query(sql, values)
        console.log('[API/Credentials] Resultado do retry:', retryResult)
      }

      response.json({ message: 'Configurações atualizadas com sucesso.' })
    } catch (error) {
      console.error('[API/Credentials] Erro fatal ao atualizar credenciais:', error)
      response.status(503).json({ 
        message: 'Erro no Backend (V5): Falha crítica no banco de dados.',
        error: error.message,
        sqlState: error.sqlState,
        code: error.code,
        stack: error.stack
      })
    }
  })

  return router
}
