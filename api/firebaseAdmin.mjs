import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import admin from 'firebase-admin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DEFAULT_SERVICE_ACCOUNT_PATH = path.join(__dirname, 'firebase-service-account.json')

const parseServiceAccount = () => {
  const inlineConfig = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim()
  if (inlineConfig) {
    try {
      return JSON.parse(inlineConfig)
    } catch (error) {
      console.error('[push] FIREBASE_SERVICE_ACCOUNT_JSON inválido:', error)
      return null
    }
  }

  const configuredFilePath = (process.env.FIREBASE_SERVICE_ACCOUNT_FILE || '').trim()
  const candidatePaths = [configuredFilePath, DEFAULT_SERVICE_ACCOUNT_PATH].filter(Boolean)

  for (const filePath of candidatePaths) {
    try {
      if (!fs.existsSync(filePath)) {
        continue
      }
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (error) {
      console.error(`[push] Não foi possível ler service account em ${filePath}:`, error)
      return null
    }
  }

  return null
}

export const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app()
  }

  const serviceAccount = parseServiceAccount()
  if (!serviceAccount) {
    console.warn(`[push] FCM nativo desativado: informe FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_FILE ou coloque firebase-service-account.json em ${DEFAULT_SERVICE_ACCOUNT_PATH}.`)
    return null
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } catch (error) {
    console.error('[push] Falha ao inicializar firebase-admin:', error)
    return null
  }
}
