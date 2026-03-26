import { Router } from 'express'

const MIN_WITHDRAWAL_AMOUNT = Number(process.env.MIN_WITHDRAWAL_AMOUNT || 50)

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const createWalletsRouter = (pool) => {
  const router = Router()

  router.get('/', async (_request, response) => {
    const [walletRows] = await pool.query(
      `SELECT consultantId, availableBalance, pixKey FROM consultant_wallets`,
    )
    const [transactionsRows] = await pool.query(
      `
        SELECT id, consultantId, type, amount, commissionValue, createdAt, description
        FROM wallet_transactions
        ORDER BY createdAt DESC
      `,
    )
    const [withdrawalsRows] = await pool.query(
      `
        SELECT id, consultantId, amount, createdAt, status
        FROM wallet_withdrawals
        ORDER BY createdAt DESC
      `,
    )

    const transactionsByConsultant = new Map()
    transactionsRows.forEach((item) => {
      if (!transactionsByConsultant.has(item.consultantId)) {
        transactionsByConsultant.set(item.consultantId, [])
      }
      transactionsByConsultant.get(item.consultantId).push({
        ...item,
        amount: Number(item.amount),
        commissionValue:
          item.commissionValue === null || item.commissionValue === undefined
            ? null
            : Number(item.commissionValue),
      })
    })

    const withdrawalsByConsultant = new Map()
    withdrawalsRows.forEach((item) => {
      if (!withdrawalsByConsultant.has(item.consultantId)) {
        withdrawalsByConsultant.set(item.consultantId, [])
      }
      withdrawalsByConsultant.get(item.consultantId).push({
        ...item,
        amount: Number(item.amount),
      })
    })

    response.json(
      walletRows.map((wallet) => ({
        consultantId: wallet.consultantId,
        availableBalance: Number(wallet.availableBalance),
        pixKey: wallet.pixKey ?? '',
        transactions: transactionsByConsultant.get(wallet.consultantId) ?? [],
        withdrawals: withdrawalsByConsultant.get(wallet.consultantId) ?? [],
      })),
    )
  })

  router.put('/:consultantId/pix-key', async (request, response) => {
    const { consultantId } = request.params
    const pixKey = (request.body?.pixKey || '').trim()

    await pool.query(
      `
        INSERT INTO consultant_wallets (consultantId, availableBalance, pixKey)
        VALUES (?, 0, ?)
        ON DUPLICATE KEY UPDATE pixKey = VALUES(pixKey)
      `,
      [consultantId, pixKey || null],
    )

    response.json({ ok: true, pixKey })
  })

  router.post('/:consultantId/withdrawals', async (request, response) => {
    const { consultantId } = request.params
    const amount = parseNumber(request.body?.amount)
    const status = request.body?.status || 'Em análise'

    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      response.status(400).json({
        message: `Saque mínimo é R$ ${MIN_WITHDRAWAL_AMOUNT.toFixed(2)}.`,
      })
      return
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await connection.query(
        `
          INSERT INTO consultant_wallets (consultantId, availableBalance, pixKey)
          VALUES (?, 0, NULL)
          ON DUPLICATE KEY UPDATE consultantId = VALUES(consultantId)
        `,
        [consultantId],
      )

      const [walletRows] = await connection.query(
        `
          SELECT consultantId, availableBalance, pixKey
          FROM consultant_wallets
          WHERE consultantId = ?
          FOR UPDATE
        `,
        [consultantId],
      )
      const wallet = walletRows[0]
      const availableBalance = Number(wallet?.availableBalance ?? 0)
      if (!wallet?.pixKey) {
        await connection.rollback()
        response.status(400).json({ message: 'Cadastre uma chave PIX antes de solicitar saque.' })
        return
      }
      if (amount > availableBalance) {
        await connection.rollback()
        response.status(400).json({ message: 'Saldo insuficiente para saque.' })
        return
      }

      const now = new Date()
      const withdrawalId = `wd_${consultantId}_${now.getTime()}`
      const transactionId = `tx_wd_${consultantId}_${now.getTime()}`

      await connection.query(
        `
          UPDATE consultant_wallets
          SET availableBalance = availableBalance - ?
          WHERE consultantId = ?
        `,
        [amount, consultantId],
      )

      await connection.query(
        `
          INSERT INTO wallet_withdrawals (id, consultantId, amount, createdAt, status)
          VALUES (?, ?, ?, ?, ?)
        `,
        [withdrawalId, consultantId, amount, now, status],
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
          ) VALUES (?, ?, 'debit', ?, NULL, ?, 'Solicitação de saque')
        `,
        [transactionId, consultantId, amount, now],
      )

      const [updatedWalletRows] = await connection.query(
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

      response.json({
        message: 'Saque solicitado com sucesso.',
        wallet: {
          consultantId,
          availableBalance: Number(updatedWalletRows[0]?.availableBalance ?? 0),
          pixKey: updatedWalletRows[0]?.pixKey ?? '',
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

  // GET /transactions - Extrato paginado do consultor autenticado
  router.get('/transactions/statement', async (request, response) => {
    const consultantId = request.body?.consultantId || request.query?.consultantId
    const page = Math.max(1, parseInt(request.query?.page || 1))
    const limit = 10
    const offset = (page - 1) * limit

    if (!consultantId) {
      return response.status(400).json({ message: 'consultantId não fornecido' })
    }

    try {
      // Buscar transações (créditos do serviço)
      const [transactions] = await pool.query(
        `SELECT id, type, amount, commissionValue, createdAt, description
         FROM wallet_transactions
         WHERE consultantId = ?
         ORDER BY createdAt DESC
         LIMIT ? OFFSET ?`,
        [consultantId, limit, offset]
      )

      // Buscar saques
      const [withdrawals] = await pool.query(
        `SELECT id, amount, createdAt, status
         FROM wallet_withdrawals
         WHERE consultantId = ?
         ORDER BY createdAt DESC
         LIMIT ? OFFSET ?`,
        [consultantId, limit, offset]
      )

      // Combinar e ordenar por data (mais recentes primeiro)
      const movements = [
        ...transactions.map(t => ({
          id: t.id,
          type: 'transaction',
          category: t.type === 'credit' ? 'Entrada' : 'Saída',
          amount: Number(t.amount),
          commissionValue: t.commissionValue ? Number(t.commissionValue) : null,
          createdAt: t.createdAt,
          description: t.description,
          status: 'Concluído'
        })),
        ...withdrawals.map(w => ({
          id: w.id,
          type: 'withdrawal',
          category: 'Saque',
          amount: Number(w.amount),
          commissionValue: null,
          createdAt: w.createdAt,
          description: `Saque - Status: ${w.status}`,
          status: w.status
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      // Buscar total de registros (para calcular total de páginas)
      const [[{ totalTransactions }]] = await pool.query(
        `SELECT COUNT(*) as totalTransactions FROM wallet_transactions WHERE consultantId = ?`,
        [consultantId]
      )
      const [[{ totalWithdrawals }]] = await pool.query(
        `SELECT COUNT(*) as totalWithdrawals FROM wallet_withdrawals WHERE consultantId = ?`,
        [consultantId]
      )

      const totalItems = totalTransactions + totalWithdrawals
      const totalPages = Math.ceil(totalItems / limit)

      response.json({
        ok: true,
        movements: movements.slice(0, limit),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasMore: page < totalPages
        }
      })
    } catch (error) {
      console.error('[wallets /transactions/statement] Erro:', error)
      response.status(500).json({ message: 'Erro ao buscar extrato.' })
    }
  })

  return router
}

