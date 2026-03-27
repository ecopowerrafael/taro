import { Router } from 'express'
import { authenticate, authorizeAdmin } from '../middleware/auth.mjs'
import Stripe from 'stripe'

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

        // Marcar como 'pending' ao invés de 'approved' para exigir aprovação manual do admin
        // Isso mantém o fluxo consistente com PIX (não adiciona saldo automaticamente)
        await pool.query(
          `UPDATE recharge_requests SET status = 'pending', updatedAt = ? WHERE id = ?`,
          [new Date(), `stripe_${paymentIntent.id}`]
        )

        console.log('[Stripe] Pagamento confirmado e pendente de aprovação:', paymentIntent.id)
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object

        // Marcar como rejeitado
        await pool.query(
          `UPDATE recharge_requests SET status = 'rejected', updatedAt = ? WHERE id = ?`,
          [new Date(), `stripe_${paymentIntent.id}`]
        )

        console.log('[Stripe] Pagamento falhou:', paymentIntent.id)
      }

      response.json({ received: true })
    } catch (error) {
      console.error('[Stripe Webhook] Erro:', error)
      response.status(400).json({ message: 'Erro ao processar webhook' })
    }
  })

  return router
}
