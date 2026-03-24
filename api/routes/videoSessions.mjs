import { Router } from 'express'
import { authenticate } from '../middleware/auth.mjs'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

export const createVideoSessionsRouter = (pool) => {
  const router = Router()

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

      // Obter informações do consultor
      const [consultants] = await pool.query('SELECT id, name, email FROM consultants WHERE id = ?', [consultantId])
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
          const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              name: roomId,
              privacy: 'private', // Privada
              properties: {
                exp: Math.floor(Date.now() / 1000) + 24 * 3600 // Expira em 24h
              }
            })
          })
          if (dailyRes.ok) {
            const dailyData = await dailyRes.json()
            roomUrl = dailyData.url
          } else {
            // Fallback
            roomUrl = `https://${credentials.dailyDomain}/${roomId}`
          }
        } catch (e) {
          roomUrl = `https://${credentials.dailyDomain}/${roomId}`
        }
      } else {
        const domain = credentials.dailyDomain || 'demo.daily.co'
        roomUrl = `https://${domain}/${roomId}`
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
                exp: Math.floor(Date.now() / 1000) + 24 * 3600 // Expira em 24h
              }
            })
          })
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json()
            dailyToken = tokenData.token
          } else {
            const errorData = await tokenRes.json()
            console.error('Erro retornado pela API do Daily ao gerar token:', errorData)
          }
        } catch (e) {
          console.error('Erro ao gerar token do Daily:', e)
        }
      }

      response.json({
        ...session,
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

    if (!['active', 'finished'].includes(status)) {
      return response.status(400).json({ message: 'Status inválido.' })
    }

    try {
      const timeField = status === 'active' ? 'startedAt' : 'finishedAt'
      await pool.query(`UPDATE video_sessions SET status = ?, ${timeField} = NOW() WHERE id = ?`, [status, sessionId])
      response.json({ ok: true })
    } catch (error) {
      response.status(500).json({ message: 'Erro ao atualizar status da sessão.' })
    }
  })

  return router
}
