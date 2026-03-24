import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { assertDatabaseConfig, createPool, initializeSchema } from './db.mjs'
import { createConsultantsRouter } from './routes/consultants.mjs'
import { createCredentialsRouter } from './routes/credentials.mjs'
import { createQuestionRequestsRouter } from './routes/questionRequests.mjs'
import { createWalletsRouter } from './routes/wallets.mjs'
import { createAuthRouter } from './routes/auth.mjs'
import { createRechargesRouter } from './routes/recharges.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

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

const corsOptions = {
  origin: ['https://appastria.online', 'http://localhost:5173', 'https://peru-jay-760583.hostingersite.com'],
  credentials: true
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '4mb' }))

// Rota de diagnóstico ULTRA simples para ver se o Node subiu
app.get('/health-check', (_req, res) => {
  console.log('[API] Health-check acessado!')
  res.send('O Servidor Node.js está VIVO e REINICIADO (V9)!')
})

// Servir arquivos estáticos do Frontend
app.use(express.static(distPath))

// Middleware para diagnóstico de versão
app.use((_req, res, next) => {
  res.setHeader('X-Backend-Version', 'V5-STABLE')
  next()
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

// Logger middleware
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
  app.use('/api/auth', createAuthRouter(pool))
  app.use('/api/recharges', createRechargesRouter(pool))
  app.use('/api/consultants', createConsultantsRouter(pool))
  app.use('/api/credentials', createCredentialsRouter(pool))
  app.use('/api/question-requests', createQuestionRequestsRouter(pool))
  app.use('/api/wallets', createWalletsRouter(pool))

  // Await schema initialization to avoid table not found errors
  console.log('[API] Inicializando schema...')
  try {
    await initializeSchema(pool)
    console.log('[API] Schema inicializado com sucesso.')
  } catch (error) {
    databaseConfigError = error.message
    console.error('[API] Falha crítica ao inicializar schema MySQL:', error.message)
  }
} catch (error) {
  databaseConfigError = error.message
  console.error('Configuração de banco inválida:', error.message)
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

// Roteamento SPA: Qualquer rota que não comece com /api deve retornar o index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API Route not found' })
  }
  const indexPath = path.join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Frontend não encontrado (Pasta dist/ vazia no servidor)')
  }
})

// Error handler global
app.use((err, _req, res, _next) => {
  console.error('[API] Erro global capturado:', err)
  res.status(500).json({ 
    message: 'Erro interno fatal no servidor.',
    error: err.message,
    stack: err.stack
  })
})

app.use((error, _request, response, _next) => {
  response.status(500).json({
    ok: false,
    message: error.message || 'Erro interno.',
  })
})

app.listen(port, () => {
  console.log(`API Express iniciada na porta ${port}`)
})

export default app
