import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'basic-ftp'

const requiredEnvVars = ['HOSTINGER_FTP_HOST', 'HOSTINGER_FTP_USER', 'HOSTINGER_FTP_PASSWORD']

const getMissingVars = () => requiredEnvVars.filter((key) => !process.env[key]?.trim())

const resolveBoolean = (value, fallback) => {
  if (!value) {
    return fallback
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const run = async () => {
  const missingVars = getMissingVars()
  if (missingVars.length > 0) {
    throw new Error(`Variáveis ausentes: ${missingVars.join(', ')}`)
  }

  const client = new Client()
  client.ftp.verbose = false

  const secure = resolveBoolean(process.env.HOSTINGER_FTP_SECURE, false)
  const remoteBaseDir = (process.env.HOSTINGER_REMOTE_DIR || '/public_html').trim()
  const shouldClean = resolveBoolean(process.env.HOSTINGER_DEPLOY_CLEAN, true)
  const localDist = path.resolve(process.cwd(), 'dist')
  const localHtaccess = path.join(localDist, '.htaccess')

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

    console.log(`Enviando arquivos de ${localDist} para ${remoteBaseDir}...`)
    await client.uploadFromDir(localDist)
    if (fs.existsSync(localHtaccess)) {
      await client.uploadFrom(localHtaccess, '.htaccess')
    }
    console.log('Deploy concluído com sucesso.')
  } finally {
    client.close()
  }
}

run().catch((error) => {
  console.error('Falha no deploy para Hostinger.')
  console.error(error.message)
  process.exit(1)
})
