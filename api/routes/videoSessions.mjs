import { Router } from 'express'
import { authenticate } from '../middleware/auth.mjs'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { sendPushToUsers } from '../push.mjs'

export const createVideoSessionsRouter = (pool) => {
  const router = Router()

  const roundCurrency = (value) => Number((Number(value) || 0).toFixed(2))

  const resolveSessionActors = async ({ pool, sessionId, userId, userEmail }) => {
    const [sessions] = await pool.query(
      `
        SELECT vs.*, u.name as userName, c.name as consultantName, c.pricePerMinute
        FROM video_sessions vs
        JOIN users u ON vs.userId = u.id
        JOIN consultants c ON vs.consultantId = c.id
        WHERE vs.id = ?
      `,
      [sessionId],
    )

    if (!sessions.length) {
      return { session: null, isCustomer: false, isConsultant: false, consultantUserId: null, consultantEmail: null }
    }

    const session = sessions[0]
    const [cRows] = await pool.query('SELECT userId, email FROM consultants WHERE id = ?', [session.consultantId])
    const consultantUserId = cRows[0]?.userId || null
    const consultantEmail = cRows[0]?.email || null

    const isCustomer = session.userId === userId
    const isConsultant =
      consultantUserId === userId ||
      Boolean(consultantEmail && userEmail && consultantEmail.toLowerCase() === userEmail.toLowerCase())

    return { session, isCustomer, isConsultant, consultantUserId, consultantEmail }
  }

  const getSessionPresenceSnapshot = (request, sessionId) => {
    const sessionPresence = request.app.get('sessionPresence')
    const members = Array.from(sessionPresence?.get(String(sessionId))?.values() || [])
    return {
      members,
      customerOnline: members.some((member) => member.role === 'customer'),
      consultantOnline: members.some((member) => member.role === 'consultant'),
    }
  }

  router.use(authenticate)

  router.post('/', async (request, response) => {
    const { consultantId } = request.body
    const userId = request.user.id

    if (!consultantId) {
      return response.status(400).json({ message: 'Consultor nÃ£o especificado.' })
    }

    try {
      // Obter informaÃ§Ãµes do usuÃ¡rio
      const [users] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId])
      if (users.length === 0) {
        return response.status(404).json({ message: 'UsuÃ¡rio nÃ£o encontrado.' })
      }
      const user = users[0]

      // Obter informaÃ§Ãµes do consultor (incluindo userId para push/webpush)
      const [consultants] = await pool.query('SELECT id, name, email, userId, status FROM consultants WHERE id = ?', [consultantId])
      if (consultants.length === 0) {
        return response.status(404).json({ message: 'Consultor nÃ£o encontrado.' })
      }
      const consultant = consultants[0]

      if (consultant.status !== 'Online') {
        return response.status(409).json({
          message: 'Este consultor nÃ£o estÃ¡ online no momento. Escolha um consultor online para iniciar a chamada ao vivo.',
        })
      }

      let consultantUserId = consultant.userId || null

      // Fallback para contas legadas sem userId vinculado no consultor.
      if (!consultantUserId && consultant.email) {
        const [consultantUsers] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [consultant.email])
        consultantUserId = consultantUsers[0]?.id || null
      }

      // Obter credenciais do Daily.co e SMTP
      const [creds] = await pool.query('SELECT dailyApiKey, dailyDomain, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom FROM platform_credentials WHERE id = 1')
      const credentials = creds[0] || {}

      // Gerar um ID de sala Ãºnico
      const roomId = `room_${crypto.randomBytes(8).toString('hex')}`
      let roomUrl = ''

      // Se tivermos a API do Daily, podemos criar a sala via API. Caso contrÃ¡rio, montamos a URL se for demo
      let apiKey = credentials.dailyApiKey
      if (apiKey) {
        apiKey = apiKey.trim()
      }

      if (apiKey && credentials.dailyDomain) {
        try {
          console.log('[videoSessions POST] Criando room via Daily.co API')
          console.log('[videoSessions POST] roomId:', roomId)
          console.log('[videoSessions POST] dailyDomain:', credentials.dailyDomain)
          
          const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              name: roomId,
              privacy: 'private',
              properties: {
                exp: Math.floor(Date.now() / 1000) + 24 * 3600
              }
            })
          })
          
          if (dailyRes.ok) {
            const dailyData = await dailyRes.json()
            roomUrl = dailyData.url
            console.log('[videoSessions POST] âœ“ Room criada com sucesso. URL:', roomUrl)
          } else {
            try {
              const errorData = await dailyRes.json()
              console.error('[videoSessions POST] âœ— Erro ao criar room:', errorData)
            } catch (e) {
              console.error('[videoSessions POST] âœ— Erro ao criar room (nÃ£o-JSON):', dailyRes.status, dailyRes.statusText)
            }
            roomUrl = `https://${credentials.dailyDomain}/${roomId}`
          }
        } catch (e) {
          console.error('[videoSessions POST] Exception ao criar room:', e.message)
          roomUrl = `https://${credentials.dailyDomain}/${roomId}`
        }
      } else {
        const domain = credentials.dailyDomain || 'demo.daily.co'
        roomUrl = `https://${domain}/${roomId}`
        console.log('[videoSessions POST] Usando fallback URL:', roomUrl)
      }

      // Salvar a sessÃ£o no banco
      const sessionId = `vs_${crypto.randomBytes(8).toString('hex')}`
      await pool.query(`
        INSERT INTO video_sessions (id, userId, consultantId, status, roomUrl, createdAt)
        VALUES (?, ?, ?, 'waiting', ?, NOW())
      `, [sessionId, userId, consultantId, roomUrl])

      // Enviar emails se SMTP estiver configurado
      if (credentials.smtpHost && credentials.smtpUser && credentials.smtpPass) {
        const transporter = nodemailer.createTransport({
          host: credentials.smtpHost,
          port: credentials.smtpPort || 465,
          secure: credentials.smtpPort == 465, // true for 465, false for other ports
          auth: {
            user: credentials.smtpUser,
            pass: credentials.smtpPass
          }
        })

        const from = credentials.smtpFrom || credentials.smtpUser
        const link = `https://appastria.online/sala/${sessionId}`

        // Email para o usuÃ¡rio
        transporter.sendMail({
          from: `"Astria Tarot" <${from}>`,
          to: user.email,
          subject: 'Sua Consulta de Tarot foi Iniciada',
          html: `<p>OlÃ¡ ${user.name},</p>
                 <p>Sua sala de vÃ­deo com o consultor <b>${consultant.name}</b> foi criada com sucesso.</p>
                 <p>Acesse o link abaixo para entrar na sala:</p>
                 <a href="${link}">${link}</a>
                 <p>Aguarde o consultor entrar na sala.</p>`
        }).catch(e => console.error('Erro ao enviar email para usuÃ¡rio:', e))

        // Email para o consultor
        transporter.sendMail({
          from: `"Astria Tarot" <${from}>`,
          to: consultant.email,
          subject: 'Novo Atendimento por VÃ­deo Solicitado',
          html: `<p>OlÃ¡ ${consultant.name},</p>
                 <p>O cliente <b>${user.name}</b> acabou de solicitar uma consulta de vÃ­deo.</p>
                 <p>Acesse o link abaixo para entrar na sala e iniciar o atendimento:</p>
                 <a href="${link}">${link}</a>`
        }).catch(e => console.error('Erro ao enviar email para consultor:', e))
      }

      // Emite evento via socket.io para o consultor
      const io = request.app.get('io')
      if (io) {
        io.to(`consultant_${consultantId}`).emit('incoming_call', {
          sessionId,
          customerName: user.name,
          roomUrl
        })
      }

      const webpush = request.app.get('webpush')
      const firebaseAdmin = request.app.get('firebaseAdmin')
      
      console.log('[videoSessions POST] ** DEBUG PUSH **', {
        webpushAvailable: Boolean(webpush),
        firebaseAdminAvailable: Boolean(firebaseAdmin),
        consultantUserId,
        sessionId,
      })
      
      if ((webpush || firebaseAdmin) && consultantUserId) {
        const payload = {
          title: 'Nova Chamada de VÃ­deo',
          body: `O cliente ${user.name} estÃ¡ aguardando na sala!`,
          url: `https://appastria.online/area-consultor?tab=video&sessionId=${sessionId}`,
          nativeRoute: `/area-consultor?tab=video&sessionId=${sessionId}`,
          type: 'incoming_call',
          sessionId,
          roomUrl,
          customerName: user.name,
          consultantId,
        }

        console.log('[videoSessions POST] âœ“ Enviando push FCM...', { userIds: [consultantUserId] })
        
        const pushResult = await sendPushToUsers({
          pool,
          webpush,
          firebaseAdmin,
          userIds: [consultantUserId],
          payload,
        })

        console.log('[videoSessions POST] Push result:', {
          totalSubscriptions: pushResult.totalSubscriptions,
          successCount: pushResult.successCount,
          failureCount: pushResult.failureCount,
        })

        if (!pushResult.totalSubscriptions) {
          console.warn('[videoSessions POST] âš ï¸ Nenhuma subscription ativa para consultor', {
            consultantId,
            consultantEmail: consultant.email,
            consultantUserId,
          })
        }
      } else {
        console.error('[videoSessions POST] âŒ PUSH NÃƒO ENVIADO!', {
          webpushAvailable: Boolean(webpush),
          firebaseAdminAvailable: Boolean(firebaseAdmin),
          hasConsultantUserId: Boolean(consultantUserId),
          consultantId,
          consultantEmail: consultant.email,
          message: 'Configure FIREBASE_SERVICE_ACCOUNT_JSON ou webpush VAPID keys',
        })
      }

      response.status(201).json({ sessionId, roomUrl })

    } catch (error) {
      console.error('Erro ao criar sessÃ£o de vÃ­deo:', error)
      response.status(500).json({ message: 'Erro interno ao criar sala.' })
    }
  })

  // Buscar sessÃµes de vÃ­deo pendentes para um consultor
  router.get('/pending', async (request, response) => {
    const userId = request.user.id
    const userEmail = request.user.email
    try {
      // Pega o ID de consultor do usuÃ¡rio logado (com fallback por email para contas legadas).
      const [cRows] = await pool.query(
        'SELECT id FROM consultants WHERE userId = ? OR email = ? ORDER BY userId = ? DESC LIMIT 1',
        [userId, userEmail || '', userId],
      )
      if (cRows.length === 0) {
        return response.json([])
      }
      const consultantId = cRows[0].id

      const [sessions] = await pool.query(`
        SELECT vs.*, u.name as userName 
        FROM video_sessions vs
        JOIN users u ON vs.userId = u.id
        WHERE vs.consultantId = ? AND vs.status = 'waiting'
      `, [consultantId])

      response.json(sessions)
    } catch (error) {
      console.error('Erro ao buscar sessÃµes pendentes:', error)
      response.status(500).json({ message: 'Erro interno' })
    }
  })

  router.get('/history/mine', async (request, response) => {
    const userId = request.user.id
    const userEmail = request.user.email

    try {
      const [cRows] = await pool.query(
        'SELECT id FROM consultants WHERE userId = ? OR email = ? ORDER BY userId = ? DESC LIMIT 1',
        [userId, userEmail || '', userId],
      )

      if (cRows.length === 0) {
        return response.json([])
      }

      const consultantId = cRows[0].id
      const [rows] = await pool.query(
        `
          SELECT
            vs.id,
            vs.userId,
            vs.consultantId,
            vs.status,
            vs.roomUrl,
            vs.createdAt,
            vs.startedAt,
            vs.finishedAt,
            vs.durationSeconds,
            vs.consultantEarnings,
            vs.consultantNotes,
            u.name AS userName,
            u.email AS userEmail,
            c.name AS consultantName
          FROM video_sessions vs
          JOIN users u ON u.id = vs.userId
          JOIN consultants c ON c.id = vs.consultantId
          WHERE vs.consultantId = ?
          ORDER BY COALESCE(vs.finishedAt, vs.startedAt, vs.createdAt) DESC
        `,
        [consultantId],
      )

      response.json(
        rows.map((row) => ({
          ...row,
          durationSeconds: Number(row.durationSeconds) || 0,
          consultantEarnings: Number(row.consultantEarnings) || 0,
          consultantNotes: row.consultantNotes || '',
        })),
      )
    } catch (error) {
      console.error('Erro ao buscar histÃ³rico de vÃ­deo:', error)
      response.status(500).json({ message: 'Erro ao carregar histÃ³rico de vÃ­deo.' })
    }
  })

  // Buscar detalhes de uma sala pelo sessionId
  router.get('/:sessionId', async (request, response) => {
    const { sessionId } = request.params
    const userId = request.user.id
    const userEmail = request.user.email
    
    try {
      const { session, isCustomer, isConsultant } = await resolveSessionActors({
        pool,
        sessionId,
        userId,
        userEmail,
      })

      if (!session) {
        return response.status(404).json({ message: 'SessÃ£o nÃ£o encontrada.' })
      }

      if (!isCustomer && !isConsultant) {
        return response.status(403).json({ message: 'Acesso negado a esta sala.' })
      }

      const presence = getSessionPresenceSnapshot(request, sessionId)

      // Adicionamos o daily token se for uma sala privada e tivermos API key
      let dailyToken = null
      const [creds] = await pool.query('SELECT dailyApiKey FROM platform_credentials WHERE id = 1')
      let apiKey = creds[0]?.dailyApiKey

      // Remove eventuais espaÃ§os ou aspas da apiKey
      if (apiKey) {
        apiKey = apiKey.trim()
      }

      if (apiKey) {
        try {
          const roomName = session.roomUrl.split('/').pop()
          console.log('[videoSessions GET /:sessionId] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•')
          console.log('[videoSessions GET /:sessionId] Gerando token Daily.co')
          console.log('[videoSessions GET /:sessionId] roomName:', roomName)
          console.log('[videoSessions GET /:sessionId] isConsultant:', isConsultant)
          console.log('[videoSessions GET /:sessionId] user_name:', isConsultant ? session.consultantName : session.userName)
          console.log('[videoSessions GET /:sessionId] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•')
          
          const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              properties: {
                room_name: roomName,
                is_owner: isConsultant,
                user_name: isConsultant ? session.consultantName : session.userName,
                exp: Math.floor(Date.now() / 1000) + 24 * 3600
              }
            })
          })
          
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json()
            dailyToken = tokenData.token
            console.log('[videoSessions GET /:sessionId] âœ“ Token gerado com sucesso')
            console.log('[videoSessions GET /:sessionId] Token length:', tokenData.token?.length)
          } else {
            try {
              const errorData = await tokenRes.json()
              console.error('[videoSessions GET /:sessionId] âœ— Erro ao gerar token:', errorData)
            } catch (e) {
              console.error('[videoSessions GET /:sessionId] âœ— Erro ao gerar token (nÃ£o-JSON):', tokenRes.status, tokenRes.statusText)
            }
          }
        } catch (e) {
          console.error('[videoSessions GET /:sessionId] âœ— Exception ao gerar token:', e.message)
        }
      } else {
        console.warn('[videoSessions GET /:sessionId] âš ï¸  apiKey vazia - dailyToken serÃ¡ null')
      }
      
      console.log('[videoSessions GET /:sessionId] â•â•â•â•â• RESPOSTA FINAL â•â•â•â•â•')
      console.log('[videoSessions GET /:sessionId] roomUrl:', session.roomUrl)
      console.log('[videoSessions GET /:sessionId] status:', session.status)
      console.log('[videoSessions GET /:sessionId] dailyToken prÃ©sent:', !!dailyToken)
      console.log('[videoSessions GET /:sessionId] isConsultant:', isConsultant)
      console.log('[videoSessions GET /:sessionId] pricePerMinute:', session.pricePerMinute)
      console.log('[videoSessions GET /:sessionId] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•')
      response.status(200).json({
        status: session.status,
        roomUrl: session.roomUrl,
        pricePerMinute: Number(session.pricePerMinute) || 0,
        consultantId: session.consultantId,
        consultantName: session.consultantName,
        isConsultant,
        dailyToken,
        customerOnline: presence.customerOnline,
        consultantOnline: presence.consultantOnline,
        presenceMembers: presence.members,
      })
    } catch (error) {
      console.error('Erro ao buscar sessÃ£o:', error)
      response.status(500).json({ message: 'Erro ao carregar dados da sala.' })
    }
  })

  // Atualizar status (quando ambos entram e o vÃ­deo inicia)
  router.patch('/:sessionId/status', async (request, response) => {
    const { sessionId } = request.params
    const { status, confirmStart } = request.body
    const userId = request.user.id
    const userEmail = request.user.email

    if (!['active', 'finished', 'cancelled', 'rejected'].includes(status)) {
      return response.status(400).json({ message: 'Status invÃ¡lido.' })
    }

    try {
      const { session, isCustomer, isConsultant } = await resolveSessionActors({
        pool,
        sessionId,
        userId,
        userEmail,
      })

      if (!session) {
        return response.status(404).json({ message: 'SessÃ£o nÃ£o encontrada.' })
      }

      if (!isCustomer && !isConsultant) {
        return response.status(403).json({ message: 'Acesso negado a esta sala.' })
      }

      if (status === 'active') {
        if (confirmStart) {
          if (session.status !== 'active') {
            return response.status(409).json({ message: 'A sessÃ£o ainda nÃ£o foi liberada para conexÃ£o.', currentStatus: session.status })
          }

          if (session.startedAt) {
            return response.json({ ok: true, alreadyStarted: true })
          }

          await pool.query('UPDATE video_sessions SET startedAt = NOW() WHERE id = ? AND startedAt IS NULL', [sessionId])
          return response.json({ ok: true, started: true })
        }

        if (!isConsultant) {
          return response.status(403).json({ message: 'Somente o consultor pode liberar o atendimento.' })
        }

        if (session.status !== 'waiting') {
          return response.status(409).json({ message: 'A sessÃ£o nÃ£o estÃ¡ mais aguardando atendimento.', currentStatus: session.status })
        }

        const presence = getSessionPresenceSnapshot(request, sessionId)
        if (!presence.customerOnline) {
          return response.status(409).json({
            message: 'O cliente nÃ£o estÃ¡ online nesta sala ou jÃ¡ cancelou a chamada.',
            currentStatus: session.status,
            customerOnline: false,
          })
        }

        await pool.query('UPDATE video_sessions SET status = ?, startedAt = NULL WHERE id = ?', [status, sessionId])
        return response.json({ ok: true, awaitingConnection: true })
      }

      if ((status === 'cancelled' || status === 'rejected') && session.status !== 'waiting') {
        return response.status(409).json({ message: 'A sessÃ£o jÃ¡ foi iniciada ou encerrada.', currentStatus: session.status })
      }

      const timeField = status === 'active' ? 'startedAt' : 'finishedAt'
      await pool.query(`UPDATE video_sessions SET status = ?, ${timeField} = NOW() WHERE id = ?`, [status, sessionId])
      response.json({ ok: true })
    } catch (error) {
      console.error('Erro ao atualizar status da sessÃ£o:', error)
      response.status(500).json({ message: 'Erro ao atualizar status da sessÃ£o.' })
    }
  })

  // Rota para finalizar sessÃ£o com duraÃ§Ã£o e compensaÃ§Ã£o ao consultor
  router.patch('/:sessionId/finish', async (request, response) => {
    const { sessionId } = request.params
    const { durationSeconds } = request.body

    console.log('[videoSessions /finish] Recebido: sessionId=', sessionId, 'durationSeconds=', durationSeconds)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Obter dados da sessÃ£o
      const [sessions] = await connection.query(
        `SELECT vs.id, vs.userId, vs.consultantId, vs.status, vs.roomUrl, vs.createdAt, vs.startedAt, vs.finishedAt, vs.durationSeconds, vs.consultantEarnings FROM video_sessions vs WHERE vs.id = ? FOR UPDATE`,
        [sessionId]
      )

      if (!sessions.length) {
        await connection.rollback()
        return response.status(404).json({ message: 'SessÃ£o nÃ£o encontrada.' })
      }

      const session = sessions[0]

      if (!session.startedAt || session.status !== 'active') {
        await connection.rollback()
        return response.status(409).json({ message: 'A chamada nÃ£o foi efetivamente iniciada. Nada a cobrar.' })
      }

      // IdempotÃªncia: evita dÃ©bito/crÃ©dito duplicado quando os dois lados encerram quase juntos.
      if (session.status === 'finished') {
        const [userRows] = await connection.query(
          'SELECT minutesBalance FROM users WHERE id = ?',
          [session.userId]
        )
        const existingUserBalance = userRows.length > 0 ? Number(userRows[0].minutesBalance) || 0 : 0

        await connection.rollback()
        console.log('[videoSessions /finish] SessÃ£o jÃ¡ finalizada anteriormente. Ignorando reprocessamento:', sessionId)
        return response.json({
          ok: true,
          alreadyFinished: true,
          earnings: Number(session.consultantEarnings) || 0,
          newUserBalance: existingUserBalance,
        })
      }
      
      // Buscar pricePerMinute do consultor
      const [consultantRows] = await connection.query(
        `SELECT pricePerMinute FROM consultants WHERE id = ?`,
        [session.consultantId]
      )
      const pricePerMinute = consultantRows.length > 0 ? Number(consultantRows[0].pricePerMinute) || 0 : 0
      
      const providedDuration = Math.max(0, parseInt(durationSeconds, 10) || 0)
      const startedAtMs = session.startedAt ? new Date(session.startedAt).getTime() : null
      const derivedDuration = startedAtMs ? Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)) : 0
      const duration = startedAtMs ? derivedDuration : providedDuration

      // CÃ¡lculo autoritativo do backend: nÃ£o confiar em consumo/ganho enviados pelo frontend.
      const grossConsumption = roundCurrency((duration / 60) * pricePerMinute)

      // Atualizar sessÃ£o com duraÃ§Ã£o e ganho
      await connection.query(
        `UPDATE video_sessions SET status = 'finished', finishedAt = NOW(), durationSeconds = ?, consultantEarnings = ? WHERE id = ?`,
        [duration, grossConsumption, sessionId]
      )

      // DÃ‰BITO DO USUÃRIO (consumo total da sessÃ£o - aquilo que vai sair da carteira)
      console.log('[videoSessions /finish] Debitando usuario. userId:', session.userId, 'grossConsumption:', grossConsumption)
      
      // Verificar saldo antes de debitar
      const [userRows] = await connection.query(
        'SELECT minutesBalance FROM users WHERE id = ?',
        [session.userId]
      )
      
      if (userRows.length > 0) {
        const currentBalance = Number(userRows[0].minutesBalance) || 0
        const effectiveConsumption = Math.min(currentBalance, grossConsumption)
        const newBalance = roundCurrency(currentBalance - effectiveConsumption)
        
        // Debitar do usuÃ¡rio
        await connection.query(
          'UPDATE users SET minutesBalance = ? WHERE id = ?',
          [newBalance, session.userId]
        )
        
        console.log('[videoSessions /finish] Usuario debitado. Saldo anterior: R$', currentBalance.toFixed(2), ' Novo saldo: R$', newBalance.toFixed(2), ' Consumo efetivo: R$', effectiveConsumption.toFixed(2))

        // Ganho bruto da sessÃ£o passa a ser exatamente o valor efetivamente debitado do usuÃ¡rio.
        session.consultantEarnings = effectiveConsumption
      }

      // Garantir persistÃªncia do mesmo valor econÃ´mico usado no dÃ©bito/crÃ©dito.
      await connection.query(
        `UPDATE video_sessions SET consultantEarnings = ? WHERE id = ?`,
        [Number(session.consultantEarnings) || 0, sessionId]
      )

      // Se houve ganho, criar registro na carteira do consultor
      if ((Number(session.consultantEarnings) || 0) > 0) {
        // Obter dados do consultor (incluindo commissionOverride)
        const [consultants] = await connection.query(
          `SELECT id, commissionOverride FROM consultants WHERE id = ?`,
          [session.consultantId]
        )
        
        // 30% para plataforma, 70% para consultor (padrÃ£o)
        let consultantPercentage = 0.70
        if (consultants.length > 0 && consultants[0].commissionOverride !== null && consultants[0].commissionOverride !== undefined) {
          consultantPercentage = Math.min(1, Math.max(0, Number(consultants[0].commissionOverride) / 100))
        }
        const commissionRate = consultantPercentage

        const earnings = Number(session.consultantEarnings) || 0
        const commissionEarnings = roundCurrency(earnings * commissionRate)
        const platformShare = roundCurrency(earnings - commissionEarnings)
        
        console.log('[videoSessions /finish] Processando ganhos para consultor. totalEarnings:', earnings, 'commissionRate:', (commissionRate * 100).toFixed(0) + '%', 'consultantGain:', commissionEarnings.toFixed(2), 'platformShare:', platformShare.toFixed(2), 'consultantId:', session.consultantId)
        
        // Garantir que a carteira existe
        await connection.query(
          `INSERT INTO consultant_wallets (consultantId, availableBalance, pixKey) VALUES (?, 0, NULL) ON DUPLICATE KEY UPDATE consultantId = VALUES(consultantId)`,
          [session.consultantId]
        )

        // Adicionar COMISSÃƒO Ã  carteira (nÃ£o o valor total)
        await connection.query(
          `UPDATE consultant_wallets SET availableBalance = availableBalance + ? WHERE consultantId = ?`,
          [commissionEarnings, session.consultantId]
        )
        console.log('[videoSessions /finish] Carteira do consultor atualizada com R$', commissionEarnings.toFixed(2))

        // Criar registro de transaÃ§Ã£o
        const txId = `tx_video_${sessionId}`
        const billedMinutes = (duration / 60).toFixed(2)
        const txDescription = `Ganho de videoconsulta (${billedMinutes} min Ã  R$ ${pricePerMinute.toFixed(2)}/min)`
        
        await connection.query(
          `INSERT INTO wallet_transactions (id, consultantId, type, amount, commissionValue, createdAt, description)
           VALUES (?, ?, 'credit', ?, ?, NOW(), ?)
           ON DUPLICATE KEY UPDATE amount = VALUES(amount), commissionValue = VALUES(commissionValue), description = VALUES(description)`,
          [txId, session.consultantId, commissionEarnings, platformShare, txDescription]
        )
        console.log('[videoSessions /finish] TransaÃ§Ã£o registrada: txId=', txId)
      } else {
        console.log('[videoSessions /finish] earnings = 0, nenhum ganho para processar')
      }

      // Buscar novo saldo do usuÃ¡rio apÃ³s dÃ©bito
      const [updatedUser] = await connection.query(
        'SELECT minutesBalance FROM users WHERE id = ?',
        [session.userId]
      )
      const newUserBalance = updatedUser.length > 0 ? updatedUser[0].minutesBalance : 0

      await connection.commit()
      const finalEarnings = Number(session.consultantEarnings) || 0
      console.log('[videoSessions /finish] SessÃ£o finalizada com sucesso. sessionId=', sessionId, 'earnings=', finalEarnings, 'newUserBalance=', newUserBalance)
      response.json({ ok: true, earnings: finalEarnings, newUserBalance })

    } catch (error) {
      await connection.rollback()
      console.error('Erro ao finalizar sessÃ£o de vÃ­deo:', error)
      response.status(500).json({ message: 'Erro ao finalizar sessÃ£o.' })
    } finally {
      connection.release()
    }
  })

  router.patch('/:sessionId/notes', async (request, response) => {
    const { sessionId } = request.params
    const { consultantNotes } = request.body ?? {}
    const userId = request.user.id
    const userEmail = request.user.email

    try {
      const { session, isConsultant } = await resolveSessionActors({
        pool,
        sessionId,
        userId,
        userEmail,
      })

      if (!session) {
        return response.status(404).json({ message: 'SessÃ£o nÃ£o encontrada.' })
      }

      if (!isConsultant) {
        return response.status(403).json({ message: 'Somente o consultor pode registrar observaÃ§Ãµes.' })
      }

      const normalizedNotes = String(consultantNotes || '').trim()
      await pool.query('UPDATE video_sessions SET consultantNotes = ? WHERE id = ?', [normalizedNotes, sessionId])

      response.json({ ok: true, sessionId, consultantNotes: normalizedNotes })
    } catch (error) {
      console.error('Erro ao salvar observaÃ§Ã£o da sessÃ£o:', error)
      response.status(500).json({ message: 'Erro ao salvar observaÃ§Ã£o da sessÃ£o.' })
    }
  })

  return router
}

