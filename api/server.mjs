import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { assertDatabaseConfig, createPool, initializeSchema } from './db.mjs'
import { createConsultantsRouter } from './routes/consultants.mjs'
import { createCredentialsRouter } from './routes/credentials.mjs'
import { createQuestionRequestsRouter } from './routes/questionRequests.mjs'
import { createWalletsRouter } from './routes/wallets.mjs'
import { createAuthRouter } from './routes/auth.mjs'
import { createRechargesRouter } from './routes/recharges.mjs'
import { createVideoSessionsRouter } from './routes/videoSessions.mjs'
import { createSpellsRouter } from './routes/spells.mjs'
import webpush from 'web-push'
import { authenticate, authorizeAdmin } from './middleware/auth.mjs'
import { initializeFirebaseAdmin } from './firebaseAdmin.mjs'
import { getUserIdsByRole, saveNativePushToken, savePushSubscription, sendPushToUsers } from './push.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

// Configuração Web Push (VAPID Keys)
const vapidKeys = {
  publicKey: (process.env.VAPID_PUBLIC_KEY || '').trim(),
  privateKey: (process.env.VAPID_PRIVATE_KEY || '').trim(),
}
const pushEnabled = Boolean(vapidKeys.publicKey && vapidKeys.privateKey)

if (pushEnabled) {
  webpush.setVapidDetails(
    'mailto:contato@appastria.online',
    vapidKeys.publicKey,
    vapidKeys.privateKey,
  )
} else {
  console.warn('[push] Web Push desativado: VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas no ambiente.')
}

const firebaseAdmin = initializeFirebaseAdmin()

// CAPTURA DE ERROS CRÍTICOS (CRASH LOG)
process.on('uncaughtException', (err) => {
  const msg = `[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}\n\n`
  fs.appendFileSync('crash.log', msg)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  const msg = `[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n\n`
  fs.appendFileSync('crash.log', msg)
})

const app = express()
const httpServer = createServer(app)
const sessionPresence = new Map()
const io = new Server(httpServer, {
  cors: {
    origin: ['https://appastria.online', 'http://localhost:5173', 'https://peru-jay-760583.hostingersite.com'],
    methods: ["GET", "POST"]
  }
})

// Adiciona o socket.io e o webpush ao app para serem acessados nas rotas
app.set('io', io)
app.set('webpush', webpush)
app.set('firebaseAdmin', firebaseAdmin)
app.set('pushEnabled', pushEnabled)
app.set('nativePushEnabled', Boolean(firebaseAdmin))
app.set('sessionPresence', sessionPresence)

const initialCorsOptions = {
  origin: ['https://appastria.online', 'http://localhost:5173', 'https://peru-jay-760583.hostingersite.com'],
  credentials: true,
}

const extractNativeRoute = (url) => {
  if (!url) {
    return '/'
  }

  if (url.startsWith('/')) {
    return url
  }

  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}` || '/'
  } catch {
    return '/'
  }
}

app.use(cors(initialCorsOptions))
app.use(express.json({ limit: '4mb' }))

// Rota para retornar a Public Key do VAPID para o frontend
app.get('/api/push/public-key', (req, res) => {
  if (!pushEnabled) {
    return res.status(503).send('Web Push desativado no servidor.')
  }
  res.send(vapidKeys.publicKey)
})

// Lógica de Sockets para notificações em tempo real
io.on('connection', (socket) => {
  socket.data.sessionPresenceKeys = new Set()

  const addPresence = ({ sessionId, userId, role }) => {
    if (!sessionId || !userId) {
      return
    }

    const key = String(sessionId)
    const current = sessionPresence.get(key) || new Map()
    current.set(String(userId), {
      userId: String(userId),
      role: role || 'unknown',
      connectedAt: Date.now(),
      socketId: socket.id,
    })
    sessionPresence.set(key, current)
    socket.data.sessionPresenceKeys.add(key)
  }

  const removePresence = (sessionId, userId) => {
    if (!sessionId || !userId) {
      return
    }

    const key = String(sessionId)
    const current = sessionPresence.get(key)
    if (!current) {
      return
    }

    current.delete(String(userId))
    if (current.size === 0) {
      sessionPresence.delete(key)
    }
    socket.data.sessionPresenceKeys.delete(key)
  }

  // Consultor entra na sua própria sala privada para receber notificações
  socket.on('join_consultant_room', (consultantId) => {
    socket.join(`consultant_${consultantId}`)
    console.log(`[Socket] Consultor ${consultantId} conectou e entrou na sala.`)
  })

  socket.on('join_session_presence', ({ sessionId, userId, role }) => {
    addPresence({ sessionId, userId, role })
    socket.join(`presence_${sessionId}`)
    io.to(`presence_${sessionId}`).emit('session_presence_update', {
      sessionId,
      members: Array.from(sessionPresence.get(String(sessionId))?.values() || []),
    })
  })

  socket.on('leave_session_presence', ({ sessionId, userId }) => {
    removePresence(sessionId, userId)
    socket.leave(`presence_${sessionId}`)
    io.to(`presence_${sessionId}`).emit('session_presence_update', {
      sessionId,
      members: Array.from(sessionPresence.get(String(sessionId))?.values() || []),
    })
  })

  // Sincronizar encerramento de videochamada entre usuário e consultor
  socket.on('user_leaving_call', ({ sessionId }) => {
    // Broadcast para todos os clientes sobre esse sessionId saindo
    io.to(`call_${sessionId}`).emit('other_user_left_call')
    console.log(`[Socket] Usuário saiu da chamada ${sessionId}`)
  })

  // Ao conectar, cliente pode entrar em sala de chamada específica
  socket.on('join_call_room', ({ sessionId }) => {
    socket.join(`call_${sessionId}`)
    console.log(`[Socket] Cliente entrou na sala de chamada ${sessionId}`)
  })

  socket.on('disconnect', () => {
    socket.data.sessionPresenceKeys?.forEach((sessionId) => {
      const current = sessionPresence.get(sessionId)
      if (!current) {
        return
      }

      Array.from(current.values()).forEach((member) => {
        if (member.socketId === socket.id) {
          current.delete(member.userId)
        }
      })

      if (current.size === 0) {
        sessionPresence.delete(sessionId)
      } else {
        io.to(`presence_${sessionId}`).emit('session_presence_update', {
          sessionId,
          members: Array.from(current.values()),
        })
      }
    })
  })
})

console.log('[API] Servidor iniciando...')

// Tentar criar um arquivo de log de inicialização (debug)
try {
  fs.appendFileSync('startup.log', `[${new Date().toISOString()}] Servidor iniciando (V11-STABLE)\n`)
} catch (e) {}

// Force restart: 2026-03-24 15:00 (V11)
const port = Number(process.env.PORT || 3000)

console.log('[API] __dirname:', __dirname)
const distPath = path.join(__dirname, '..', 'dist')
console.log('[API] distPath:', distPath)

// Rota de diagnóstico ULTRA simples para ver se o Node subiu
app.get('/health-check', (_req, res) => {
  console.log('[API] Health-check acessado!')
  res.send('O Servidor Node.js está VIVO e REINICIADO (V9)!')
})

// Rota de ping pública no root
app.get('/ping-v6', (_request, response) => {
  response.json({ 
    ok: true, 
    version: 'V6-FINAL-ROOT', 
    timestamp: new Date().toISOString(),
    message: 'Backend V6 ATIVO NA RAIZ DO SERVIDOR!'
  })
})

app.get('/api/ping-v6', (_request, response) => {
  response.json({ 
    ok: true, 
    version: 'V6-FINAL-ROOT', 
    timestamp: new Date().toISOString(),
    message: 'Backend V6 ATIVO NO /API!'
  })
})

// Logger middleware - Log all requests
app.use((request, _response, next) => {
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
  next()
})

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'api', timestamp: new Date().toISOString() })
})

app.get('/api/health-db', async (_request, response) => {
  let pool = null
  try {
    pool = createPool()
    // Timeout de 5 segundos para a query
    const [rows] = await Promise.race([
      pool.query('SELECT 1 as ok'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
    ])
    response.json({ ok: true, db: rows[0].ok === 1, config: { host: process.env.DB_HOST, user: process.env.DB_USER } })
  } catch (err) {
    console.error('Erro no health-db:', err)
    response.status(500).json({ ok: false, error: err.message })
  } finally {
    if (pool) await pool.end()
  }
})

let databaseConfigError = null

try {
  assertDatabaseConfig()
  const pool = createPool()
  console.log('[API] Pool de conexão criado com sucesso.')
  
  app.use('/api/auth', createAuthRouter(pool))
  console.log('[API] Router /auth carregado.')
  
  app.use('/api/recharges', createRechargesRouter(pool))
  console.log('[API] Router /recharges carregado.')
  
  app.use('/api/consultants', createConsultantsRouter(pool))
  console.log('[API] Router /consultants carregado.')
  
  app.use('/api/credentials', createCredentialsRouter(pool))
  console.log('[API] Router /credentials carregado.')
  
  app.use('/api/question-requests', createQuestionRequestsRouter(pool))
  console.log('[API] Router /question-requests carregado.')
  
  app.use('/api/wallets', createWalletsRouter(pool))
  console.log('[API] Router /wallets carregado.')
  
  app.use('/api/video-sessions', createVideoSessionsRouter(pool))
  console.log('[API] Router /video-sessions carregado.')

  app.use('/api/spells', createSpellsRouter(pool))
  console.log('[API] Router /spells carregado.')

  app.post('/api/push/subscribe', authenticate, async (req, res) => {
    if (!pushEnabled) {
      return res.status(503).json({ error: 'Web Push desativado no servidor.' })
    }

    const { subscription, userId } = req.body ?? {}

    if (!subscription || !userId) {
      return res.status(400).json({ error: 'Faltam dados de assinatura ou usuário' })
    }

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Usuário não autorizado a registrar essa assinatura' })
    }

    try {
      await savePushSubscription({
        pool,
        userId,
        subscription,
        userAgent: req.get('user-agent') || null,
      })
      res.status(201).json({ success: true })
    } catch (error) {
      console.error('[push subscribe] erro:', error)
      res.status(500).json({ error: 'Não foi possível salvar a assinatura push.' })
    }
  })

  app.post('/api/push/native/register', authenticate, async (req, res) => {
    const {
      token,
      platform = 'android',
      provider = 'fcm',
      deviceId = null,
      appVersion = null,
    } = req.body ?? {}

    try {
      await saveNativePushToken({
        pool,
        userId: req.user.id,
        token,
        platform,
        provider,
        deviceId,
        appVersion,
      })
      res.status(201).json({ ok: true })
    } catch (error) {
      console.error('[native push register] erro:', error)
      res.status(500).json({ ok: false, error: 'Não foi possível salvar o token nativo.' })
    }
  })

  app.get('/api/push/me/status', authenticate, async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
          SELECT endpoint, isActive, failureCount, lastSuccessAt, lastFailureAt, createdAt, updatedAt
          FROM push_subscriptions
          WHERE userId = ?
          ORDER BY updatedAt DESC
        `,
        [req.user.id],
      )
      const [nativeRows] = await pool.query(
        `
          SELECT token, platform, provider, isActive, failureCount, lastSuccessAt, lastFailureAt, createdAt, updatedAt
          FROM native_push_tokens
          WHERE userId = ?
          ORDER BY updatedAt DESC
        `,
        [req.user.id],
      )

      res.json({
        ok: true,
        userId: req.user.id,
        vapidConfigured: pushEnabled,
        nativeConfigured: Boolean(firebaseAdmin),
        totalSubscriptions: rows.length,
        activeSubscriptions: rows.filter((row) => Number(row.isActive) === 1).length,
        totalNativeTokens: nativeRows.length,
        activeNativeTokens: nativeRows.filter((row) => Number(row.isActive) === 1).length,
        subscriptions: rows.map((row) => ({
          ...row,
          endpointPreview: `${row.endpoint.slice(0, 48)}...`,
        })),
        nativeTokens: nativeRows.map((row) => ({
          ...row,
          tokenPreview: `${row.token.slice(0, 24)}...`,
        })),
      })
    } catch (error) {
      console.error('[push status] erro:', error)
      res.status(500).json({ ok: false, message: 'Erro ao consultar status do push.' })
    }
  })

  app.post('/api/push/me/test', authenticate, async (req, res) => {
    if (!pushEnabled && !firebaseAdmin) {
      return res.status(503).json({ ok: false, message: 'Push desativado no servidor. Configure VAPID ou Firebase Admin.' })
    }

    try {
      const result = await sendPushToUsers({
        pool,
        webpush,
        firebaseAdmin,
        userIds: [req.user.id],
        payload: {
          title: 'Teste de Push Astria',
          body: 'Se você recebeu isso, o push deste dispositivo está funcionando.',
          url: '/area-consultor',
          nativeRoute: '/area-consultor',
          type: 'question_answered',
        },
      })

      res.json({
        ok: true,
        ...result,
        failureMessages: result.results
          .filter((item) => !item.ok)
          .map((item) => `${item.error?.statusCode || 'n/a'}: ${item.error?.message || 'erro'}`),
      })
    } catch (error) {
      console.error('[push self test] erro:', error)
      res.status(500).json({ ok: false, message: 'Erro ao enviar push de teste.' })
    }
  })

  app.post('/api/push/admin/broadcast', authenticate, authorizeAdmin, async (req, res) => {
    if (!pushEnabled && !firebaseAdmin) {
      return res.status(503).json({ message: 'Push desativado no servidor. Configure VAPID ou Firebase Admin.' })
    }

    const { title, body, url, targetRole = 'all' } = req.body ?? {}

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ message: 'title e body são obrigatórios.' })
    }

    try {
      const userIds = await getUserIdsByRole({ pool, targetRole })
      const result = await sendPushToUsers({
        pool,
        webpush,
        firebaseAdmin,
        userIds,
        payload: {
          title: title.trim(),
          body: body.trim(),
          url: url?.trim() || '/',
          nativeRoute: extractNativeRoute(url?.trim() || '/'),
          type: 'admin_broadcast',
        },
      })

      res.json({
        ok: true,
        targetRole,
        recipients: userIds.length,
        ...result,
      })
    } catch (error) {
      console.error('[admin broadcast push] erro:', error)
      res.status(500).json({ message: 'Erro ao enviar notificação push em massa.' })
    }
  })

  // Await schema initialization to avoid table not found errors
  console.log('[API] Inicializando schema...')
  initializeSchema(pool)
    .then(() => {
      console.log('[API] Schema inicializado com sucesso.')
    })
    .catch((error) => {
      databaseConfigError = error.message
      console.error('[API] Erro ao inicializar schema:', error)
      console.error('[API] Falha crítica ao inicializar schema MySQL:', error.message)
    })
} catch (error) {
  databaseConfigError = error.message
  console.error('[API] ERRO CRÍTICO - Configuração de banco inválida:', error.message)
  console.error('[API] Stack:', error.stack)
  
  // Log das variáveis de ambiente para debug
  console.error('[API] Variáveis de ambiente disponíveis:')
  console.error('[API]   DB_HOST:', process.env.DB_HOST ? 'SET' : 'NOT SET')
  console.error('[API]   DB_PORT:', process.env.DB_PORT ? 'SET' : 'NOT SET')
  console.error('[API]   DB_USER:', process.env.DB_USER ? 'SET' : 'NOT SET')
  console.error('[API]   DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET')
  console.error('[API]   DB_NAME:', process.env.DB_NAME ? 'SET' : 'NOT SET')
}

app.get('/api/config-error', (_request, response) => {
  if (!databaseConfigError) {
    response.json({
      ok: true,
      message: 'Configurações de banco carregada sem erros.',
    })
  } else {
    response.status(500).json({
      ok: false,
      message: 'Erro na configuração do banco.',
      error: databaseConfigError,
    })
  }
})

app.get('/api/runtime-info', (_request, response) => {
  response.json({
    ok: true,
    node: process.version,
    port,
    cwd: process.cwd(),
  })
})

// Servir arquivos estáticos do Frontend APÓS as rotas da API
app.use(express.static(distPath))

// Middleware para diagnóstico de versão
app.use((_req, res, next) => {
  res.setHeader('X-Backend-Version', 'V5-STABLE')
  next()
})

// 404 handler para APIs não encontradas
app.use('/api', (_req, res) => {
  console.warn('[API] Rota não encontrada:', _req.path)
  res.status(404).json({
    ok: false,
    message: 'Endpoint da API não encontrado',
    path: _req.path,
    method: _req.method
  })
})

// Roteamento SPA: Qualquer rota que não comece com /api deve retornar o index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next()
  }
  const indexPath = path.join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Frontend não encontrado (Pasta dist/ vazia no servidor)')
  }
})

// Error handler global - DEVE SER O ÚLTIMO
app.use((err, _req, res, _next) => {
  console.error('[API] Erro global capturado:', err)
  res.status(500).json({ 
    message: 'Erro interno fatal no servidor.',
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  })
})

httpServer.listen(port, () => {
  console.log(`[API] Express iniciada na porta ${port}`)
  
  // Inicializar schema do banco de dados APÓS o servidor estar ouvindo
  // Isso evita que erros de DB impçam a inicialização do servidor
  if (databaseConfigError) {
    console.warn('[API] ⚠️  AVISO: Servidor rodando mas com erro de configuração de banco!')
    console.warn('[API] Endpoints de diagnóstico estarão disponíveis.')
  } else {
    // Se não houve erro durante o carregamento dos routers, já está OK
    console.log('[API] ✅ Sistema pronto e operacional')
  }
})

export default app
