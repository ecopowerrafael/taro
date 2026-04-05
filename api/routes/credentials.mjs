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

  // GET - Informações sobre disponibilidade de pagamentos (público, não requer autenticação)
  router.get('/info/payment-methods', async (_request, response) => {
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

  // Teste de salvamento no banco (admin only)
  router.post('/test-save', authenticate, authorizeAdmin, async (request, response) => {
    try {
      const testValue = `test-${Date.now()}`
      console.log(`[API/Credentials] TEST: Tentando salvar valor de teste: ${testValue}`)
      
      // Tentar salvar
      const [updateResult] = await pool.query(
        'UPDATE platform_credentials SET stripePublicKey = ? WHERE id = 1',
        [testValue]
      )
      console.log(`[API/Credentials] TEST: Update result:`, updateResult)
      
      // Se não atualizou, inserir
      if (updateResult.affectedRows === 0) {
        console.log(`[API/Credentials] TEST: Nenhuma linha encontrada, inserindo...`)
        await pool.query('INSERT IGNORE INTO platform_credentials (id) VALUES (1)')
        const [retryResult] = await pool.query(
          'UPDATE platform_credentials SET stripePublicKey = ? WHERE id = 1',
          [testValue]
        )
        console.log(`[API/Credentials] TEST: Retry update result:`, retryResult)
      }
      
      // Ler de volta
      const [rows] = await pool.query('SELECT stripePublicKey FROM platform_credentials WHERE id = 1')
      const savedValue = rows[0]?.stripePublicKey
      
      console.log(`[API/Credentials] TEST: Valor salvo:`, savedValue)
      console.log(`[API/Credentials] TEST: Match esperado (${testValue}) === salvo (${savedValue}):`, testValue === savedValue)
      
      response.json({
        ok: true,
        testValue,
        savedValue,
        match: testValue === savedValue,
        message: testValue === savedValue ? 'Banco está salvando corretamente!' : 'ERRO: Banco não está salvando!'
      })
    } catch (error) {
      console.error(`[API/Credentials] TEST ERROR:`, error)
      response.status(500).json({
        ok: false,
        error: error.message,
        stack: error.stack
      })
    }
  })

  // GET - Qualquer usuário autenticado pode ler (não precisa ser admin)
  router.get('/', authenticate, async (_request, response) => {
    try {
      const [rows] = await pool.query('SELECT * FROM platform_credentials WHERE id = 1')
      const credentials = rows[0] || {}
      console.log(`[API/Credentials] GET: Retornando credenciais:`, {
        id: credentials.id,
        stripePublicKey: credentials.stripePublicKey ? `[${credentials.stripePublicKey.length} chars]` : 'VAZIO',
        stripeSecretKey: credentials.stripeSecretKey ? `[${credentials.stripeSecretKey.length} chars]` : 'VAZIO',
        mpPublicKey: credentials.mpPublicKey ? `[${credentials.mpPublicKey.length} chars]` : 'VAZIO',
      })
      response.json(credentials)
    } catch (error) {
      console.error('[API/Credentials] Erro ao buscar credenciais:', error)
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
        globalCommission: 'globalCommission',
        smtpHost: 'smtpHost',
        smtpPort: 'smtpPort',
        smtpUser: 'smtpUser',
        smtpPass: 'smtpPass',
        smtpFrom: 'smtpFrom',
        oracleHereApiKey: 'oracleHereApiKey',
        oracleProkeralaId: 'oracleProkeralaId',
        oracleProkeralaSecret: 'oracleProkeralaSecret',
        oracleGeminiKey: 'oracleGeminiKey',
        oracleSystemPrompt: 'oracleSystemPrompt',
        oraclePrice: 'oraclePrice'
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

  // PATCH - Salvar credenciais parciais por tipo (requer autenticação de admin)
  // Exemplo: PATCH /api/credentials/stripe com body { stripePublicKey: "...", stripeSecretKey: "..." }
  router.patch('/:type', authenticate, authorizeAdmin, async (request, response) => {
    try {
      const { type } = request.params
      const fieldsMap = {
        mp: ['mpPublicKey', 'mpAccessToken', 'mpWebhookSecret'],
        daily: ['dailyApiKey', 'dailyDomain', 'dailyRoomName'],
        pix: ['pixKey', 'pixReceiverName', 'pixReceiverCity'],
        stripe: ['stripePublicKey', 'stripeSecretKey'],
        commission: ['globalCommission'],
        smtp: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom'],
          oracle: ['oracleHereApiKey', 'oracleGeminiKey', 'oracleProkeralaId', 'oracleProkeralaSecret', 'oracleSystemPrompt', 'oraclePrice'],
        return response.status(400).json({ message: `Tipo de credencial inválido: ${type}` })
      }

      const updates = []
      const values = []

      // Atualizar apenas os campos permitidos para esse tipo
      allowedFields.forEach((field) => {
        if (request.body[field] !== undefined) {
          const normalizedValue = normalizeNullableText(request.body[field])
          updates.push(`${field} = ?`)
          values.push(normalizedValue)
          console.log(`[API/Credentials] Campo ${field}: ${request.body[field]?.substring?.(0, 20)}... -> ${normalizedValue ? 'VALOR' : 'NULL'}`)
        }
      })

      if (updates.length === 0) {
        return response.status(400).json({ message: `Nenhum campo de tipo '${type}' para atualizar.` })
      }

      values.push(1)
      const sql = `UPDATE platform_credentials SET ${updates.join(', ')} WHERE id = ?`
      console.log(`[API/Credentials] SQL: ${sql}`)
      console.log(`[API/Credentials] Valores:`, values.slice(0, -1).map(v => v ? '[PRESENTE]' : '[NULL]'))

      const [result] = await pool.query(sql, values)
      
      console.log(`[API/Credentials] Query result:`, { affectedRows: result.affectedRows, changedRows: result.changedRows })

      if (result.affectedRows === 0) {
        console.warn(`[API/Credentials] Nenhuma linha atualizada. Tentando inserir linha padrão...`)
        // Inserir linha padrão se não existir
        await pool.query('INSERT IGNORE INTO platform_credentials (id) VALUES (1)')
        const [retryResult] = await pool.query(sql, values)
        console.log(`[API/Credentials] Retry result:`, { affectedRows: retryResult.affectedRows })
      }

      response.json({ 
        ok: true,
        message: `Credenciais de '${type}' atualizadas com sucesso.` 
      })
    } catch (error) {
      console.error(`[API/Credentials] Erro CRÍTICO ao atualizar ${request.params.type}:`, error.message)
      console.error(`[API/Credentials] Stack:`, error.stack)
      response.status(503).json({
        ok: false,
        message: `Erro ao salvar credenciais de ${request.params.type}.`,
        error: error.message,
      })
    }
  })

  return router
}

