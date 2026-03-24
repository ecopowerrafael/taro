import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { assertDatabaseConfig, createPool, initializeSchema } from './db.mjs'
import { createConsultantsRouter } from './routes/consultants.mjs'
import { createQuestionRequestsRouter } from './routes/questionRequests.mjs'
import { createWalletsRouter } from './routes/wallets.mjs'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3000)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '..', 'dist')

app.use(cors())
app.use(express.json({ limit: '4mb' }))

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'api', timestamp: new Date().toISOString() })
})

try {
  assertDatabaseConfig()
  const pool = createPool()
  await initializeSchema(pool)
  app.use('/api/consultants', createConsultantsRouter(pool))
  app.use('/api/question-requests', createQuestionRequestsRouter(pool))
  app.use('/api/wallets', createWalletsRouter(pool))
} catch (error) {
  app.get('/api/config-error', (_request, response) => {
    response.status(500).json({
      ok: false,
      message: error.message,
    })
  })
}

app.use(express.static(distPath))

app.get('*', (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'))
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
