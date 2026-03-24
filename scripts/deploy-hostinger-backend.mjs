import fs from 'node:fs'
import { Client } from 'basic-ftp'

const requiredEnvVars = ['HOSTINGER_FTP_HOST', 'HOSTINGER_FTP_USER', 'HOSTINGER_FTP_PASSWORD']

const getMissingVars = () => requiredEnvVars.filter((key) => !process.env[key]?.trim())

const resolveBoolean = (value, fallback) => {
  if (!value) {
    return fallback
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const uploadItems = [
  { local: 'api', remote: 'api' },
  { local: 'server.js', remote: 'server.js' },
  { local: 'package.json', remote: 'package.json' },
  { local: 'package-lock.json', remote: 'package-lock.json' },
]

const run = async () => {
  const missingVars = getMissingVars()
  if (missingVars.length > 0) {
    throw new Error(`Variáveis ausentes: ${missingVars.join(', ')}`)
  }

  const client = new Client()
  client.ftp.verbose = false

  const secure = resolveBoolean(process.env.HOSTINGER_FTP_SECURE, false)
  const remoteBaseDir = (process.env.HOSTINGER_BACKEND_REMOTE_DIR || '/backend').trim()
  const shouldClean = resolveBoolean(process.env.HOSTINGER_DEPLOY_CLEAN, true)

  try {
    console.log('Conectando ao FTP da Hostinger...')
    await client.access({
      host: process.env.HOSTINGER_FTP_HOST.trim(),
      user: process.env.HOSTINGER_FTP_USER.trim(),
      password: process.env.HOSTINGER_FTP_PASSWORD,
      secure,
    })

    await client.ensureDir(remoteBaseDir)
    await client.cd(remoteBaseDir)

    if (shouldClean) {
      console.log(`Limpando diretório remoto: ${remoteBaseDir}`)
      await client.clearWorkingDir()
    }

    for (const item of uploadItems) {
      console.log(`Enviando ${item.local}...`)
      const stats = fs.statSync(item.local)
      if (stats.isDirectory()) {
        await client.ensureDir(item.remote)
        await client.uploadFromDir(item.local, item.remote)
        continue
      }
      await client.uploadFrom(item.local, item.remote)
    }

    console.log('Deploy do backend concluído com sucesso.')
  } finally {
    client.close()
  }
}

run().catch((error) => {
  console.error('Falha no deploy de backend para Hostinger.')
  console.error(error.message)
  process.exit(1)
})
