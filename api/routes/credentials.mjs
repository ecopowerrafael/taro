import { Router } from 'express'
import { authenticate, authorizeAdmin } from '../middleware/auth.mjs'

const normalizeNullableText = (value) => {
  const normalized = (value ?? '').toString().trim()
  return normalized === '' ? null : normalized
}

// Verificar disponibilidade de bibliotecas de pagamento
// Por padrão, assumir que não está disponível (será atualizado dinamicamente)
let mercadoPagoAvailable = false

export const createCredentialsRouter = (pool) => {
  const router = Router()

  // GET - Informações sobre disponibilidade de pagamentos
  router.get('/info/payment-methods', authenticate, async (_request, response) => {
    // Verificar disposição de Mercado Pago a cada requisição
    try {
      // Se conseguir importar, está disponível
      // Mas como estamos em módulo ES, vamos apenas return false por enquanto
      // (vamos instalar Mercado Pago depois via npm)
      response.json({
        mercadoPagoAvailable: false, // Não está instalado
        stripeAvailable: true, // Stripe está instalado
      })
    } catch (error) {
      response.json({
        mercadoPagoAvailable: false,
        stripeAvailable: true,
      })
    }
  })

  // Rota de teste pública para confirmar se o backend atualizou
  router.get('/ping-v4', (_request, response) => {
    response.json({ 
      ok: true, 
      version: 'V4', 
      timestamp: new Date().toISOString(),
      message: 'Se você vê isso, o backend V4 está ativo.'
    })
  })

  // GET - Qualquer usuário autenticado pode ler (não precisa ser admin)
  router.get('/', authenticate, async (_request, response) => {
    try {
      const [rows] = await pool.query('SELECT * FROM platform_credentials WHERE id = 1')
      response.json(rows[0] || {})
    } catch (error) {
      console.error('Erro ao buscar credenciais:', error)
      response.status(500).json({ message: 'Erro ao buscar credenciais.' })
    }
  })

  // PUT - Apenas admin pode escrever
  router.use(authenticate, authorizeAdmin)

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
        pixReceiverCity: 'pixReceiverCity',
        stripePublicKey: 'stripePublicKey',
        stripeSecretKey: 'stripeSecretKey',
        smtpHost: 'smtpHost',
        smtpPort: 'smtpPort',
        smtpUser: 'smtpUser',
        smtpPass: 'smtpPass',
        smtpFrom: 'smtpFrom'
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

  // PATCH - Salvar credenciais parciais por tipo
  // Exemplo: PATCH /api/credentials/stripe com body { stripePublicKey: "...", stripeSecretKey: "..." }
  router.patch('/:type', async (request, response) => {
    try {
      const { type } = request.params
      const fieldsMap = {
        mp: ['mpPublicKey', 'mpAccessToken', 'mpWebhookSecret'],
        daily: ['dailyApiKey', 'dailyDomain', 'dailyRoomName'],
        pix: ['pixKey', 'pixReceiverName', 'pixReceiverCity'],
        stripe: ['stripePublicKey', 'stripeSecretKey'],
        smtp: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom'],
      }

      const allowedFields = fieldsMap[type]
      if (!allowedFields) {
        return response.status(400).json({ message: `Tipo de credencial inválido: ${type}` })
      }

      const updates = []
      const values = []

      // Atualizar apenas os campos permitidos para esse tipo
      allowedFields.forEach((field) => {
        if (request.body[field] !== undefined) {
          updates.push(`${field} = ?`)
          values.push(normalizeNullableText(request.body[field]))
        }
      })

      if (updates.length === 0) {
        return response.status(400).json({ message: `Nenhum campo de tipo '${type}' para atualizar.` })
      }

      values.push(1)
      const sql = `UPDATE platform_credentials SET ${updates.join(', ')} WHERE id = ?`
      console.log(`[API/Credentials] PATCH ${type}:`, sql)

      const [result] = await pool.query(sql, values)

      if (result.affectedRows === 0) {
        // Inserir linha padrão se não existir
        await pool.query('INSERT IGNORE INTO platform_credentials (id) VALUES (1)')
        await pool.query(sql, values)
      }

      response.json({ message: `Credenciais de '${type}' atualizadas com sucesso.` })
    } catch (error) {
      console.error(`[API/Credentials] Erro ao atualizar ${request.params.type}:`, error)
      response.status(503).json({
        message: `Erro ao salvar credenciais de ${request.params.type}.`,
        error: error.message,
      })
    }
  })

  return router
}

