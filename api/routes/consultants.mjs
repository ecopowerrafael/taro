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

  router.put('/:id', authenticate, authorizeAdmin, async (request, response) => {
    const { id } = request.params
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
        ['Online', 'Offline', 'Ocupado'].includes(status) ? status : 'Offline',
        photo || null,
        parseNumber(pricePerMinute),
        parseNumber(priceThreeQuestions),
        parseNumber(priceFiveQuestions),
        Math.max(0, Math.floor(parseNumber(baseConsultations))),
        Math.max(0, Math.floor(parseNumber(realSessions))),
        parseNumber(ratingAverage),
        commissionOverride === null || commissionOverride === undefined || commissionOverride === ''
          ? null
          : parseNumber(commissionOverride),
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

  router.patch('/:id/status', authenticate, async (request, response) => {
    const { id } = request.params
    const { status } = request.body ?? {}

    if (!['Online', 'Offline', 'Ocupado'].includes(status)) {
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
