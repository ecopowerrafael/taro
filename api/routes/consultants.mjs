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
    
    // Permitir apenas se está editando seu próprio perfil
    if (request.user.id !== id) {
      console.log('[POST /consultants/profile/:id] Access denied - not own profile', {
        userId: request.user.id,
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

  return router
}
