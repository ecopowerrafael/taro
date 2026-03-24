import fs from 'node:fs'
import { Client } from 'basic-ftp'
import dotenv from 'dotenv'

dotenv.config()

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
  { local: 'package.json', remote: 'package.json' },
  { local: 'package-lock.json', remote: 'package-lock.json' },
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
    await client.access({
      host: process.env.BACK_FTP_HOST.trim(),
      user: process.env.BACK_FTP_USER.trim(),
      password: process.env.BACK_FTP_PASSWORD,
      secure,
    })

    console.log(`Entrando no diretório: /${remoteBaseDir}`)
    await client.ensureDir(`/${remoteBaseDir}`)
    await client.cd(`/${remoteBaseDir}`)

    if (shouldClean) {
      console.log(`Limpando diretório remoto: /${remoteBaseDir}`)
      await client.clearWorkingDir()
    }

    // Tenta apagar o .htaccess se ele existir, para não dar conflito com o Node.js
    try {
      await client.remove('.htaccess')
      console.log('.htaccess antigo removido do backend.')
    } catch (e) {
      // Ignora se o arquivo não existir
    }

    for (const item of uploadItems) {
      if (!fs.existsSync(item.local)) {
        console.warn(`Aviso: Arquivo/Pasta local '${item.local}' não encontrado. Pulando...`)
        continue
      }

      console.log(`Enviando ${item.local}...`)
      const stats = fs.statSync(item.local)
      if (stats.isDirectory()) {
        // Envia o conteúdo da pasta local para a pasta remota
        await client.uploadFromDir(item.local, item.remote)
        continue
      }
      await client.uploadFrom(item.local, item.remote)
    }

    console.log('Deploy do Backend concluído com sucesso.')
  } finally {
    client.close()
  }
}

run().catch((error) => {
  console.error('Falha no deploy do Backend para Hostinger.')
  console.error(error.message)
  process.exit(1)
})
