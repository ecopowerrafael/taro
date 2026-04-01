import { Router } from 'express'
import Stripe from 'stripe'
import { authenticate, authorizeAdmin, authorizeConsultant } from '../middleware/auth.mjs'

const normalizeSpell = (row) => ({
  ...row,
  price: Number(row.price) || 0,
  sortOrder: Number(row.sortOrder) || 0,
  isActive: Boolean(row.isActive),
})

const normalizeSpellOrder = (row) => ({
  ...row,
  price: Number(row.price) || 0,
  commissionRate: Number(row.commissionRate) || 0,
  commissionValue: Number(row.commissionValue) || 0,
  consultantNetValue: Number(row.consultantNetValue) || 0,
  stripeFeeAmount:
    row.stripeFeeAmount === null || row.stripeFeeAmount === undefined
      ? null
      : Number(row.stripeFeeAmount) || 0,
  stripeNetAmount:
    row.stripeNetAmount === null || row.stripeNetAmount === undefined
      ? null
      : Number(row.stripeNetAmount) || 0,
})

const normalizeNullableText = (value) => {
  const normalized = (value ?? '').toString().trim()
  return normalized === '' ? null : normalized
}

const parseCurrency = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0
}

const clampRate = (value, fallback = 30) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return Math.min(100, Math.max(0, Number(parsed.toFixed(2))))
}

const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const resolveConsultantIdForRequest = async (pool, requestUser) => {
  if (requestUser?.consultantId) {
    return requestUser.consultantId
  }

  const [rows] = await pool.query(
    `SELECT id
     FROM consultants
     WHERE userId = ? OR email = ?
     ORDER BY createdAt DESC
     LIMIT 1`,
    [requestUser?.id || null, requestUser?.email || null],
  )

  return rows[0]?.id || null
}

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
    console.error('[Spells/Stripe] Erro ao buscar stripeSecretKey no banco:', error.message)
  }

  return (process.env.STRIPE_SECRET_KEY || '').trim()
}

const initializeStripe = async (pool) => {
  const secretKey = await resolveStripeSecretKey(pool)

  if (!secretKey) {
    console.warn('[Spells/Stripe] Nenhuma stripeSecretKey encontrada no ambiente ou banco de dados')
    return null
  }

  if (!stripe || activeStripeSecretKey !== secretKey) {
    try {
      stripe = new Stripe(secretKey)
      activeStripeSecretKey = secretKey
    } catch (error) {
      stripe = null
      activeStripeSecretKey = null
      console.error('[Spells/Stripe] Erro ao inicializar:', error.message)
    }
  }

  return stripe
}

const fetchSpellSnapshot = async (executor, spellId) => {
  const [rows] = await executor.query(
    `SELECT
       s.id,
       s.title,
       s.shortDescription,
       s.description,
       s.imageUrl,
       s.consultantId,
       s.price,
       s.isActive,
       s.sortOrder,
       s.createdAt,
       s.updatedAt,
       c.name AS consultantName,
       c.commissionOverride,
       pc.globalCommission
     FROM spells s
     JOIN consultants c ON c.id = s.consultantId
     LEFT JOIN platform_credentials pc ON pc.id = 1
     WHERE s.id = ?
     LIMIT 1`,
    [spellId],
  )

  return rows[0] || null
}

const creditConsultantWalletForSpellOrder = async (connection, order) => {
  if (!order.consultantId) {
    throw new Error('Pedido de magia sem consultor vinculado.')
  }

  const consultantNetValue = parseCurrency(order.consultantNetValue)
  const commissionValue = parseCurrency(order.commissionValue)
  const description = `Venda de magia: ${order.spellTitle}`

  await connection.query(
    `INSERT INTO consultant_wallets (consultantId, availableBalance, pixKey)
     VALUES (?, 0, NULL)
     ON DUPLICATE KEY UPDATE consultantId = VALUES(consultantId)`,
    [order.consultantId],
  )

  await connection.query(
    `UPDATE consultant_wallets
     SET availableBalance = availableBalance + ?
     WHERE consultantId = ?`,
    [consultantNetValue, order.consultantId],
  )

  await connection.query(
    `INSERT INTO wallet_transactions (
       id,
       consultantId,
       type,
       amount,
       commissionValue,
       createdAt,
       description
     ) VALUES (?, ?, 'credit', ?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE
       amount = VALUES(amount),
       commissionValue = VALUES(commissionValue),
       description = VALUES(description)`,
    [`tx_spell_${order.id}`, order.consultantId, consultantNetValue, commissionValue, description],
  )
}

const settleSpellOrder = async (connection, orderId) => {
  const [orders] = await connection.query(
    `SELECT * FROM spell_orders WHERE id = ? FOR UPDATE`,
    [orderId],
  )

  if (!orders.length) {
    throw new Error('Pedido de magia não encontrado para liquidação.')
  }

  const order = normalizeSpellOrder(orders[0])
  if (order.status === 'completed') {
    return order
  }

  await creditConsultantWalletForSpellOrder(connection, order)

  await connection.query(
    `UPDATE spell_orders
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

export const createSpellsRouter = (pool) => {
  const router = Router()

  router.get('/', async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           s.id,
           s.title,
           s.shortDescription,
           s.description,
           s.imageUrl,
           s.consultantId,
           s.price,
           s.isActive,
           s.sortOrder,
           s.createdAt,
           s.updatedAt,
           c.name AS consultantName,
           c.tagline AS consultantTagline,
           c.photo AS consultantPhoto
         FROM spells s
         JOIN consultants c ON c.id = s.consultantId
         WHERE s.isActive = 1
         ORDER BY s.sortOrder ASC, s.updatedAt DESC, s.createdAt DESC`,
      )

      response.json(Array.isArray(rows) ? rows.map(normalizeSpell) : [])
    } catch (error) {
      console.error('[Spells] Erro ao listar magias:', error)
      response.status(500).json({ message: 'Erro ao buscar magias.' })
    }
  })

  router.post('/orders/pix', authenticate, async (request, response) => {
    try {
      const { spellId } = request.body ?? {}
      if (!spellId) {
        return response.status(400).json({ message: 'spellId é obrigatório.' })
      }

      const snapshot = await fetchSpellSnapshot(pool, spellId)
      if (!snapshot || !Number(snapshot.isActive)) {
        return response.status(404).json({ message: 'Magia não encontrada.' })
      }

      const commissionRate = clampRate(snapshot.commissionOverride ?? snapshot.globalCommission, 30)
      const price = parseCurrency(snapshot.price)
      const commissionValue = parseCurrency((price * commissionRate) / 100)
      const consultantNetValue = parseCurrency(price - commissionValue)
      const orderId = createId('spell_pix')

      await pool.query(
        `INSERT INTO spell_orders (
           id,
           userId,
           spellId,
           consultantId,
           spellTitle,
           consultantName,
           price,
           method,
           status,
           commissionRate,
           commissionValue,
           consultantNetValue,
           createdAt,
           updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pix', 'pending', ?, ?, ?, NOW(), NOW())`,
        [
          orderId,
          request.user.id,
          snapshot.id,
          snapshot.consultantId,
          snapshot.title,
          snapshot.consultantName,
          price,
          commissionRate,
          commissionValue,
          consultantNetValue,
        ],
      )

      response.status(201).json({
        ok: true,
        orderId,
        message: 'Pedido PIX criado. Aguarde a validação do pagamento.',
      })
    } catch (error) {
      console.error('[Spells] Erro ao criar pedido PIX:', error)
      response.status(500).json({ message: 'Erro ao registrar pedido PIX.' })
    }
  })

  router.post('/orders/stripe-payment-intent', authenticate, async (request, response) => {
    try {
      const { spellId, customerEmail } = request.body ?? {}
      if (!spellId) {
        return response.status(400).json({ message: 'spellId é obrigatório.' })
      }

      const snapshot = await fetchSpellSnapshot(pool, spellId)
      if (!snapshot || !Number(snapshot.isActive)) {
        return response.status(404).json({ message: 'Magia não encontrada.' })
      }

      const stripeInstance = await initializeStripe(pool)
      if (!stripeInstance) {
        return response.status(500).json({ message: 'Stripe não está configurado no servidor.' })
      }

      const commissionRate = clampRate(snapshot.commissionOverride ?? snapshot.globalCommission, 30)
      const price = parseCurrency(snapshot.price)
      const commissionValue = parseCurrency((price * commissionRate) / 100)
      const consultantNetValue = parseCurrency(price - commissionValue)
      const amountInCents = Math.round(price * 100)

      if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
        return response.status(400).json({ message: 'Valor da magia inválido.' })
      }

      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        metadata: {
          userId: String(request.user.id),
          spellId: String(snapshot.id),
          orderType: 'spell',
        },
        receipt_email: customerEmail || undefined,
      })

      const orderId = `spell_${paymentIntent.id}`

      await pool.query(
        `INSERT INTO spell_orders (
           id,
           userId,
           spellId,
           consultantId,
           spellTitle,
           consultantName,
           price,
           method,
           status,
           commissionRate,
           commissionValue,
           consultantNetValue,
           stripePaymentIntentId,
           createdAt,
           updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 'card', 'processing', ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderId,
          request.user.id,
          snapshot.id,
          snapshot.consultantId,
          snapshot.title,
          snapshot.consultantName,
          price,
          commissionRate,
          commissionValue,
          consultantNetValue,
          paymentIntent.id,
        ],
      )

      response.json({
        ok: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    } catch (error) {
      console.error('[Spells/Stripe] Erro ao criar payment intent:', error)
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
          `UPDATE spell_orders
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
          `UPDATE spell_orders
           SET status = 'rejected', updatedAt = NOW()
           WHERE stripePaymentIntentId = ?`,
          [paymentIntent.id],
        )
      }

      response.json({ received: true })
    } catch (error) {
      console.error('[Spells/Stripe] Erro no webhook:', error)
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
        `SELECT * FROM spell_orders
         WHERE stripePaymentIntentId = ? AND userId = ?
         FOR UPDATE`,
        [paymentIntentId, request.user.id],
      )

      if (!orders.length) {
        await connection.rollback()
        return response.status(404).json({ message: 'Pedido não encontrado.' })
      }

      const currentOrder = normalizeSpellOrder(orders[0])
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
          `UPDATE spell_orders
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
        console.error('[Spells/Stripe] Erro ao validar payment intent:', stripeError.message)
      }

      if (currentOrder.status !== 'approved' && paymentIntentStatus !== 'succeeded') {
        await connection.rollback()
        return response.status(400).json({ message: 'Pagamento ainda não foi aprovado.' })
      }

      const settledOrder = await settleSpellOrder(connection, currentOrder.id)
      await connection.commit()

      response.json({
        ok: true,
        message: 'Pagamento confirmado e comissão repassada ao consultor.',
        order: settledOrder,
      })
    } catch (error) {
      await connection.rollback()
      console.error('[Spells/Stripe] Erro ao confirmar pedido:', error)
      response.status(500).json({ message: 'Erro ao confirmar pedido.' })
    } finally {
      connection.release()
    }
  })

  router.get('/orders/mine', authenticate, authorizeConsultant, async (request, response) => {
    try {
      const consultantId = await resolveConsultantIdForRequest(pool, request.user)
      if (!consultantId) {
        return response.status(404).json({ message: 'Perfil de consultor não encontrado.' })
      }

      const [rows] = await pool.query(
        `SELECT
           so.id,
           so.userId,
           so.spellId,
           so.consultantId,
           so.spellTitle,
           so.consultantName,
           so.price,
           so.method,
           so.status,
           so.commissionRate,
           so.commissionValue,
           so.consultantNetValue,
           so.stripeFeeAmount,
           so.stripeNetAmount,
           so.paidAt,
           so.createdAt,
           so.updatedAt,
           u.name AS userName,
           u.email AS userEmail
         FROM spell_orders so
         JOIN users u ON u.id = so.userId
         WHERE so.consultantId = ?
         ORDER BY so.createdAt DESC`,
        [consultantId],
      )

      response.json(Array.isArray(rows) ? rows.map(normalizeSpellOrder) : [])
    } catch (error) {
      console.error('[Spells/Consultant] Erro ao buscar pedidos atribuídos:', error)
      response.status(500).json({ message: 'Erro ao buscar pedidos atribuídos ao consultor.' })
    }
  })

  router.use(authenticate, authorizeAdmin)

  router.get('/admin', async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           s.id,
           s.title,
           s.shortDescription,
           s.description,
           s.imageUrl,
           s.consultantId,
           s.price,
           s.isActive,
           s.sortOrder,
           s.createdAt,
           s.updatedAt,
           c.name AS consultantName
         FROM spells s
         JOIN consultants c ON c.id = s.consultantId
         ORDER BY s.isActive DESC, s.sortOrder ASC, s.updatedAt DESC`,
      )

      response.json(Array.isArray(rows) ? rows.map(normalizeSpell) : [])
    } catch (error) {
      console.error('[Spells/Admin] Erro ao listar magias:', error)
      response.status(500).json({ message: 'Erro ao buscar magias no admin.' })
    }
  })

  router.get('/orders/pending', async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           so.id,
           so.userId,
           so.spellId,
           so.consultantId,
           so.spellTitle,
           so.consultantName,
           so.price,
           so.method,
           so.status,
           so.commissionRate,
           so.commissionValue,
           so.consultantNetValue,
           so.createdAt,
           u.name AS userName,
           u.email AS userEmail
         FROM spell_orders so
         JOIN users u ON u.id = so.userId
         WHERE so.method = 'pix' AND so.status = 'pending'
         ORDER BY so.createdAt DESC`,
      )

      response.json(Array.isArray(rows) ? rows.map(normalizeSpellOrder) : [])
    } catch (error) {
      console.error('[Spells/Admin] Erro ao buscar pedidos pendentes:', error)
      response.status(500).json({ message: 'Erro ao buscar pedidos pendentes.' })
    }
  })

  router.get('/orders/admin', async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           so.id,
           so.userId,
           so.spellId,
           so.consultantId,
           so.spellTitle,
           so.consultantName,
           so.price,
           so.method,
           so.status,
           so.commissionRate,
           so.commissionValue,
           so.consultantNetValue,
           so.stripeFeeAmount,
           so.stripeNetAmount,
           so.paidAt,
           so.createdAt,
           so.updatedAt,
           u.name AS userName,
           u.email AS userEmail
         FROM spell_orders so
         JOIN users u ON u.id = so.userId
         ORDER BY so.createdAt DESC`,
      )

      response.json(Array.isArray(rows) ? rows.map(normalizeSpellOrder) : [])
    } catch (error) {
      console.error('[Spells/Admin] Erro ao buscar histórico de pedidos:', error)
      response.status(500).json({ message: 'Erro ao buscar histórico de pedidos de magias.' })
    }
  })

  router.post('/', async (request, response) => {
    try {
      const {
        title,
        shortDescription,
        description,
        imageUrl,
        consultantId,
        price,
      } = request.body ?? {}

      if (!title?.trim() || !description?.trim() || !consultantId || !Number(price)) {
        return response.status(400).json({
          message: 'Informe título, descrição, consultor e preço válido para a magia.',
        })
      }

      const [sortRows] = await pool.query('SELECT COALESCE(MAX(sortOrder), 0) + 1 AS nextSortOrder FROM spells')
      const nextSortOrder = Number(sortRows?.[0]?.nextSortOrder) || 1
      const id = createId('spell')

      await pool.query(
        `INSERT INTO spells (
           id,
           title,
           shortDescription,
           description,
           imageUrl,
           consultantId,
           price,
           isActive,
           sortOrder,
           createdAt,
           updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
        [
          id,
          title.trim(),
          normalizeNullableText(shortDescription),
          description.trim(),
          normalizeNullableText(imageUrl),
          consultantId,
          parseCurrency(price),
          nextSortOrder,
        ],
      )

      const created = await fetchSpellSnapshot(pool, id)
      response.status(201).json(normalizeSpell(created))
    } catch (error) {
      console.error('[Spells/Admin] Erro ao criar magia:', error)
      response.status(500).json({ message: 'Erro ao criar magia.' })
    }
  })

  router.put('/:id', async (request, response) => {
    try {
      const { id } = request.params
      const {
        title,
        shortDescription,
        description,
        imageUrl,
        consultantId,
        price,
        isActive,
      } = request.body ?? {}

      if (!title?.trim() || !description?.trim() || !consultantId || !Number(price)) {
        return response.status(400).json({
          message: 'Informe título, descrição, consultor e preço válido para a magia.',
        })
      }

      const [result] = await pool.query(
        `UPDATE spells
         SET
           title = ?,
           shortDescription = ?,
           description = ?,
           imageUrl = ?,
           consultantId = ?,
           price = ?,
           isActive = ?,
           updatedAt = NOW()
         WHERE id = ?`,
        [
          title.trim(),
          normalizeNullableText(shortDescription),
          description.trim(),
          normalizeNullableText(imageUrl),
          consultantId,
          parseCurrency(price),
          isActive === false ? 0 : 1,
          id,
        ],
      )

      if (!result.affectedRows) {
        return response.status(404).json({ message: 'Magia não encontrada.' })
      }

      const updated = await fetchSpellSnapshot(pool, id)
      response.json(normalizeSpell(updated))
    } catch (error) {
      console.error('[Spells/Admin] Erro ao atualizar magia:', error)
      response.status(500).json({ message: 'Erro ao atualizar magia.' })
    }
  })

  router.delete('/:id', async (request, response) => {
    try {
      const { id } = request.params
      const [result] = await pool.query(
        `UPDATE spells SET isActive = 0, updatedAt = NOW() WHERE id = ?`,
        [id],
      )

      if (!result.affectedRows) {
        return response.status(404).json({ message: 'Magia não encontrada.' })
      }

      response.json({ ok: true, message: 'Magia removida da vitrine com sucesso.' })
    } catch (error) {
      console.error('[Spells/Admin] Erro ao remover magia:', error)
      response.status(500).json({ message: 'Erro ao remover magia.' })
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
        `SELECT * FROM spell_orders WHERE id = ? FOR UPDATE`,
        [orderId],
      )

      if (!orders.length) {
        await connection.rollback()
        return response.status(404).json({ message: 'Pedido não encontrado.' })
      }

      const currentOrder = normalizeSpellOrder(orders[0])
      if (currentOrder.method !== 'pix' || currentOrder.status !== 'pending') {
        await connection.rollback()
        return response.status(400).json({ message: 'Este pedido não pode mais ser processado.' })
      }

      if (action === 'rejected') {
        await connection.query(
          `UPDATE spell_orders SET status = 'rejected', updatedAt = NOW() WHERE id = ?`,
          [orderId],
        )
        await connection.commit()
        return response.json({ ok: true, message: 'Pedido PIX rejeitado.' })
      }

      await connection.query(
        `UPDATE spell_orders SET status = 'approved', updatedAt = NOW() WHERE id = ?`,
        [orderId],
      )

      const settledOrder = await settleSpellOrder(connection, orderId)
      await connection.commit()

      response.json({
        ok: true,
        message: 'Pedido PIX aprovado e comissão repassada ao consultor.',
        order: settledOrder,
      })
    } catch (error) {
      await connection.rollback()
      console.error('[Spells/Admin] Erro ao processar pedido PIX:', error)
      response.status(500).json({ message: 'Erro ao processar pedido PIX.' })
    } finally {
      connection.release()
    }
  })

  return router
}