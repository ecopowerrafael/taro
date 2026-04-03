import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'basic-ftp'
import dotenv from 'dotenv'

const localEnvPath = path.resolve(process.cwd(), '.env')
const fallbackEnvPath = path.resolve(process.cwd(), '..', 'taro-mobile', '.env')

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath })
} else if (fs.existsSync(fallbackEnvPath)) {
  dotenv.config({ path: fallbackEnvPath })
}

const requiredEnvVars = ['BACK_FTP_HOST', 'BACK_FTP_USER', 'BACK_FTP_PASSWORD']

const getMissingVars = () => requiredEnvVars.filter((key) => !process.env[key]?.trim())

const resolveBoolean = (value, fallback) => {
  if (!value) {
    return fallback
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const uploadItems = [
  { local: 'api', remote: 'api' },
  { local: 'api/.env', remote: 'api/.env' },
  { local: 'api/firebase-service-account.json', remote: 'api/firebase-service-account.json' },
  { local: 'package.json', remote: 'package.json' },
  { local: 'package-lock.json', remote: 'package-lock.json' },
  { local: '.env', remote: '.env' },
  { local: 'server.js', remote: 'server.js' },
]

const run = async () => {
  const missingVars = getMissingVars()
  if (missingVars.length > 0) {
    throw new Error(`Variáveis de backend ausentes: ${missingVars.join(', ')}`)
  }

  const client = new Client()
  client.ftp.verbose = true

  const secure = resolveBoolean(process.env.FTP_SECURE, false)
  const remoteBaseDir = (process.env.BACK_REMOTE_DIR || 'public_html').trim()
  // Mudamos para false para não apagar o .htaccess automático da Hostinger
  const shouldClean = false 

  try {
    console.log(`Conectando ao FTP do Backend (${process.env.BACK_FTP_HOST})...`)
    const rawPassword = process.env.BACK_FTP_PASSWORD.trim().replace(/^["']|["']$/g, '')
    await client.access({
      host: process.env.BACK_FTP_HOST.trim(),
      user: process.env.BACK_FTP_USER.trim(),
      password: rawPassword,
      secure,
    })

    console.log(`Entrando no diretório: /${remoteBaseDir}`)
    await client.ensureDir(`/${remoteBaseDir}`)
    await client.cd(`/${remoteBaseDir}`)

    if (shouldClean) {
      console.log(`Limpando diretório remoto: /${remoteBaseDir}`)
      await client.clearWorkingDir()
    }

    // NÃO APAGAR .htaccess pois a Hostinger o usa para o Passenger (Node.js)
    /*
    try {
      await client.remove('.htaccess')
      console.log('.htaccess antigo removido do backend.')
    } catch (e) {
      // Ignora se o arquivo não existir
    }
    */

    for (const item of uploadItems) {
      if (!fs.existsSync(item.local)) {
        console.warn(`Aviso: Arquivo/Pasta local '${item.local}' não encontrado. Pulando...`)
        continue
      }

      console.log(`Enviando ${item.local}...`)
      const stats = fs.statSync(item.local)
      if (stats.isDirectory()) {
        await client.uploadFromDir(item.local, item.remote)
        continue
      }
      await client.uploadFrom(item.local, item.remote)
    }

    console.log('Deploy do Backend concluído com sucesso.')

    // Forçar reinício do Node.js via tmp/restart.txt (Passenger)
    try {
      await client.ensureDir('tmp')
      const fsNode = await import('node:fs')
      const pathNode = await import('node:path')
      const tempFile = pathNode.join(process.cwd(), 'restart.tmp')
      fsNode.writeFileSync(tempFile, new Date().toISOString())
      await client.uploadFrom(tempFile, 'restart.txt')
      fsNode.unlinkSync(tempFile)
      console.log('Arquivo tmp/restart.txt criado para forçar reinício do servidor.')
    } catch (e) {
      console.log('Não foi possível criar tmp/restart.txt (opcional):', e.message)
    }
  } finally {
    client.close()
  }
}

run().catch((error) => {
  console.error('Falha no deploy do Backend para Hostinger.')
  console.error(error.message)
  process.exit(1)
})
