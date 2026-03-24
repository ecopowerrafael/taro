import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'basic-ftp'
import dotenv from 'dotenv'

dotenv.config()

const requiredEnvVars = ['FRONT_FTP_HOST', 'FRONT_FTP_USER', 'FRONT_FTP_PASSWORD']

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
    throw new Error(`Variáveis de frontend ausentes: ${missingVars.join(', ')}`)
  }

  const client = new Client()
  client.ftp.verbose = true // Ativado para debugar se necessário

  const secure = resolveBoolean(process.env.FTP_SECURE, false)
  const remoteBaseDir = (process.env.FRONT_REMOTE_DIR || 'public_html').trim()
  const shouldClean = resolveBoolean(process.env.DEPLOY_CLEAN, true)
  const localDist = path.resolve(process.cwd(), 'dist')
  const localHtaccess = path.join(process.cwd(), 'public', '.htaccess')

  try {
    console.log(`Conectando ao FTP do Frontend (${process.env.FRONT_FTP_HOST})...`)
    await client.access({
      host: process.env.FRONT_FTP_HOST.trim(),
      user: process.env.FRONT_FTP_USER.trim(),
      password: process.env.FRONT_FTP_PASSWORD,
      secure,
    })

    console.log(`Garantindo diretório remoto: ${remoteBaseDir}`)
    await client.ensureDir(remoteBaseDir)
    // Usamos o caminho absoluto a partir da raiz para evitar erros de CWD relativo
    await client.cd(`/${remoteBaseDir}`)

    if (shouldClean) {
      console.log(`Limpando diretório remoto: ${remoteBaseDir}`)
      await client.clearWorkingDir()
    }

    console.log(`Enviando arquivos de ${localDist} para . (diretório atual)...`)
    await client.uploadFromDir(localDist)
    
    // Tenta enviar o .htaccess da pasta public se existir (útil para roteamento SPA)
    if (fs.existsSync(localHtaccess)) {
      console.log('Enviando .htaccess...')
      await client.uploadFrom(localHtaccess, '.htaccess')
    }
    
    console.log('Deploy do Frontend concluído com sucesso.')
  } finally {
    client.close()
  }
}

run().catch((error) => {
  console.error('Falha no deploy do Frontend para Hostinger.')
  console.error(error.message)
  process.exit(1)
})
