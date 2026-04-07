import { Router } from 'express'
import Stripe from 'stripe'
import { authenticate, authorizeAdmin } from '../middleware/auth.mjs'

const normalizeAstralReadingOrder = (row) => ({
  ...row,
  price: Number(row.price) || 0,
  stripeFeeAmount:
    row.stripeFeeAmount === null || row.stripeFeeAmount === undefined
      ? null
      : Number(row.stripeFeeAmount) || 0,
  stripeNetAmount:
    row.stripeNetAmount === null || row.stripeNetAmount === undefined
      ? null
      : Number(row.stripeNetAmount) || 0,
})

const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

let stripe = null
let activeStripeSecretKey = null

const normalizeStripeAmount = (value) => {
  if (!Number.isFinite(Number(value))) {
    return null
  }
  return Number((Number(value) / 100).toFixed(2))
}

const extractStripeChargeFinancials = (paymentIntent) => {
  const latestCharge = paymentIntent?.latest_charge
  const balanceTransaction = latestCharge?.balance_transaction

  return {
    stripePaymentIntentId: paymentIntent?.id || null,
    stripeChargeId: typeof latestCharge === 'object' ? latestCharge.id || null : null,
    stripeBalanceTransactionId:
      typeof balanceTransaction === 'object' ? balanceTransaction.id || null : null,
    stripeFeeAmount:
      typeof balanceTransaction === 'object' ? normalizeStripeAmount(balanceTransaction.fee) : null,
    stripeNetAmount:
      typeof balanceTransaction === 'object' ? normalizeStripeAmount(balanceTransaction.net) : null,
  }
}

const resolveStripeSecretKey = async (pool) => {
  try {
    const [rows] = await pool.query('SELECT stripeSecretKey FROM platform_credentials WHERE id = 1 LIMIT 1')
    const dbKey = (rows?.[0]?.stripeSecretKey || '').trim()
    if (dbKey) {
      return dbKey
    }
  } catch (error) {
    console.error('[AstralReadings/Stripe] Erro ao buscar stripeSecretKey no banco:', error.message)
  }

  return (process.env.STRIPE_SECRET_KEY || '').trim()
}

const initializeStripe = async (pool) => {
  const secretKey = await resolveStripeSecretKey(pool)

  if (!secretKey) {
    console.warn('[AstralReadings/Stripe] Nenhuma stripeSecretKey encontrada no ambiente ou banco de dados')
    return null
  }

  if (!stripe || activeStripeSecretKey !== secretKey) {
    try {
      stripe = new Stripe(secretKey)
      activeStripeSecretKey = secretKey
    } catch (error) {
      stripe = null
      activeStripeSecretKey = null
      console.error('[AstralReadings/Stripe] Erro ao inicializar:', error.message)
    }
  }

  return stripe
}

const settleAstralReadingOrder = async (connection, orderId) => {
  const [orders] = await connection.query(
    `SELECT * FROM astral_reading_orders WHERE id = ? FOR UPDATE`,
    [orderId],
  )

  if (!orders.length) {
    throw new Error('Pedido de leitura astral não encontrado para liquidação.')
  }

  const order = normalizeAstralReadingOrder(orders[0])
  if (order.status === 'completed') {
    return order
  }

  await connection.query(
    `UPDATE astral_reading_orders
     SET status = 'completed', paidAt = NOW(), updatedAt = NOW()
     WHERE id = ?`,
    [orderId],
  )

  return {
    ...order,
    status: 'completed',
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export const createAstralReadingsRouter = (pool) => {
  const router = Router()
  const READING_TITLE = 'Leitura Astral Completa'
  const READING_PRICE = 49.9

  router.post('/orders/pix', authenticate, async (request, response) => {
    try {
      const orderId = createId('astral_pix')
      await pool.query(
        `INSERT INTO astral_reading_orders (
           id,
           userId,
           readingTitle,
           price,
           method,
           status,
           createdAt,
           updatedAt
         ) VALUES (?, ?, ?, ?, 'pix', 'pending', NOW(), NOW())`,
        [orderId, request.user.id, READING_TITLE, READING_PRICE],
      )

      response.status(201).json({
        ok: true,
        orderId,
        message: 'Pedido PIX criado. Aguarde a validação do pagamento.',
      })
    } catch (error) {
      console.error('[AstralReadings] Erro ao criar pedido PIX:', error)
      response.status(500).json({ message: 'Erro ao registrar pedido PIX.' })
    }
  })

  router.post('/orders/stripe-payment-intent', authenticate, async (request, response) => {
    try {
      const { customerEmail } = request.body ?? {}
      const stripeInstance = await initializeStripe(pool)
      if (!stripeInstance) {
        return response.status(500).json({ message: 'Stripe não está configurado no servidor.' })
      }

      const amountInCents = Math.round(READING_PRICE * 100)
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        metadata: {
          userId: String(request.user.id),
          orderType: 'astral-reading',
        },
        receipt_email: customerEmail || undefined,
      })

      const orderId = `astral_${paymentIntent.id}`
      await pool.query(
        `INSERT INTO astral_reading_orders (
           id,
           userId,
           readingTitle,
           price,
           method,
           status,
           stripePaymentIntentId,
           createdAt,
           updatedAt
         ) VALUES (?, ?, ?, ?, 'card', 'processing', ?, NOW(), NOW())`,
        [orderId, request.user.id, READING_TITLE, READING_PRICE, paymentIntent.id],
      )

      response.json({
        ok: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    } catch (error) {
      console.error('[AstralReadings/Stripe] Erro ao criar payment intent:', error)
      response.status(500).json({ message: 'Erro ao iniciar pagamento com cartão.' })
    }
  })

  router.post('/orders/stripe-webhook', async (request, response) => {
    const sig = request.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!endpointSecret) {
      return response.status(400).json({ message: 'Webhook não configurado.' })
    }

    const stripeInstance = await initializeStripe(pool)
    if (!stripeInstance) {
      return response.status(500).json({ message: 'Stripe não está configurado.' })
    }

    try {
      const event = stripeInstance.webhooks.constructEvent(
        typeof request.body === 'string' ? request.body : JSON.stringify(request.body),
        sig,
        endpointSecret,
      )

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object
        const stripeFinancials = extractStripeChargeFinancials(paymentIntent)

        await pool.query(
          `UPDATE astral_reading_orders
           SET
             status = 'approved',
             stripePaymentIntentId = ?,
             stripeChargeId = ?,
             stripeBalanceTransactionId = ?,
             stripeFeeAmount = ?,
             stripeNetAmount = ?,
             updatedAt = NOW()
           WHERE stripePaymentIntentId = ?`,
          [
            stripeFinancials?.stripePaymentIntentId || paymentIntent.id,
            stripeFinancials?.stripeChargeId || null,
            stripeFinancials?.stripeBalanceTransactionId || null,
            stripeFinancials?.stripeFeeAmount ?? null,
            stripeFinancials?.stripeNetAmount ?? null,
            paymentIntent.id,
          ],
        )
      }

      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object
        await pool.query(
          `UPDATE astral_reading_orders
           SET status = 'rejected', updatedAt = NOW()
           WHERE stripePaymentIntentId = ?`,
          [paymentIntent.id],
        )
      }

      response.json({ received: true })
    } catch (error) {
      console.error('[AstralReadings/Stripe] Erro no webhook:', error)
      response.status(400).json({ message: 'Erro ao processar webhook.' })
    }
  })

  router.post('/orders/stripe-confirm/:paymentIntentId', authenticate, async (request, response) => {
    const connection = await pool.getConnection()
    try {
      const { paymentIntentId } = request.params
      const stripeInstance = await initializeStripe(pool)
      if (!stripeInstance) {
        return response.status(500).json({ message: 'Stripe não está configurado no servidor.' })
      }

      await connection.beginTransaction()

      const [orders] = await connection.query(
        `SELECT * FROM astral_reading_orders
         WHERE stripePaymentIntentId = ? AND userId = ?
         FOR UPDATE`,
        [paymentIntentId, request.user.id],
      )

      if (!orders.length) {
        await connection.rollback()
        return response.status(404).json({ message: 'Pedido não encontrado.' })
      }

      const currentOrder = normalizeAstralReadingOrder(orders[0])
      if (currentOrder.status === 'completed') {
        await connection.rollback()
        return response.json({ ok: true, message: 'Pedido já liquidado anteriormente.' })
      }

      let paymentIntentStatus = 'unknown'
      try {
        const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId, {
          expand: ['latest_charge.balance_transaction'],
        })
        paymentIntentStatus = paymentIntent.status
        const stripeFinancials = extractStripeChargeFinancials(paymentIntent)

        await connection.query(
          `UPDATE astral_reading_orders
           SET
             stripePaymentIntentId = ?,
             stripeChargeId = ?,
             stripeBalanceTransactionId = ?,
             stripeFeeAmount = ?,
             stripeNetAmount = ?,
             updatedAt = NOW()
           WHERE id = ?`,
          [
            stripeFinancials?.stripePaymentIntentId || paymentIntentId,
            stripeFinancials?.stripeChargeId || null,
            stripeFinancials?.stripeBalanceTransactionId || null,
            stripeFinancials?.stripeFeeAmount ?? null,
            stripeFinancials?.stripeNetAmount ?? null,
            currentOrder.id,
          ],
        )
      } catch (stripeError) {
        console.error('[AstralReadings/Stripe] Erro ao validar payment intent:', stripeError.message)
      }

      if (currentOrder.status !== 'approved' && paymentIntentStatus !== 'succeeded') {
        await connection.rollback()
        return response.status(400).json({ message: 'Pagamento ainda não foi aprovado.' })
      }

      const settledOrder = await settleAstralReadingOrder(connection, currentOrder.id)
      await connection.commit()

      response.json({
        ok: true,
        message: 'Pagamento confirmado e pedido de leitura astral registrado.',
        order: settledOrder,
      })
    } catch (error) {
      await connection.rollback()
      console.error('[AstralReadings/Stripe] Erro ao confirmar pedido:', error)
      response.status(500).json({ message: 'Erro ao confirmar pedido.' })
    } finally {
      connection.release()
    }
  })

  router.use(authenticate, authorizeAdmin)

  router.get('/orders/pending', async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           aro.id,
           aro.userId,
           aro.readingTitle,
           aro.price,
           aro.method,
           aro.status,
           aro.createdAt,
           aro.updatedAt,
           u.name AS userName,
           u.email AS userEmail,
           u.birthDate,
           u.oracle_city AS oracleCity,
           u.oracle_birth_date AS oracleBirthDate
         FROM astral_reading_orders aro
         JOIN users u ON u.id = aro.userId
         WHERE aro.method = 'pix' AND aro.status = 'pending'
         ORDER BY aro.createdAt DESC`,
      )

      response.json(Array.isArray(rows) ? rows.map(normalizeAstralReadingOrder) : [])
    } catch (error) {
      console.error('[AstralReadings/Admin] Erro ao buscar pedidos pendentes:', error)
      response.status(500).json({ message: 'Erro ao buscar pedidos pendentes.' })
    }
  })

  router.get('/orders/admin', async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           aro.id,
           aro.userId,
           aro.readingTitle,
           aro.price,
           aro.method,
           aro.status,
           aro.stripeFeeAmount,
           aro.stripeNetAmount,
           aro.paidAt,
           aro.createdAt,
           aro.updatedAt,
           u.name AS userName,
           u.email AS userEmail,
           u.birthDate,
           u.oracle_city AS oracleCity,
           u.oracle_birth_date AS oracleBirthDate
         FROM astral_reading_orders aro
         JOIN users u ON u.id = aro.userId
         ORDER BY aro.createdAt DESC`,
      )

      response.json(Array.isArray(rows) ? rows.map(normalizeAstralReadingOrder) : [])
    } catch (error) {
      console.error('[AstralReadings/Admin] Erro ao buscar histórico de pedidos:', error)
      response.status(500).json({ message: 'Erro ao buscar histórico de pedidos de leitura astral.' })
    }
  })

  router.post('/orders/:orderId/action', async (request, response) => {
    const connection = await pool.getConnection()
    try {
      const { orderId } = request.params
      const { action } = request.body ?? {}

      if (!['approved', 'rejected'].includes(action)) {
        return response.status(400).json({ message: 'Ação inválida.' })
      }

      await connection.beginTransaction()
      const [orders] = await connection.query(
        `SELECT * FROM astral_reading_orders WHERE id = ? FOR UPDATE`,
        [orderId],
      )

      if (!orders.length) {
        await connection.rollback()
        return response.status(404).json({ message: 'Pedido não encontrado.' })
      }

      const currentOrder = normalizeAstralReadingOrder(orders[0])
      if (currentOrder.method !== 'pix' || currentOrder.status !== 'pending') {
        await connection.rollback()
        return response.status(400).json({ message: 'Este pedido não pode mais ser processado.' })
      }

      if (action === 'rejected') {
        await connection.query(
          `UPDATE astral_reading_orders SET status = 'rejected', updatedAt = NOW() WHERE id = ?`,
          [orderId],
        )
        await connection.commit()
        return response.json({ ok: true, message: 'Pedido PIX rejeitado.' })
      }

      await connection.query(
        `UPDATE astral_reading_orders SET status = 'approved', updatedAt = NOW() WHERE id = ?`,
        [orderId],
      )

      const settledOrder = await settleAstralReadingOrder(connection, orderId)
      await connection.commit()

      response.json({
        ok: true,
        message: 'Pedido PIX aprovado e leitura astral marcada como paga.',
        order: settledOrder,
      })
    } catch (error) {
      await connection.rollback()
      console.error('[AstralReadings/Admin] Erro ao processar pedido PIX:', error)
      response.status(500).json({ message: 'Erro ao processar pedido PIX.' })
    } finally {
      connection.release()
    }
  })

  return router
}
