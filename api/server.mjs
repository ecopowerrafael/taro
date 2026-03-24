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

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3000)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '..', 'dist')
const hasFrontendBuild = fs.existsSync(path.join(distPath, 'index.html'))

app.use(cors())
app.use(express.json({ limit: '4mb' }))

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'api', timestamp: new Date().toISOString() })
})

let databaseConfigError = null

try {
  assertDatabaseConfig()
  const pool = createPool()
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
    hasFrontendBuild,
    cwd: process.cwd(),
  })
})

if (hasFrontendBuild) {
  app.use(express.static(distPath))
  app.get('/{*any}', (_request, response) => {
    response.sendFile(path.join(distPath, 'index.html'))
  })
} else {
  app.get('/', (_request, response) => {
    response.json({ ok: true, service: 'api', mode: 'backend-only' })
  })
}

app.use((error, _request, response, _next) => {
  response.status(500).json({
    ok: false,
    message: error.message || 'Erro interno.',
  })
})

app.listen(port, () => {
  console.log(`API Express iniciada na porta ${port}`)
})
