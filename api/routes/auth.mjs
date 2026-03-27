import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authenticate, authorizeAdmin } from '../middleware/auth.mjs'

const JWT_SECRET = process.env.JWT_SECRET || 'taro-secret-key-123'

export const createAuthRouter = (pool) => {
  const router = Router()
  // Fallback temporário para taxas Stripe quando a API não retorna fee real.
  // Mantido como constante explícita para facilitar remoção ou ajuste futuro.
  const STRIPE_FEE_FALLBACK_RATE = 0.12
  // Regra de negócio: sobre o saldo em custódia, projetamos 30% de retorno
  // para a plataforma quando esse saldo for consumido em consultas.
  const CUSTODY_EXPECTED_RETURN_RATE = 0.3

  // Register
  router.post('/register', async (request, response) => {
    const { name, email, password, birthDate, role = 'client' } = request.body

    if (!name || !email || !password) {
      return response.status(400).json({ message: 'Nome, email e senha são obrigatórios.' })
    }

    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
      if (existing.length > 0) {
        return response.status(400).json({ message: 'Email já cadastrado.' })
      }

      const id = 'u_' + Math.random().toString(36).substr(2, 9)
      const hashedPassword = await bcrypt.hash(password, 10)
      const createdAt = new Date()

      await pool.query(
        `INSERT INTO users (id, name, email, password, role, birthDate, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, email, hashedPassword, role, birthDate || null, createdAt]
      )

      const token = jwt.sign({ id, role, email }, JWT_SECRET, { expiresIn: '7d' })

      response.status(201).json({
        token,
        user: { id, name, email, role, birthDate, minutesBalance: 0 }
      })
    } catch (error) {
      console.error('Erro no registro:', error)
      response.status(500).json({ message: 'Erro ao criar conta.' })
    }
  })

  // Register Consultant
  router.post('/register-consultant', async (request, response) => {
    const { name, email, password, tagline, description, photo, pricePerMinute, priceThreeQuestions, priceFiveQuestions } = request.body

    if (!name || !email || !password) {
      return response.status(400).json({ message: 'Nome, email e senha são obrigatórios.' })
    }

    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
      if (existing.length > 0) {
        return response.status(400).json({ message: 'Email já cadastrado.' })
      }

      const userId = 'u_' + Math.random().toString(36).substr(2, 9)
      const consultantId = 'c_' + Math.random().toString(36).substr(2, 9)
      const hashedPassword = await bcrypt.hash(password, 10)
      const createdAt = new Date()

      // Inicia transação
      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()

        await connection.query(
          `INSERT INTO users (id, name, email, password, role, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, name, email, hashedPassword, 'consultant', createdAt]
        )

        await connection.query(
          `INSERT INTO consultants (
            id, name, email, tagline, description, photo, 
            pricePerMinute, priceThreeQuestions, priceFiveQuestions, 
            status, createdAt, userId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            consultantId, name, email, tagline || null, description || null, photo || null,
            pricePerMinute || 0, priceThreeQuestions || 0, priceFiveQuestions || 0,
            'Pendente', createdAt, userId
          ]
        )

        // Criar carteira
        await connection.query(
          'INSERT INTO consultant_wallets (consultantId, availableBalance) VALUES (?, 0)',
          [consultantId]
        )

        await connection.commit()
        
        const token = jwt.sign({ id: userId, consultantId, role: 'consultant', email }, JWT_SECRET, { expiresIn: '7d' })

        response.status(201).json({
          token,
          user: { id: userId, name, email, role: 'consultant', minutesBalance: 0 }
        })
      } catch (err) {
        await connection.rollback()
        throw err
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error('Erro no registro de consultor:', error)
      response.status(500).json({ message: 'Erro ao criar conta de consultor.' })
    }
  })

  // Login
  router.post('/login', async (request, response) => {
    const { email, password } = request.body

    if (!email || !password) {
      return response.status(400).json({ message: 'Email e senha são obrigatórios.' })
    }

    try {
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
      if (users.length === 0) {
        return response.status(401).json({ message: 'Credenciais inválidas.' })
      }

      const user = users[0]
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return response.status(401).json({ message: 'Credenciais inválidas.' })
      }

      // Se for consultor, buscar consultantId para adicionar ao token
      let tokenPayload = { id: user.id, role: user.role, email: user.email }
      if (user.role === 'consultant') {
        const [consultants] = await pool.query('SELECT id FROM consultants WHERE userId = ?', [user.id])
        if (consultants.length > 0) {
          tokenPayload.consultantId = consultants[0].id
        }
      }

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' })

      response.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          birthDate: user.birthDate,
          minutesBalance: user.minutesBalance
        }
      })
    } catch (error) {
      console.error('Erro no login:', error)
      response.status(500).json({ message: 'Erro ao entrar.' })
    }
  })

  // Get Profile
  router.get('/profile', async (request, response) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return response.status(401).json({ message: 'Não autorizado.' })
    }

    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id])
      if (users.length === 0) {
        return response.status(404).json({ message: 'Usuário não encontrado.' })
      }

      const user = users[0]
      const response_data = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        birthDate: user.birthDate,
        minutesBalance: user.minutesBalance
      }

      // Se for consultor, adicionar consultantId
      if (user.role === 'consultant') {
        const [consultants] = await pool.query('SELECT id FROM consultants WHERE userId = ?', [user.id])
        if (consultants.length > 0) {
          response_data.consultantId = consultants[0].id
        }
      }

      response.json(response_data)
    } catch (error) {
      response.status(401).json({ message: 'Token inválido.' })
    }
  })

  // Update Profile
  router.put('/profile', async (request, response) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return response.status(401).json({ message: 'Não autorizado.' })
    }

    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const { name, birthDate } = request.body

      await pool.query(
        'UPDATE users SET name = ?, birthDate = ? WHERE id = ?',
        [name, birthDate, decoded.id]
      )

      response.json({ message: 'Perfil atualizado com sucesso.' })
    } catch (error) {
      response.status(401).json({ message: 'Token inválido.' })
    }
  })

  // Add Minutes (Recharge)
  router.post('/recharge', async (request, response) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return response.status(401).json({ message: 'Não autorizado.' })
    }

    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const { minutes } = request.body

      if (!minutes || minutes <= 0) {
        return response.status(400).json({ message: 'Quantidade de minutos inválida.' })
      }

      await pool.query(
        'UPDATE users SET minutesBalance = minutesBalance + ? WHERE id = ?',
        [minutes, decoded.id]
      )

      const [updated] = await pool.query('SELECT minutesBalance FROM users WHERE id = ?', [decoded.id])

      response.json({ 
        ok: true, 
        message: 'Recarga realizada com sucesso.', 
        minutesBalance: updated[0].minutesBalance 
      })
    } catch (error) {
      console.error('Erro na recarga:', error)
      response.status(401).json({ message: 'Token inválido ou erro no servidor.' })
    }
  })

  // Debit Minutes (para perguntas/consultas)
  router.patch('/debit-minutes', async (request, response) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return response.status(401).json({ message: 'Não autorizado.' })
    }

    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const { minutes } = request.body

      if (!minutes || minutes <= 0) {
        return response.status(400).json({ message: 'Quantidade de minutos inválida.' })
      }

      // Primeiro verifica se tem saldo
      const [users] = await pool.query('SELECT minutesBalance FROM users WHERE id = ?', [decoded.id])
      if (!users.length || users[0].minutesBalance < minutes) {
        return response.status(402).json({ message: 'Saldo insuficiente.' })
      }

      // Debita
      await pool.query(
        'UPDATE users SET minutesBalance = minutesBalance - ? WHERE id = ?',
        [minutes, decoded.id]
      )

      const [updated] = await pool.query('SELECT minutesBalance FROM users WHERE id = ?', [decoded.id])

      response.json({ 
        ok: true, 
        message: 'Minutos debitados com sucesso.', 
        minutesBalance: updated[0].minutesBalance 
      })
    } catch (error) {
      console.error('Erro ao debitar minutos:', error)
      response.status(401).json({ message: 'Token inválido ou erro no servidor.' })
    }
  })

  // Admin: listar usuários com estatísticas de consumo
  router.get('/admin/users', authenticate, authorizeAdmin, async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          u.id,
          u.name,
          u.email,
          u.role,
          u.birthDate,
          u.minutesBalance,
          u.createdAt,
          (
            SELECT COUNT(*)
            FROM question_requests qr
            WHERE qr.customerEmail = u.email AND qr.questionCount = 3
          ) AS threeQuestionsCount,
          (
            SELECT COUNT(*)
            FROM question_requests qr
            WHERE qr.customerEmail = u.email AND qr.questionCount = 5
          ) AS fiveQuestionsCount,
          (
            SELECT COUNT(*)
            FROM video_sessions vs
            WHERE vs.userId = u.id
          ) AS liveConsultationsCount
        FROM users u
        ORDER BY u.createdAt DESC`
      )

      response.json(
        rows.map((row) => ({
          ...row,
          minutesBalance: Number(row.minutesBalance) || 0,
          threeQuestionsCount: Number(row.threeQuestionsCount) || 0,
          fiveQuestionsCount: Number(row.fiveQuestionsCount) || 0,
          liveConsultationsCount: Number(row.liveConsultationsCount) || 0,
        })),
      )
    } catch (error) {
      console.error('[Admin Users] Erro ao listar usuários:', error)
      response.status(500).json({ message: 'Erro ao listar usuários.' })
    }
  })

  // Admin: atualizar usuário e opcionalmente redefinir senha
  router.put('/admin/users/:id', authenticate, authorizeAdmin, async (request, response) => {
    const { id } = request.params
    const {
      name,
      email,
      role,
      birthDate,
      minutesBalance,
      newPassword,
    } = request.body ?? {}

    const trimmedName = String(name ?? '').trim()
    const trimmedEmail = String(email ?? '').trim().toLowerCase()
    const normalizedRole = String(role ?? '').trim()
    const parsedBalance = Number(minutesBalance)
    const passwordText = String(newPassword ?? '').trim()

    if (!trimmedName || !trimmedEmail || !normalizedRole) {
      return response.status(400).json({ message: 'Nome, email e perfil são obrigatórios.' })
    }

    if (!['client', 'consultant', 'admin'].includes(normalizedRole)) {
      return response.status(400).json({ message: 'Perfil inválido.' })
    }

    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
      return response.status(400).json({ message: 'Saldo inválido.' })
    }

    if (passwordText && passwordText.length < 6) {
      return response.status(400).json({ message: 'A nova senha deve ter ao menos 6 caracteres.' })
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const [existingUsers] = await connection.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [id])
      if (!existingUsers.length) {
        await connection.rollback()
        return response.status(404).json({ message: 'Usuário não encontrado.' })
      }

      const [emailConflict] = await connection.query(
        'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
        [trimmedEmail, id],
      )
      if (emailConflict.length > 0) {
        await connection.rollback()
        return response.status(409).json({ message: 'Este email já está em uso por outro usuário.' })
      }

      if (passwordText) {
        const hashedPassword = await bcrypt.hash(passwordText, 10)
        await connection.query(
          `UPDATE users
           SET name = ?, email = ?, role = ?, birthDate = ?, minutesBalance = ?, password = ?
           WHERE id = ?`,
          [
            trimmedName,
            trimmedEmail,
            normalizedRole,
            birthDate || null,
            parsedBalance,
            hashedPassword,
            id,
          ],
        )
      } else {
        await connection.query(
          `UPDATE users
           SET name = ?, email = ?, role = ?, birthDate = ?, minutesBalance = ?
           WHERE id = ?`,
          [trimmedName, trimmedEmail, normalizedRole, birthDate || null, parsedBalance, id],
        )
      }

      await connection.query(
        'UPDATE consultants SET name = ?, email = ? WHERE userId = ?',
        [trimmedName, trimmedEmail, id],
      )

      await connection.commit()
      response.json({ ok: true, message: 'Usuário atualizado com sucesso.' })
    } catch (error) {
      await connection.rollback()
      console.error('[Admin Users] Erro ao atualizar usuário:', error)
      response.status(500).json({ message: 'Erro ao atualizar usuário.' })
    } finally {
      connection.release()
    }
  })

  // Admin: métricas do dashboard
  router.get('/admin/dashboard-metrics', authenticate, authorizeAdmin, async (_request, response) => {
    try {
      const rechargeDateExpression = 'COALESCE(updatedAt, createdAt)'
      const payoutDateExpression = 'createdAt'

      const [[rechargeTotalsRow]] = await pool.query(
        `SELECT
          COALESCE(SUM(CASE WHEN status IN ('approved', 'completed') THEN amount ELSE 0 END), 0) AS totalBilled
         FROM recharge_requests`
      )

      const [[commissionRow]] = await pool.query(
        `SELECT COALESCE(SUM(commissionValue), 0) AS totalCommission
         FROM wallet_transactions`
      )

      const [[essentialKpisRow]] = await pool.query(
        `SELECT
          COALESCE(SUM(CASE
            WHEN status IN ('approved', 'completed')
             AND DATE(${rechargeDateExpression}) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
            THEN amount ELSE 0 END), 0) AS vgvLast30Days,
          COALESCE(SUM(CASE
            WHEN status IN ('approved', 'completed')
             AND DATE(${rechargeDateExpression}) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
             AND method = 'card'
            THEN COALESCE(stripeFeeAmount, ROUND(amount * ${STRIPE_FEE_FALLBACK_RATE}, 2)) ELSE 0 END), 0) AS stripeFeesLast30Days,
          COALESCE(AVG(CASE
            WHEN status IN ('approved', 'completed')
             AND DATE(${rechargeDateExpression}) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
            THEN amount ELSE NULL END), 0) AS averageRechargeTicketLast30Days,
          COALESCE(COUNT(CASE
            WHEN status IN ('approved', 'completed')
             AND DATE(${rechargeDateExpression}) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
            THEN 1 ELSE NULL END), 0) AS rechargeCountLast30Days
         FROM recharge_requests`
      )

      const [[custodyRow]] = await pool.query(
        `SELECT COALESCE(SUM(minutesBalance), 0) AS custodyBalance
         FROM users
         WHERE role = 'client'`
      )

      const [[consultantPayoutRow]] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS consultantPayoutLast30Days
         FROM wallet_transactions
         WHERE type = 'credit'
           AND DATE(${payoutDateExpression}) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
      )

      const [[countsRow]] = await pool.query(
        `SELECT
          (SELECT COUNT(*) FROM question_requests WHERE questionCount = 3) AS totalQuestions3,
          (SELECT COUNT(*) FROM question_requests WHERE questionCount = 5) AS totalQuestions5,
          (SELECT COUNT(*) FROM video_sessions) AS totalVideoCalls`
      )

      const [[monthComparisonRow]] = await pool.query(
        `SELECT
          COALESCE(SUM(CASE
            WHEN rr.status IN ('approved', 'completed')
             AND YEAR(COALESCE(rr.updatedAt, rr.createdAt)) = YEAR(CURDATE())
             AND MONTH(COALESCE(rr.updatedAt, rr.createdAt)) = MONTH(CURDATE())
            THEN rr.amount ELSE 0 END), 0) AS currentMonthTotal,
          COALESCE(SUM(CASE
            WHEN rr.status IN ('approved', 'completed')
             AND YEAR(COALESCE(rr.updatedAt, rr.createdAt)) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
             AND MONTH(COALESCE(rr.updatedAt, rr.createdAt)) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            THEN rr.amount ELSE 0 END), 0) AS previousMonthTotal,
          COALESCE(SUM(CASE
            WHEN rr.status IN ('approved', 'completed')
             AND DATE(COALESCE(rr.updatedAt, rr.createdAt)) = CURDATE()
            THEN rr.amount ELSE 0 END), 0) AS todayTotal
         FROM recharge_requests rr`
      )

      const [dailyRows] = await pool.query(
        `SELECT
          DATE(COALESCE(updatedAt, createdAt)) AS day,
          COALESCE(SUM(amount), 0) AS total
         FROM recharge_requests
         WHERE status IN ('approved', 'completed')
           AND DATE(COALESCE(updatedAt, createdAt)) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
         GROUP BY DATE(COALESCE(updatedAt, createdAt))
         ORDER BY day ASC`
      )

      const [monthlyRows] = await pool.query(
        `SELECT
          DATE_FORMAT(COALESCE(updatedAt, createdAt), '%Y-%m') AS month,
          COALESCE(SUM(amount), 0) AS total
         FROM recharge_requests
         WHERE status IN ('approved', 'completed')
           AND COALESCE(updatedAt, createdAt) >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
         GROUP BY DATE_FORMAT(COALESCE(updatedAt, createdAt), '%Y-%m')
         ORDER BY month ASC`
      )

      const [topConsultantsRows] = await pool.query(
        `SELECT
          c.id,
          c.name,
          COALESCE(SUM(CASE WHEN wt.type = 'credit' THEN wt.amount ELSE 0 END), 0) AS totalEarnings
         FROM consultants c
         LEFT JOIN wallet_transactions wt ON wt.consultantId = c.id
         GROUP BY c.id, c.name
         ORDER BY totalEarnings DESC
         LIMIT 10`
      )

      const totalBilled = Number(rechargeTotalsRow?.totalBilled) || 0
      const totalCommission = Number(commissionRow?.totalCommission) || 0
      const currentMonthTotal = Number(monthComparisonRow?.currentMonthTotal) || 0
      const previousMonthTotal = Number(monthComparisonRow?.previousMonthTotal) || 0
      const vgvLast30Days = Number(essentialKpisRow?.vgvLast30Days) || 0
      const stripeFeesLast30Days = Number(essentialKpisRow?.stripeFeesLast30Days) || 0
      const averageRechargeTicketLast30Days = Number(essentialKpisRow?.averageRechargeTicketLast30Days) || 0
      const rechargeCountLast30Days = Number(essentialKpisRow?.rechargeCountLast30Days) || 0
      const custodyBalance = Number(custodyRow?.custodyBalance) || 0
      const consultantPayoutLast30Days = Number(consultantPayoutRow?.consultantPayoutLast30Days) || 0
      const custodyExpectedReturn = Number(
        (custodyBalance * CUSTODY_EXPECTED_RETURN_RATE).toFixed(2),
      )
      const realNetProfitLast30Days = Number(
        (
          vgvLast30Days -
          consultantPayoutLast30Days -
          stripeFeesLast30Days -
          custodyBalance +
          custodyExpectedReturn
        ).toFixed(2),
      )

      let monthOverMonthPercent = 0
      if (previousMonthTotal > 0) {
        monthOverMonthPercent = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      } else if (currentMonthTotal > 0) {
        monthOverMonthPercent = 0
      }

      response.json({
        totalBilled,
        totalCommission,
        totalQuestions3: Number(countsRow?.totalQuestions3) || 0,
        totalQuestions5: Number(countsRow?.totalQuestions5) || 0,
        totalVideoCalls: Number(countsRow?.totalVideoCalls) || 0,
        todayTotal: Number(monthComparisonRow?.todayTotal) || 0,
        currentMonthTotal,
        previousMonthTotal,
        vgvLast30Days,
        stripeFeesLast30Days,
        custodyBalance,
        custodyExpectedReturn,
        consultantPayoutLast30Days,
        realNetProfitLast30Days,
        averageRechargeTicketLast30Days: Number(averageRechargeTicketLast30Days.toFixed(2)),
        rechargeCountLast30Days,
        monthOverMonthPercent: Number(monthOverMonthPercent.toFixed(2)),
        dailyTotals: dailyRows.map((row) => ({
          label: row.day,
          total: Number(row.total) || 0,
        })),
        monthlyTotals: monthlyRows.map((row) => ({
          label: row.month,
          total: Number(row.total) || 0,
        })),
        topConsultants: topConsultantsRows.map((row) => ({
          id: row.id,
          name: row.name,
          totalEarnings: Number(row.totalEarnings) || 0,
        })),
      })
    } catch (error) {
      console.error('[Admin Dashboard] Erro ao carregar métricas:', error)
      response.status(500).json({ message: 'Erro ao carregar métricas do dashboard.' })
    }
  })

  return router
}
