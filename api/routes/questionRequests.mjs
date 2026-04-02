import { Router } from 'express'
import { sendPushToUsers } from '../push.mjs'

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const parseEntries = (entriesValue) => {
  if (Array.isArray(entriesValue)) {
    return entriesValue
  }
  if (typeof entriesValue === 'string') {
    try {
      const parsed = JSON.parse(entriesValue)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export const createQuestionRequestsRouter = (pool) => {
  const router = Router()

  router.get('/', async (_request, response) => {
    const [rows] = await pool.query(
      `
        SELECT
          id,
          consultantId,
          consultantName,
          customerName,
          customerEmail,
          questionCount,
          packagePrice,
          entries,
          status,
          createdAt,
          answeredAt,
          answerSummary,
          commissionValue,
          consultantNetValue
        FROM question_requests
        ORDER BY createdAt DESC
      `,
    )

    response.json(
      rows.map((row) => ({
        ...row,
        entries: parseEntries(row.entries),
      })),
    )
  })

  router.post('/', async (request, response) => {
    const payload = request.body ?? {}
    const {
      id,
      consultantId,
      consultantName,
      customerName,
      customerEmail,
      questionCount,
      packagePrice,
      entries,
      createdAt,
    } = payload

    // Validação detalhada
    const missingFields = []
    if (!id) missingFields.push('id')
    if (!consultantId) missingFields.push('consultantId')
    if (!consultantName) missingFields.push('consultantName')
    if (!customerName) missingFields.push('customerName')
    if (!customerEmail) missingFields.push('customerEmail')

    if (missingFields.length > 0) {
      response.status(400).json({ 
        message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        missingFields,
        receivedData: { id, consultantId, consultantName, customerName, customerEmail }
      })
      return
    }

    const normalizedEntries = Array.isArray(entries) ? entries : []
    const normalizedCreatedAt = createdAt || new Date().toISOString()

    await pool.query(
      `
        INSERT INTO question_requests (
          id,
          consultantId,
          consultantName,
          customerName,
          customerEmail,
          questionCount,
          packagePrice,
          entries,
          status,
          createdAt,
          answeredAt,
          answerSummary,
          commissionValue,
          consultantNetValue
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, NULL, 0, 0)
      `,
      [
        id,
        consultantId,
        consultantName,
        customerName,
        customerEmail,
        Math.max(1, Math.floor(parseNumber(questionCount, 1))),
        parseNumber(packagePrice),
        JSON.stringify(normalizedEntries),
        new Date(normalizedCreatedAt),
      ],
    )

    try {
      const [consultants] = await pool.query(
        'SELECT id, email, userId FROM consultants WHERE id = ? LIMIT 1',
        [consultantId],
      )
      const consultant = consultants[0]
      let consultantUserId = consultant?.userId || null

      if (!consultantUserId && consultant?.email) {
        const [consultantUsers] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [consultant.email])
        consultantUserId = consultantUsers[0]?.id || null
      }

      const io = request.app.get('io')
      if (io) {
        io.to(`consultant_${consultantId}`).emit('new_question', {
          requestId: id,
          consultantId,
          clientName: customerName,
          questionCount: Math.max(1, Math.floor(parseNumber(questionCount, 1))),
          preview: normalizedEntries[0]?.question || normalizedEntries[0]?.text || 'Nova consulta por perguntas recebida.',
        })
      }

      const webpush = request.app.get('webpush')
      const firebaseAdmin = request.app.get('firebaseAdmin')
      if ((webpush || firebaseAdmin) && consultantUserId) {
        await sendPushToUsers({
          pool,
          webpush,
          firebaseAdmin,
          userIds: [consultantUserId],
          payload: {
            title: 'Nova Consulta por Perguntas',
            body: `${customerName} enviou ${Math.max(1, Math.floor(parseNumber(questionCount, 1)))} pergunta(s) para você.`,
            url: 'https://appastria.online/area-consultor?tab=questions',
            nativeRoute: '/area-consultor?tab=questions',
            type: 'new_question',
            requestId: id,
            consultantId,
            customerName,
            questionCount: Math.max(1, Math.floor(parseNumber(questionCount, 1))),
          },
        })
      }
    } catch (notificationError) {
      console.error('[questionRequests POST] erro ao notificar consultor:', notificationError)
    }

    response.status(201).json({
      id,
      consultantId,
      consultantName,
      customerName,
      customerEmail,
      questionCount: Math.max(1, Math.floor(parseNumber(questionCount, 1))),
      packagePrice: parseNumber(packagePrice),
      entries: normalizedEntries,
      status: 'pending',
      createdAt: normalizedCreatedAt,
      answeredAt: null,
      answerSummary: null,
      commissionValue: 0,
      consultantNetValue: 0,
    })
  })

  router.patch('/:id/answer', async (request, response) => {
    const { id } = request.params
    const { consultantId, answerSummary, commissionRate, answeredEntries } = request.body ?? {}

    if (!consultantId || !answerSummary?.trim()) {
      response.status(400).json({ message: 'consultantId e answerSummary são obrigatórios.' })
      return
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [rows] = await connection.query(
        `SELECT * FROM question_requests WHERE id = ? AND consultantId = ? FOR UPDATE`,
        [id, consultantId],
      )

      if (!rows.length) {
        await connection.rollback()
        response.status(404).json({ message: 'Solicitação não encontrada.' })
        return
      }

      const current = rows[0]
      if (current.status === 'answered') {
        await connection.rollback()
        response.status(409).json({ message: 'Solicitação já respondida.' })
        return
      }

      const rate = Math.min(100, Math.max(0, parseNumber(commissionRate, 30)))
      const packagePrice = parseNumber(current.packagePrice)
      const commissionValue = Number(((packagePrice * rate) / 100).toFixed(2))
      const consultantNetValue = Number((packagePrice - commissionValue).toFixed(2))
      const answeredAtDate = new Date()
      const txId = `tx_${id}`
      const txDescription = `Ganho de consulta por perguntas`
      const currentEntries = parseEntries(current.entries)
      const normalizedAnsweredEntries = Array.isArray(answeredEntries)
        ? currentEntries.map((entry, index) => ({
            ...entry,
            ...(answeredEntries[index] || {}),
            question:
              answeredEntries[index]?.question ??
              entry?.question ??
              entry?.text ??
              (entry?.fileName ? `Áudio: ${entry.fileName}` : 'Pergunta não informada'),
            answer: answeredEntries[index]?.answer ?? entry?.answer ?? '',
          }))
        : currentEntries

      await connection.query(
        `
          UPDATE question_requests
          SET
            status = 'answered',
            answeredAt = ?,
            answerSummary = ?,
            entries = ?,
            commissionValue = ?,
            consultantNetValue = ?
          WHERE id = ?
        `,
        [answeredAtDate, answerSummary.trim(), JSON.stringify(normalizedAnsweredEntries), commissionValue, consultantNetValue, id],
      )

      await connection.query(
        `
          INSERT INTO consultant_wallets (consultantId, availableBalance, pixKey)
          VALUES (?, 0, NULL)
          ON DUPLICATE KEY UPDATE consultantId = VALUES(consultantId)
        `,
        [consultantId],
      )

      await connection.query(
        `
          UPDATE consultant_wallets
          SET availableBalance = availableBalance + ?
          WHERE consultantId = ?
        `,
        [consultantNetValue, consultantId],
      )

      await connection.query(
        `
          INSERT INTO wallet_transactions (
            id,
            consultantId,
            type,
            amount,
            commissionValue,
            createdAt,
            description
          ) VALUES (?, ?, 'credit', ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            amount = VALUES(amount),
            commissionValue = VALUES(commissionValue),
            createdAt = VALUES(createdAt),
            description = VALUES(description)
        `,
        [txId, consultantId, consultantNetValue, commissionValue, answeredAtDate, txDescription],
      )

      await connection.query(
        `UPDATE consultants SET realSessions = realSessions + 1 WHERE id = ?`,
        [consultantId],
      )

      const [walletRows] = await connection.query(
        `SELECT consultantId, availableBalance, pixKey FROM consultant_wallets WHERE consultantId = ?`,
        [consultantId],
      )
      const [transactionsRows] = await connection.query(
        `
          SELECT id, type, amount, commissionValue, createdAt, description
          FROM wallet_transactions
          WHERE consultantId = ?
          ORDER BY createdAt DESC
        `,
        [consultantId],
      )
      const [withdrawalsRows] = await connection.query(
        `
          SELECT id, amount, createdAt, status
          FROM wallet_withdrawals
          WHERE consultantId = ?
          ORDER BY createdAt DESC
        `,
        [consultantId],
      )

      await connection.commit()

      try {
        const [customerUsers] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [current.customerEmail])
        const customerUserId = customerUsers[0]?.id || null
        const webpush = request.app.get('webpush')
        const firebaseAdmin = request.app.get('firebaseAdmin')

        if (customerUserId && (webpush || firebaseAdmin)) {
          await sendPushToUsers({
            pool,
            webpush,
            firebaseAdmin,
            userIds: [customerUserId],
            payload: {
              title: 'Sua consulta foi respondida',
              body: `${current.consultantName} enviou a resposta da sua consulta por perguntas.`,
              url: '/perfil?tab=questions',
              nativeRoute: '/perfil?tab=questions',
              type: 'question_answered',
              requestId: id,
              consultantId,
              consultantName: current.consultantName,
            },
          })
        }
      } catch (notificationError) {
        console.error('[questionRequests answer] erro ao notificar cliente:', notificationError)
      }

      response.json({
        request: {
          ...current,
          entries: normalizedAnsweredEntries,
          status: 'answered',
          answeredAt: answeredAtDate.toISOString(),
          answerSummary: answerSummary.trim(),
          commissionValue,
          consultantNetValue,
        },
        wallet: {
          consultantId,
          availableBalance: Number(walletRows[0]?.availableBalance ?? 0),
          pixKey: walletRows[0]?.pixKey ?? '',
          transactions: transactionsRows.map((item) => ({
            ...item,
            amount: Number(item.amount),
            commissionValue:
              item.commissionValue === null || item.commissionValue === undefined
                ? null
                : Number(item.commissionValue),
          })),
          withdrawals: withdrawalsRows.map((item) => ({
            ...item,
            amount: Number(item.amount),
          })),
        },
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  })

  return router
}
