import { Router } from 'express'
import { authenticate } from '../middleware/auth.mjs'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

export const createVideoSessionsRouter = (pool) => {
  const router = Router()

  const roundCurrency = (value) => Number((Number(value) || 0).toFixed(2))

  router.use(authenticate)

  router.post('/', async (request, response) => {
    const { consultantId } = request.body
    const userId = request.user.id

    if (!consultantId) {
      return response.status(400).json({ message: 'Consultor não especificado.' })
    }

    try {
      // Obter informações do usuário
      const [users] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId])
      if (users.length === 0) {
        return response.status(404).json({ message: 'Usuário não encontrado.' })
      }
      const user = users[0]

      // Obter informações do consultor (incluindo userId para push/webpush)
      const [consultants] = await pool.query('SELECT id, name, email, userId FROM consultants WHERE id = ?', [consultantId])
      if (consultants.length === 0) {
        return response.status(404).json({ message: 'Consultor não encontrado.' })
      }
      const consultant = consultants[0]

      // Obter credenciais do Daily.co e SMTP
      const [creds] = await pool.query('SELECT dailyApiKey, dailyDomain, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom FROM platform_credentials WHERE id = 1')
      const credentials = creds[0] || {}

      // Gerar um ID de sala único
      const roomId = `room_${crypto.randomBytes(8).toString('hex')}`
      let roomUrl = ''

      // Se tivermos a API do Daily, podemos criar a sala via API. Caso contrário, montamos a URL se for demo
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
            console.log('[videoSessions POST] ✓ Room criada com sucesso. URL:', roomUrl)
          } else {
            try {
              const errorData = await dailyRes.json()
              console.error('[videoSessions POST] ✗ Erro ao criar room:', errorData)
            } catch (e) {
              console.error('[videoSessions POST] ✗ Erro ao criar room (não-JSON):', dailyRes.status, dailyRes.statusText)
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

      // Salvar a sessão no banco
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

        // Email para o usuário
        transporter.sendMail({
          from: `"Astria Tarot" <${from}>`,
          to: user.email,
          subject: 'Sua Consulta de Tarot foi Iniciada',
          html: `<p>Olá ${user.name},</p>
                 <p>Sua sala de vídeo com o consultor <b>${consultant.name}</b> foi criada com sucesso.</p>
                 <p>Acesse o link abaixo para entrar na sala:</p>
                 <a href="${link}">${link}</a>
                 <p>Aguarde o consultor entrar na sala.</p>`
        }).catch(e => console.error('Erro ao enviar email para usuário:', e))

        // Email para o consultor
        transporter.sendMail({
          from: `"Astria Tarot" <${from}>`,
          to: consultant.email,
          subject: 'Novo Atendimento por Vídeo Solicitado',
          html: `<p>Olá ${consultant.name},</p>
                 <p>O cliente <b>${user.name}</b> acabou de solicitar uma consulta de vídeo.</p>
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

      // Envia notificação Web Push se o consultor tiver assinatura
      const pushSubscriptions = request.app.get('pushSubscriptions')
      const webpush = request.app.get('webpush')
      if (pushSubscriptions && webpush && pushSubscriptions[consultant.userId]) {
        const subs = pushSubscriptions[consultant.userId]
        const payload = JSON.stringify({
          title: 'Nova Chamada de Vídeo',
          body: `O cliente ${user.name} está aguardando na sala!`,
          url: `https://appastria.online/sala/${sessionId}`
        })
        
        subs.forEach(sub => {
          webpush.sendNotification(sub, payload).catch(e => console.error('Erro no webpush:', e))
        })
      }

      response.status(201).json({ sessionId, roomUrl })

    } catch (error) {
      console.error('Erro ao criar sessão de vídeo:', error)
      response.status(500).json({ message: 'Erro interno ao criar sala.' })
    }
  })

  // Buscar sessões de vídeo pendentes para um consultor
  router.get('/pending', async (request, response) => {
    const userId = request.user.id
    try {
      // Pega o ID de consultor do usuário logado
      const [cRows] = await pool.query('SELECT id FROM consultants WHERE userId = ?', [userId])
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
      console.error('Erro ao buscar sessões pendentes:', error)
      response.status(500).json({ message: 'Erro interno' })
    }
  })

  // Buscar detalhes de uma sala pelo sessionId
  router.get('/:sessionId', async (request, response) => {
    const { sessionId } = request.params
    const userId = request.user.id
    
    try {
      const [sessions] = await pool.query(`
        SELECT vs.*, u.name as userName, c.name as consultantName, c.pricePerMinute
        FROM video_sessions vs
        JOIN users u ON vs.userId = u.id
        JOIN consultants c ON vs.consultantId = c.id
        WHERE vs.id = ?
      `, [sessionId])

      if (sessions.length === 0) {
        return response.status(404).json({ message: 'Sessão não encontrada.' })
      }

      const session = sessions[0]
      
      // Verifica se o usuário atual é o cliente ou o consultor da sala
      // Como o consultor também tem uma conta de user, precisamos verificar pelo user.id ou consultor.userId
      // Vamos buscar o userId atrelado ao consultantId
      const [cRows] = await pool.query('SELECT userId FROM consultants WHERE id = ?', [session.consultantId])
      const consultantUserId = cRows[0]?.userId

      const isCustomer = session.userId === userId
      const isConsultant = consultantUserId === userId

      if (!isCustomer && !isConsultant) {
        return response.status(403).json({ message: 'Acesso negado a esta sala.' })
      }

      // Adicionamos o daily token se for uma sala privada e tivermos API key
      let dailyToken = null
      const [creds] = await pool.query('SELECT dailyApiKey FROM platform_credentials WHERE id = 1')
      let apiKey = creds[0]?.dailyApiKey

      // Remove eventuais espaços ou aspas da apiKey
      if (apiKey) {
        apiKey = apiKey.trim()
      }

      if (apiKey) {
        try {
          const roomName = session.roomUrl.split('/').pop()
          console.log('[videoSessions GET /:sessionId] ═══════════════════════════════════════')
          console.log('[videoSessions GET /:sessionId] Gerando token Daily.co')
          console.log('[videoSessions GET /:sessionId] roomName:', roomName)
          console.log('[videoSessions GET /:sessionId] isConsultant:', isConsultant)
          console.log('[videoSessions GET /:sessionId] user_name:', isConsultant ? session.consultantName : session.userName)
          console.log('[videoSessions GET /:sessionId] ═══════════════════════════════════════')
          
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
            console.log('[videoSessions GET /:sessionId] ✓ Token gerado com sucesso')
            console.log('[videoSessions GET /:sessionId] Token length:', tokenData.token?.length)
          } else {
            try {
              const errorData = await tokenRes.json()
              console.error('[videoSessions GET /:sessionId] ✗ Erro ao gerar token:', errorData)
            } catch (e) {
              console.error('[videoSessions GET /:sessionId] ✗ Erro ao gerar token (não-JSON):', tokenRes.status, tokenRes.statusText)
            }
          }
        } catch (e) {
          console.error('[videoSessions GET /:sessionId] ✗ Exception ao gerar token:', e.message)
        }
      } else {
        console.warn('[videoSessions GET /:sessionId] ⚠️  apiKey vazia - dailyToken será null')
      }
      
      console.log('[videoSessions GET /:sessionId] ═════ RESPOSTA FINAL ═════')
      console.log('[videoSessions GET /:sessionId] roomUrl:', session.roomUrl)
      console.log('[videoSessions GET /:sessionId] status:', session.status)
      console.log('[videoSessions GET /:sessionId] dailyToken présent:', !!dailyToken)
      console.log('[videoSessions GET /:sessionId] isConsultant:', isConsultant)
      console.log('[videoSessions GET /:sessionId] pricePerMinute:', session.pricePerMinute)
      console.log('[videoSessions GET /:sessionId] ═════════════════════════')
      response.status(200).json({
        status: session.status,
        roomUrl: session.roomUrl,
        pricePerMinute: Number(session.pricePerMinute) || 0,
        consultantId: session.consultantId,
        consultantName: session.consultantName,
        isConsultant,
        dailyToken
      })
    } catch (error) {
      console.error('Erro ao buscar sessão:', error)
      response.status(500).json({ message: 'Erro ao carregar dados da sala.' })
    }
  })

  // Atualizar status (quando ambos entram e o vídeo inicia)
  router.patch('/:sessionId/status', async (request, response) => {
    const { sessionId } = request.params
    const { status } = request.body

    if (!['active', 'finished', 'cancelled', 'rejected'].includes(status)) {
      return response.status(400).json({ message: 'Status inválido.' })
    }

    try {
      const timeField = status === 'active' ? 'startedAt' : 'finishedAt'
      await pool.query(`UPDATE video_sessions SET status = ?, ${timeField} = NOW() WHERE id = ?`, [status, sessionId])
      response.json({ ok: true })
    } catch (error) {
      console.error('Erro ao atualizar status da sessão:', error)
      response.status(500).json({ message: 'Erro ao atualizar status da sessão.' })
    }
  })

  // Rota para finalizar sessão com duração e compensação ao consultor
  router.patch('/:sessionId/finish', async (request, response) => {
    const { sessionId } = request.params
    const { durationSeconds } = request.body

    console.log('[videoSessions /finish] Recebido: sessionId=', sessionId, 'durationSeconds=', durationSeconds)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Obter dados da sessão
      const [sessions] = await connection.query(
        `SELECT vs.id, vs.userId, vs.consultantId, vs.status, vs.roomUrl, vs.createdAt, vs.startedAt, vs.finishedAt, vs.durationSeconds, vs.consultantEarnings FROM video_sessions vs WHERE vs.id = ? FOR UPDATE`,
        [sessionId]
      )

      if (!sessions.length) {
        await connection.rollback()
        return response.status(404).json({ message: 'Sessão não encontrada.' })
      }

      const session = sessions[0]

      // Idempotência: evita débito/crédito duplicado quando os dois lados encerram quase juntos.
      if (session.status === 'finished') {
        const [userRows] = await connection.query(
          'SELECT minutesBalance FROM users WHERE id = ?',
          [session.userId]
        )
        const existingUserBalance = userRows.length > 0 ? Number(userRows[0].minutesBalance) || 0 : 0

        await connection.rollback()
        console.log('[videoSessions /finish] Sessão já finalizada anteriormente. Ignorando reprocessamento:', sessionId)
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

      // Cálculo autoritativo do backend: não confiar em consumo/ganho enviados pelo frontend.
      const grossConsumption = roundCurrency((duration / 60) * pricePerMinute)

      // Atualizar sessão com duração e ganho
      await connection.query(
        `UPDATE video_sessions SET status = 'finished', finishedAt = NOW(), durationSeconds = ?, consultantEarnings = ? WHERE id = ?`,
        [duration, grossConsumption, sessionId]
      )

      // DÉBITO DO USUÁRIO (consumo total da sessão - aquilo que vai sair da carteira)
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
        
        // Debitar do usuário
        await connection.query(
          'UPDATE users SET minutesBalance = ? WHERE id = ?',
          [newBalance, session.userId]
        )
        
        console.log('[videoSessions /finish] Usuario debitado. Saldo anterior: R$', currentBalance.toFixed(2), ' Novo saldo: R$', newBalance.toFixed(2), ' Consumo efetivo: R$', effectiveConsumption.toFixed(2))

        // Ganho bruto da sessão passa a ser exatamente o valor efetivamente debitado do usuário.
        session.consultantEarnings = effectiveConsumption
      }

      // Garantir persistência do mesmo valor econômico usado no débito/crédito.
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
        
        // 30% para plataforma, 70% para consultor (padrão)
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

        // Adicionar COMISSÃO à carteira (não o valor total)
        await connection.query(
          `UPDATE consultant_wallets SET availableBalance = availableBalance + ? WHERE consultantId = ?`,
          [commissionEarnings, session.consultantId]
        )
        console.log('[videoSessions /finish] Carteira do consultor atualizada com R$', commissionEarnings.toFixed(2))

        // Criar registro de transação
        const txId = `tx_video_${sessionId}`
        const billedMinutes = (duration / 60).toFixed(2)
        const txDescription = `Ganho de videoconsulta (${billedMinutes} min à R$ ${pricePerMinute.toFixed(2)}/min)`
        
        await connection.query(
          `INSERT INTO wallet_transactions (id, consultantId, type, amount, commissionValue, createdAt, description)
           VALUES (?, ?, 'credit', ?, ?, NOW(), ?)
           ON DUPLICATE KEY UPDATE amount = VALUES(amount), commissionValue = VALUES(commissionValue), description = VALUES(description)`,
          [txId, session.consultantId, commissionEarnings, platformShare, txDescription]
        )
        console.log('[videoSessions /finish] Transação registrada: txId=', txId)
      } else {
        console.log('[videoSessions /finish] earnings = 0, nenhum ganho para processar')
      }

      // Buscar novo saldo do usuário após débito
      const [updatedUser] = await connection.query(
        'SELECT minutesBalance FROM users WHERE id = ?',
        [session.userId]
      )
      const newUserBalance = updatedUser.length > 0 ? updatedUser[0].minutesBalance : 0

      await connection.commit()
      const finalEarnings = Number(session.consultantEarnings) || 0
      console.log('[videoSessions /finish] Sessão finalizada com sucesso. sessionId=', sessionId, 'earnings=', finalEarnings, 'newUserBalance=', newUserBalance)
      response.json({ ok: true, earnings: finalEarnings, newUserBalance })

    } catch (error) {
      await connection.rollback()
      console.error('Erro ao finalizar sessão de vídeo:', error)
      response.status(500).json({ message: 'Erro ao finalizar sessão.' })
    } finally {
      connection.release()
    }
  })

  return router
}
