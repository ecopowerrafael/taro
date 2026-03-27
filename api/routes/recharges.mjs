import { Router } from 'express'
import { authenticate, authorizeAdmin } from '../middleware/auth.mjs'
import Stripe from 'stripe'

const normalizePackage = (row) => ({
  ...row,
  minutes: Number(row.minutes) || 0,
  price: Number(row.price) || 0,
  promoPrice: row.promoPrice === null || row.promoPrice === undefined ? null : Number(row.promoPrice) || 0,
  isFeatured: Boolean(row.isFeatured),
  sortOrder: Number(row.sortOrder) || 0,
})

// Inicializar Stripe apenas se a chave estiver disponível
let stripe = null
const initializeStripe = () => {
  if (!stripe) {
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        console.log('[Stripe] Inicializado com sucesso')
      } catch (error) {
        console.error('[Stripe] Erro ao inicializar:', error.message)
      }
    } else {
      console.warn('[Stripe] STRIPE_SECRET_KEY não encontrada no ambiente')
    }
  }
  return stripe
}

export const createRechargesRouter = (pool) => {
  const router = Router()

  router.get('/packages', async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, minutes, price, promoPrice, isFeatured, sortOrder
         FROM recharge_packages
         ORDER BY sortOrder ASC, minutes ASC`
      )
      response.json(Array.isArray(rows) ? rows.map(normalizePackage) : [])
    } catch (error) {
      console.error('[RechargePackages] Erro ao buscar pacotes:', error)
      response.status(500).json({ message: 'Erro ao buscar pacotes de recarga.' })
    }
  })

  router.put('/packages', authenticate, authorizeAdmin, async (request, response) => {
    const packages = Array.isArray(request.body?.packages) ? request.body.packages : []

    if (packages.length === 0) {
      return response.status(400).json({ message: 'Nenhum pacote enviado para salvar.' })
    }

    const normalizedPackages = packages.map((pack, index) => ({
      id: String(pack.id || '').trim(),
      minutes: Number(pack.minutes),
      price: Number(pack.price),
      promoPrice: pack.promoPrice === '' || pack.promoPrice === undefined ? null : Number(pack.promoPrice),
      isFeatured: Boolean(pack.isFeatured),
      sortOrder: index + 1,
    }))

    const invalidPackage = normalizedPackages.find(
      (pack) => !pack.id || !Number.isFinite(pack.minutes) || pack.minutes <= 0 || !Number.isFinite(pack.price) || pack.price <= 0 || (pack.promoPrice !== null && (!Number.isFinite(pack.promoPrice) || pack.promoPrice < 0)),
    )

    if (invalidPackage) {
      return response.status(400).json({ message: 'Há pacotes com dados inválidos.' })
    }

    const featuredCount = normalizedPackages.filter((pack) => pack.isFeatured).length
    if (featuredCount !== 1) {
      return response.status(400).json({ message: 'Defina exatamente um pacote como mais escolhido.' })
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      for (const pack of normalizedPackages) {
        await connection.query(
          `INSERT INTO recharge_packages (id, minutes, price, promoPrice, isFeatured, sortOrder, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             minutes = VALUES(minutes),
             price = VALUES(price),
             promoPrice = VALUES(promoPrice),
             isFeatured = VALUES(isFeatured),
             sortOrder = VALUES(sortOrder),
             updatedAt = VALUES(updatedAt)`,
          [pack.id, pack.minutes, pack.price, pack.promoPrice, pack.isFeatured ? 1 : 0, pack.sortOrder],
        )
      }

      await connection.commit()

      const [rows] = await pool.query(
        `SELECT id, minutes, price, promoPrice, isFeatured, sortOrder
         FROM recharge_packages
         ORDER BY sortOrder ASC, minutes ASC`
      )

      response.json({
        ok: true,
        packages: Array.isArray(rows) ? rows.map(normalizePackage) : [],
        message: 'Pacotes de recarga salvos com sucesso.',
      })
    } catch (error) {
      await connection.rollback()
      console.error('[RechargePackages] Erro ao salvar pacotes:', error)
      response.status(500).json({ message: 'Erro ao salvar pacotes de recarga.' })
    } finally {
      connection.release()
    }
  })

  // Solicitar recarga (PIX ou Card)
  router.post('/request', authenticate, async (request, response) => {
    const { amount, minutes, method } = request.body
    const userId = request.user.id

    if (!amount || !minutes || !method) {
      return response.status(400).json({ message: 'Dados incompletos para solicitação.' })
    }

    try {
      const id = 'req_' + Math.random().toString(36).substr(2, 9)
      const createdAt = new Date()

      await pool.query(
        `INSERT INTO recharge_requests (id, userId, amount, minutes, method, status, createdAt)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        [id, userId, amount, minutes, method, createdAt]
      )

      response.status(201).json({ id, message: 'Solicitação de recarga enviada.' })
    } catch (error) {
      console.error('Erro ao solicitar recarga:', error)
      response.status(500).json({ message: 'Erro ao processar solicitação.' })
    }
  })

  // Listar solicitações pendentes (Admin)
  router.get('/pending', authenticate, authorizeAdmin, async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT r.*, u.name as userName, u.email as userEmail 
         FROM recharge_requests r
         JOIN users u ON r.userId = u.id
         WHERE r.status = 'pending'
         ORDER BY r.createdAt DESC`
      )
      response.json(rows)
    } catch (error) {
      console.error('Erro ao buscar recargas pendentes:', error)
      response.status(500).json({ message: 'Erro ao buscar recargas.' })
    }
  })

  // Aprovar/Rejeitar recarga (Admin)
  router.post('/:id/action', authenticate, authorizeAdmin, async (request, response) => {
    const { id } = request.params
    const { action } = request.body // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return response.status(400).json({ message: 'Ação inválida.' })
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // 1. Buscar a solicitação
      const [requests] = await connection.query('SELECT * FROM recharge_requests WHERE id = ?', [id])
      if (requests.length === 0) {
        await connection.rollback()
        return response.status(404).json({ message: 'Solicitação não encontrada.' })
      }

      const req = requests[0]
      if (req.status !== 'pending') {
        await connection.rollback()
        return response.status(400).json({ message: 'Esta solicitação já foi processada.' })
      }

      // 2. Atualizar status da solicitação
      await connection.query(
        'UPDATE recharge_requests SET status = ?, updatedAt = ? WHERE id = ?',
        [action, new Date(), id]
      )

      // 3. Se aprovado, adicionar saldo ao usuário
      if (action === 'approved') {
        await connection.query(
          'UPDATE users SET minutesBalance = minutesBalance + ? WHERE id = ?',
          [req.amount, req.userId] // Tratando minutesBalance como Reais
        )
      }

      await connection.commit()
      response.json({ message: `Recarga ${action === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.` })
    } catch (error) {
      await connection.rollback()
      console.error('Erro ao processar ação de recarga:', error)
      response.status(500).json({ message: 'Erro ao processar recarga.' })
    } finally {
      connection.release()
    }
  })

  // Criar Payment Intent para Stripe
  router.post('/stripe-payment-intent', authenticate, async (request, response) => {
    const { amount, minutes, packageId, customerEmail } = request.body
    const userId = request.user.id

    if (!amount || !minutes || !packageId) {
      return response.status(400).json({ message: 'Dados incompletos para pagamento.' })
    }

    // Inicializar Stripe e validar chave Secret
    const stripeInstance = initializeStripe()
    if (!stripeInstance) {
      return response.status(500).json({ message: 'Stripe não está configurado no servidor.' })
    }

    try {
      // Criar Payment Intent
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency: 'brl',
        metadata: {
          userId,
          packageId,
          minutes,
          customerEmail,
        },
        receipt_email: customerEmail,
      })

      // Registrar tentativa de recarga
      const rechargeId = 'stripe_' + paymentIntent.id
      const createdAt = new Date()

      await pool.query(
        `INSERT INTO recharge_requests (id, userId, amount, minutes, method, status, createdAt)
         VALUES (?, ?, ?, ?, 'stripe', 'pending', ?)`,
        [rechargeId, userId, amount, minutes, createdAt]
      )

      response.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    } catch (error) {
      console.error('[Stripe] Erro ao criar payment intent:', error)
      response.status(500).json({ 
        message: 'Erro ao criar sessão de pagamento.',
        error: error.message 
      })
    }
  })

  // Webhook para confirmar pagamento (quando Stripe notifica o servidor)
  router.post('/stripe-webhook', async (request, response) => {
    const sig = request.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!endpointSecret) {
      return response.status(400).json({ message: 'Webhook não configurado' })
    }

    const stripeInstance = initializeStripe()
    if (!stripeInstance) {
      return response.status(500).json({ message: 'Stripe não está configurado' })
    }

    try {
      // Nota: Em produção, o body raw é necessário. Para desenvolvimento, usar JSON normal
      const event = stripeInstance.webhooks.constructEvent(
        typeof request.body === 'string' ? request.body : JSON.stringify(request.body),
        sig,
        endpointSecret
      )

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object
        const { userId, packageId, minutes } = paymentIntent.metadata

        // Marcar como 'approved' mas NÃO adicionar minutos ainda
        // Os minutos serão adicionados apenas quando o frontend confirmar via API dedicada
        await pool.query(
          `UPDATE recharge_requests SET status = 'approved', updatedAt = ? WHERE id = ?`,
          [new Date(), `stripe_${paymentIntent.id}`]
        )

        console.log('[Stripe Webhook] Pagamento confirmado, aguardando confirmação do frontend:', paymentIntent.id)
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object

        // Marcar como rejeitado
        await pool.query(
          `UPDATE recharge_requests SET status = 'rejected', updatedAt = ? WHERE id = ?`,
          [new Date(), `stripe_${paymentIntent.id}`]
        )

        console.log('[Stripe Webhook] Pagamento falhou:', paymentIntent.id)
      }

      response.json({ received: true })
    } catch (error) {
      console.error('[Stripe Webhook] Erro:', error)
      response.status(400).json({ message: 'Erro ao processar webhook' })
    }
  })

  // Rota para confirmar pagamento Stripe e adicionar minutos
  // O frontend chama isso APÓS receber sucesso do Stripe
  router.post('/stripe-confirm/:paymentIntentId', authenticate, async (request, response) => {
    try {
      const { paymentIntentId } = request.params
      const userId = request.user.id

      // Buscar o recharge request associado ao payment intent
      const [rechargeRequests] = await pool.query(
        'SELECT * FROM recharge_requests WHERE id = ? AND userId = ?',
        [`stripe_${paymentIntentId}`, userId]
      )

      if (!rechargeRequests || rechargeRequests.length === 0) {
        return response.status(404).json({ message: 'Pagamento não encontrado' })
      }

      const rechargeRequest = rechargeRequests[0]

      // Verificar se já foi creditado
      if (rechargeRequest.status === 'approved') {
        // Já foi processado, apenas adiciona os minutos se ainda não foi feito
        const [userCheck] = await pool.query(
          'SELECT minutesBalance FROM users WHERE id = ?',
          [userId]
        )
        
        if (userCheck && userCheck.length > 0) {
          const previousBalance = userCheck[0].minutesBalance
          
          // Marcar como 'completed' para indicar que os minutos foram creditados
          await pool.query(
            'UPDATE recharge_requests SET status = ?, updatedAt = ? WHERE id = ?',
            ['completed', new Date(), `stripe_${paymentIntentId}`]
          )

          // Adicionar minutos ao usuário
          await pool.query(
            'UPDATE users SET minutesBalance = minutesBalance + ? WHERE id = ?',
            [rechargeRequest.minutes, userId]
          )

          console.log(`[Stripe Confirm] Minutos creditados para usuário ${userId}: +${rechargeRequest.minutes}`)
          response.json({
            ok: true,
            message: 'Minutos adicionados com sucesso',
            minutesAdded: rechargeRequest.minutes,
          })
        }
      } else {
        return response.status(400).json({ message: 'Pagamento não foi aprovado' })
      }
    } catch (error) {
      console.error('[Stripe Confirm] Erro:', error)
      response.status(500).json({ message: 'Erro ao confirmar pagamento' })
    }
  })

  return router
}
