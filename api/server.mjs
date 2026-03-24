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

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3000)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors())
app.use(express.json({ limit: '4mb' }))

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
  app.use('/api/consultants', createConsultantsRouter(pool))
  app.use('/api/credentials', createCredentialsRouter(pool))
  app.use('/api/question-requests', createQuestionRequestsRouter(pool))
  app.use('/api/wallets', createWalletsRouter(pool))

  void initializeSchema(pool).catch((error) => {
    databaseConfigError = error.message
    console.error('Falha ao inicializar schema MySQL:', error.message)
  })
} catch (error) {
  databaseConfigError = error.message
  console.error('Configuração de banco inválida:', error.message)
}

app.get('/api/config-error', (_request, response) => {
  if (!databaseConfigError) {
    response.json({
      ok: true,
      message: 'Configuração de banco carregada sem erros.',
    })
    return
  }
  response.status(500).json({
    ok: false,
    message: databaseConfigError,
  })
})

app.get('/api/runtime-info', (_request, response) => {
  response.json({
    ok: true,
    node: process.version,
    port,
    cwd: process.cwd(),
  })
})

app.get('/', (_request, response) => {
  response.json({ ok: true, service: 'api', mode: 'backend-only' })
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
