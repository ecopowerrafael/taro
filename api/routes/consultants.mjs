import { Router } from 'express'
import { authenticate, authorizeAdmin } from '../middleware/auth.mjs'

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const createConsultantsRouter = (pool) => {
  const router = Router()

  router.get('/', async (_request, response) => {
    const [rows] = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          tagline,
          description,
          status,
          photo,
          pricePerMinute,
          priceThreeQuestions,
          priceFiveQuestions,
          baseConsultations,
          realSessions,
          ratingAverage,
          commissionOverride,
          createdAt
        FROM consultants
        ORDER BY createdAt DESC, name ASC
      `,
    )
    response.json(rows)
  })

  router.put('/:id', authenticate, async (request, response) => {
    const { id } = request.params
    const isAdmin = request.user.role === 'admin'
    const isSelfEdit = request.user.id === id
    const isSelfEditHeader = request.headers['x-self-edit'] === 'true'

    console.log('[PUT /consultants/:id] Request details:', {
      id,
      userId: request.user.id,
      userRole: request.user.role,
      isAdmin,
      isSelfEdit,
      isSelfEditHeader,
      headers: Object.keys(request.headers),
    })

    // Permitir: admin OU (self-edit com header de confirmação)
    if (!isAdmin && (!isSelfEdit || !isSelfEditHeader)) {
      console.log('[PUT /consultants/:id] Access denied - isAdmin:', isAdmin, 'isSelfEdit:', isSelfEdit, 'isSelfEditHeader:', isSelfEditHeader)
      response.status(403).json({ message: 'Acesso restrito a administradores.' })
      return
    }

    console.log('[PUT /consultants/:id] Access allowed - proceeding with update')

    const {
      name,
      email,
      tagline,
      description,
      status,
      photo,
      pricePerMinute,
      priceThreeQuestions,
      priceFiveQuestions,
      baseConsultations,
      realSessions,
      ratingAverage,
      commissionOverride,
      createdAt,
    } = request.body ?? {}

    if (!name || !email) {
      response.status(400).json({ message: 'name e email são obrigatórios.' })
      return
    }

    // Se for consultor editando a si mesmo, não permitir editar certos campos
    let finalStatus = status
    let finalBaseConsultations = baseConsultations
    let finalRealSessions = realSessions
    let finalRatingAverage = ratingAverage
    let finalCommissionOverride = commissionOverride

    if (isSelfEdit && !isAdmin) {
      // Consultor não pode editar estes campos - manter os valores existentes
      // Buscar valores atuais do banco para não sobrescrever
      const [existing] = await pool.query('SELECT status, baseConsultations, realSessions, ratingAverage, commissionOverride FROM consultants WHERE id = ?', [id])
      if (existing && existing.length > 0) {
        finalStatus = existing[0].status
        finalBaseConsultations = existing[0].baseConsultations
        finalRealSessions = existing[0].realSessions
        finalRatingAverage = existing[0].ratingAverage
        finalCommissionOverride = existing[0].commissionOverride
      } else {
        // Se não existe, usar defaults
        finalStatus = 'Offline'
        finalBaseConsultations = 0
        finalRealSessions = 0
        finalRatingAverage = 0
        finalCommissionOverride = null
      }
    }

    await pool.query(
      `
        INSERT INTO consultants (
          id,
          name,
          email,
          tagline,
          description,
          status,
          photo,
          pricePerMinute,
          priceThreeQuestions,
          priceFiveQuestions,
          baseConsultations,
          realSessions,
          ratingAverage,
          commissionOverride,
          createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          email = VALUES(email),
          tagline = VALUES(tagline),
          description = VALUES(description),
          status = VALUES(status),
          photo = VALUES(photo),
          pricePerMinute = VALUES(pricePerMinute),
          priceThreeQuestions = VALUES(priceThreeQuestions),
          priceFiveQuestions = VALUES(priceFiveQuestions),
          baseConsultations = VALUES(baseConsultations),
          realSessions = VALUES(realSessions),
          ratingAverage = VALUES(ratingAverage),
          commissionOverride = VALUES(commissionOverride),
          createdAt = VALUES(createdAt)
      `,
      [
        id,
        name,
        email,
        tagline || null,
        description || null,
        ['Online', 'Offline', 'Ocupado'].includes(finalStatus) ? finalStatus : 'Offline',
        photo || null,
        parseNumber(pricePerMinute),
        parseNumber(priceThreeQuestions),
        parseNumber(priceFiveQuestions),
        Math.max(0, Math.floor(parseNumber(finalBaseConsultations))),
        Math.max(0, Math.floor(parseNumber(finalRealSessions))),
        parseNumber(finalRatingAverage),
        finalCommissionOverride === null || finalCommissionOverride === undefined || finalCommissionOverride === ''
          ? null
          : parseNumber(finalCommissionOverride),
        createdAt || null,
      ],
    )

    await pool.query(
      `
        INSERT INTO consultant_wallets (consultantId, availableBalance, pixKey)
        VALUES (?, 0, NULL)
        ON DUPLICATE KEY UPDATE consultantId = VALUES(consultantId)
      `,
      [id],
    )

    response.json({ ok: true })
  })

  // Endpoint para consultor editar seu próprio perfil (sem exigir admin)
  router.post('/profile/:id', authenticate, async (request, response) => {
    const { id } = request.params
    
    console.log('[POST /consultants/profile/:id] Received request:', {
      id,
      userIdFromToken: request.user.id,
      consultantIdFromToken: request.user.consultantId,
      userRole: request.user.role,
    })

    // Permitir apenas se está editando seu próprio perfil
    // Usar consultantId se disponível (novo sistema), senão comparar id direto (compatibilidade)
    const userIdToCheck = request.user.consultantId || request.user.id
    console.log('[POST /consultants/profile/:id] Checking:', { userIdToCheck, targetId: id, willAllow: userIdToCheck === id })
    
    if (userIdToCheck !== id) {
      console.log('[POST /consultants/profile/:id] Access denied - not own profile', {
        userId: request.user.id,
        consultantId: request.user.consultantId,
        targetId: id,
      })
      response.status(403).json({ message: 'Você só pode editar seu próprio perfil.' })
      return
    }

    console.log('[POST /consultants/profile/:id] Self-edit allowed for:', id)

    const {
      name,
      email,
      tagline,
      description,
      photo,
      pricePerMinute,
      priceThreeQuestions,
      priceFiveQuestions,
    } = request.body ?? {}

    if (!name || !email) {
      response.status(400).json({ message: 'name e email são obrigatórios.' })
      return
    }

    // Consultor NÃO pode editar estes campos - buscar valores atuais
    const [existing] = await pool.query(
      'SELECT status, baseConsultations, realSessions, ratingAverage, commissionOverride, createdAt FROM consultants WHERE id = ?',
      [id],
    )
    const existingData = existing && existing.length > 0 ? existing[0] : null

    await pool.query(
      `
        INSERT INTO consultants (
          id,
          name,
          email,
          tagline,
          description,
          status,
          photo,
          pricePerMinute,
          priceThreeQuestions,
          priceFiveQuestions,
          baseConsultations,
          realSessions,
          ratingAverage,
          commissionOverride,
          createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          email = VALUES(email),
          tagline = VALUES(tagline),
          description = VALUES(description),
          photo = VALUES(photo),
          pricePerMinute = VALUES(pricePerMinute),
          priceThreeQuestions = VALUES(priceThreeQuestions),
          priceFiveQuestions = VALUES(priceFiveQuestions)
      `,
      [
        id,
        name,
        email,
        tagline || null,
        description || null,
        existingData?.status || 'Offline',
        photo || null,
        parseNumber(pricePerMinute),
        parseNumber(priceThreeQuestions),
        parseNumber(priceFiveQuestions),
        existingData?.baseConsultations || 0,
        existingData?.realSessions || 0,
        existingData?.ratingAverage || 0,
        existingData?.commissionOverride || null,
        existingData?.createdAt || null,
      ],
    )

    await pool.query(
      `
        INSERT INTO consultant_wallets (consultantId, availableBalance, pixKey)
        VALUES (?, 0, NULL)
        ON DUPLICATE KEY UPDATE consultantId = VALUES(consultantId)
      `,
      [id],
    )

    console.log('[POST /consultants/profile/:id] Profile updated successfully')
    response.json({ ok: true })
  })

  router.patch('/:id/status', authenticate, async (request, response) => {
    const { id } = request.params
    const { status } = request.body ?? {}

    if (!['Online', 'Offline', 'Ocupado', 'Pendente'].includes(status)) {
      response.status(400).json({ message: 'status inválido.' })
      return
    }

    const [result] = await pool.query(`UPDATE consultants SET status = ? WHERE id = ?`, [status, id])
    if (result.affectedRows === 0) {
      response.status(404).json({ message: 'Consultor não encontrado.' })
      return
    }

    response.json({ ok: true })
  })

  // GET /:id/public — perfil público com avaliações (sem autenticação)
  router.get('/:id/public', async (request, response) => {
    const { id } = request.params
    const [rows] = await pool.query(
      `SELECT id, name, tagline, description, photo, status, pricePerMinute, priceThreeQuestions,
              priceFiveQuestions, baseConsultations, realSessions, ratingAverage
       FROM consultants WHERE id = ?`,
      [id],
    )
    if (!rows.length) {
      return response.status(404).json({ message: 'Consultor não encontrado.' })
    }
    const consultant = rows[0]
    const [reviews] = await pool.query(
      `SELECT cr.id, cr.rating, cr.comment, cr.sessionType, cr.createdAt, u.name as userName
       FROM consultant_reviews cr
       JOIN users u ON cr.userId = u.id
       WHERE cr.consultantId = ?
       ORDER BY cr.createdAt DESC
       LIMIT 50`,
      [id],
    )
    response.json({ ...consultant, reviews })
  })

  // POST /reviews — submeter avaliação (requer autenticação)
  router.post('/reviews', authenticate, async (request, response) => {
    const { consultantId, referenceId, sessionType, rating, comment } = request.body ?? {}
    const userId = request.user.id

    if (!consultantId || !referenceId || !sessionType || !rating) {
      return response.status(400).json({ message: 'consultantId, referenceId, sessionType e rating são obrigatórios.' })
    }
    const numRating = Math.min(5, Math.max(1, Math.floor(Number(rating))))
    if (!['video', 'question'].includes(sessionType)) {
      return response.status(400).json({ message: 'sessionType inválido.' })
    }

    // Verificar se já avaliou esta referência
    const [existing] = await pool.query(
      'SELECT id FROM consultant_reviews WHERE referenceId = ? AND userId = ?',
      [referenceId, userId],
    )
    if (existing.length > 0) {
      return response.status(409).json({ message: 'Você já avaliou esta consulta.' })
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    await pool.query(
      `INSERT INTO consultant_reviews (id, consultantId, userId, sessionType, referenceId, rating, comment, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [reviewId, consultantId, userId, sessionType, referenceId, numRating, comment?.trim() || null],
    )

    // Atualizar ratingAverage do consultor
    const [[avgRow]] = await pool.query(
      'SELECT AVG(rating) as avg FROM consultant_reviews WHERE consultantId = ?',
      [consultantId],
    )
    const newAvg = Number(Number(avgRow.avg || 0).toFixed(2))
    await pool.query('UPDATE consultants SET ratingAverage = ? WHERE id = ?', [newAvg, consultantId])

    response.status(201).json({ ok: true, reviewId, newRatingAverage: newAvg })
  })

  // GET /reviews/check — verifica se o usuário já avaliou um referenceId (requer autenticação)
  router.get('/reviews/check', authenticate, async (request, response) => {
    const { referenceId } = request.query
    const userId = request.user.id
    if (!referenceId) return response.status(400).json({ message: 'referenceId é obrigatório.' })
    const [rows] = await pool.query(
      'SELECT id FROM consultant_reviews WHERE referenceId = ? AND userId = ?',
      [referenceId, userId],
    )
    response.json({ reviewed: rows.length > 0 })
  })

  return router
}
