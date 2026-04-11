/**
 * deploy-all.mjs — Deploy unificado para Hostinger (frontend + backend)
 *
 * Uso:
 *   node scripts/deploy-all.mjs            → deploy completo
 *   node scripts/deploy-all.mjs --dry-run  → simula sem enviar arquivos
 *   node scripts/deploy-all.mjs --frontend → somente frontend
 *   node scripts/deploy-all.mjs --backend  → somente backend
 *
 * Variáveis de ambiente necessárias (.env):
 *   FRONT_FTP_HOST, FRONT_FTP_USER, FRONT_FTP_PASSWORD
 *   BACK_FTP_HOST,  BACK_FTP_USER,  BACK_FTP_PASSWORD
 *   FRONT_REMOTE_DIR  (opcional, padrão: detectado automaticamente)
 *   BACK_REMOTE_DIR   (opcional, padrão: detectado automaticamente)
 *   FTP_SECURE        (opcional, padrão: false)
 *   DEPLOY_CLEAN      (opcional, padrão: true — só para o frontend)
 */

import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'basic-ftp'
import dotenv from 'dotenv'

dotenv.config()

// ─── Flags de linha de comando ───────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN    = args.includes('--dry-run')
const ONLY_FRONT = args.includes('--frontend')
const ONLY_BACK  = args.includes('--backend')
const DO_FRONT   = !ONLY_BACK
const DO_BACK    = !ONLY_FRONT

// ─── Helpers ─────────────────────────────────────────────────────────────────
const log  = (...a) => console.log('[deploy]', ...a)
const warn = (...a) => console.warn('[deploy] AVISO:', ...a)
const err  = (...a) => console.error('[deploy] ERRO:', ...a)

const resolveBoolean = (value, fallback) => {
  if (!value) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const stripQuotes = (str = '') => str.trim().replace(/^["']|["']$/g, '')

/**
 * Tenta detectar o diretório raiz da Hostinger.
 * A Hostinger usa /domains/<dominio>/public_html OU /home/<user>/public_html.
 * Testamos os candidatos em ordem e usamos o primeiro que existir.
 */
async function detectRemoteDir(client, hint) {
  if (hint) {
    log(`Usando diretório configurado: ${hint}`)
    return hint
  }

  const candidates = [
    // Hostinger Node.js app root (comum ser uma pasta separada)
    'nodejs',
    // Hostinger Business/Cloud — domínio principal
    'domains',
    // Hostinger shared hosting clássico
    'public_html',
  ]

  for (const candidate of candidates) {
    try {
      await client.cd(`/${candidate}`)
      const list = await client.list()
      // Se "domains" existe e contém subpastas, provavelmente o site está em domains/<dominio>/public_html
      if (candidate === 'domains' && list.length > 0) {
        const firstDomain = list.find(e => e.isDirectory)
        if (firstDomain) {
          const dir = `domains/${firstDomain.name}/public_html`
          log(`Detectado: /${dir}`)
          return dir
        }
      }
      log(`Detectado: /${candidate}`)
      return candidate
    } catch {
      // não existe, tenta próximo
    }
  }

  warn('Não foi possível detectar o diretório remoto. Usando public_html como fallback.')
  return 'public_html'
}

// ─── Deploy do FRONTEND ───────────────────────────────────────────────────────

/**
 * Resolve credenciais FTP do frontend.
 * Prioridade: FRONT_FTP_* → fallback para BACK_FTP_* (mesmo servidor).
 */
function resolveFrontFtp() {
  return {
    host    : (process.env.FRONT_FTP_HOST     || process.env.BACK_FTP_HOST)?.trim(),
    user    : (process.env.FRONT_FTP_USER     || process.env.BACK_FTP_USER)?.trim(),
    password: stripQuotes(process.env.FRONT_FTP_PASSWORD || process.env.BACK_FTP_PASSWORD || ''),
  }
}

async function deployFrontend() {
  const ftp = resolveFrontFtp()
  if (!ftp.host || !ftp.user || !ftp.password) {
    throw new Error('Variáveis FTP ausentes. Defina FRONT_FTP_* ou BACK_FTP_* no .env')
  }

  const localDist     = path.resolve(process.cwd(), 'dist')
  const localHtaccess = path.join(process.cwd(), 'public', '.htaccess')
  const secure        = resolveBoolean(process.env.FTP_SECURE, false)
  const shouldClean   = resolveBoolean(process.env.DEPLOY_CLEAN, true)

  if (!fs.existsSync(localDist)) {
    throw new Error(`Pasta dist/ não encontrada. Execute "npm run build:ui" antes do deploy.`)
  }

  if (DRY_RUN) {
    log('[DRY-RUN] Deploy Frontend simulado.')
    log(`  Origem local : ${localDist}`)
    log(`  Host FTP     : ${ftp.host}`)
    log(`  Usuário FTP  : ${ftp.user}`)
    log(`  Limpar remoto: ${shouldClean}`)
    return
  }

  const client = new Client()
  client.ftp.verbose = false

  try {
    log(`Conectando ao FTP Frontend (${ftp.host})...`)
    await client.access({
      host    : ftp.host,
      user    : ftp.user,
      password: ftp.password,
      secure,
    })

    const remoteBase = await detectRemoteDir(client, process.env.FRONT_REMOTE_DIR?.trim())
    const remoteDir  = remoteBase // Removido o sufixo /dist para deploy na raiz

    log(`Garantindo diretório remoto: /${remoteDir}`)
    await client.ensureDir(`/${remoteDir}`)
    await client.cd(`/${remoteDir}`)

    if (shouldClean) {
      log('Limpando diretório remoto (preservando arquivos essenciais e backend)...')
      await clearDirSafe(client)
    }

    log(`Enviando arquivos de ${localDist}...`)
    await client.uploadFromDir(localDist)

    // Garante que a pasta planets/ existe no servidor (protegida de limpeza futura)
    const remotePlanets = `/${remoteDir}/planets`
    log(`Garantindo pasta protegida: ${remotePlanets}`)
    await client.ensureDir(remotePlanets)
    // Volta para o diretório dist após ensureDir
    await client.cd(`/${remoteDir}`)

    if (fs.existsSync(localHtaccess)) {
      log('Enviando .htaccess...')
      await client.uploadFrom(localHtaccess, '.htaccess')
    }

    log('Frontend: deploy concluído.')
  } finally {
    client.close()
  }
}

/**
 * Remove todos os arquivos e pastas do diretório remoto atual,
 * EXCETO arquivos protegidos (extensões ou nomes específicos) e pastas de backend.
 */
// Diretórios e arquivos remotos que NUNCA devem ser apagados no deploy do frontend
const PRESERVED_EXTENSIONS = ['.apk']
const PRESERVED_NAMES      = new Set(['server.js', 'package.json', 'package-lock.json', '.env', 'server.mjs'])
const PRESERVED_DIRS       = new Set(['planets', 'api', 'node_modules', 'tmp', '.git'])

async function clearDirSafe(client) {
  const entries = await client.list()
  for (const entry of entries) {
    // Preservar arquivos por extensão (.apk)
    if (PRESERVED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      log(`Preservando arquivo por extensão: ${entry.name}`)
      continue
    }
    // Preservar arquivos por nome exato
    if (PRESERVED_NAMES.has(entry.name)) {
      log(`Preservando arquivo protegido: ${entry.name}`)
      continue
    }
    // Preservar pastas protegidas (planets, api, node_modules, etc.)
    if (entry.isDirectory && PRESERVED_DIRS.has(entry.name)) {
      log(`Preservando pasta protegida: ${entry.name}/`)
      continue
    }
    
    // Se chegou aqui, remove
    try {
      if (entry.isDirectory) {
        await client.removeDir(entry.name)
      } else {
        await client.remove(entry.name)
      }
    } catch (e) {
      warn(`Falha ao remover ${entry.name}: ${e.message}`)
    }
  }
}

// ─── Deploy do BACKEND ────────────────────────────────────────────────────────

/**
 * Lista de itens a enviar.
 * { local, remote, isDir?, protected? }
 * Arquivos marcados como protected são pulados se já existirem no servidor.
 *
 * NOTA: arquivos .env NÃO são enviados — as variáveis de ambiente são
 * gerenciadas pelo painel da Hostinger (hPanel → Node.js → Environment Variables).
 */
const BACKEND_UPLOAD_ITEMS = [
  { local: 'api',                               remote: 'api',                               isDir: true },
  { local: 'package.json',                      remote: 'package.json' },
  { local: 'package-lock.json',                 remote: 'package-lock.json' },
  { local: 'server.js',                         remote: 'server.js' },
  // Arquivo protegido: só enviado se NÃO existir remotamente (primeiro deploy)
  { local: 'api/firebase-service-account.json', remote: 'api/firebase-service-account.json', protected: true },
]

/**
 * Verifica se um arquivo já existe no servidor.
 */
async function remoteExists(client, remotePath) {
  try {
    await client.size(remotePath)
    return true
  } catch {
    return false
  }
}

async function deployBackend() {
  const required = ['BACK_FTP_HOST', 'BACK_FTP_USER', 'BACK_FTP_PASSWORD']
  const missing  = required.filter(k => !process.env[k]?.trim())
  if (missing.length) throw new Error(`Variáveis de backend ausentes: ${missing.join(', ')}`)

  const secure = resolveBoolean(process.env.FTP_SECURE, false)

  if (DRY_RUN) {
    log('[DRY-RUN] Deploy Backend simulado.')
    log(`  Host FTP: ${process.env.BACK_FTP_HOST}`)
    for (const item of BACKEND_UPLOAD_ITEMS) {
      if (!fs.existsSync(item.local)) { log(`  [SKIP] ${item.local} (não encontrado localmente)`); continue }
      if (item.protected) { log(`  [PROTEGIDO] ${item.remote} (só enviado no 1º deploy)`); continue }
      log(`  [UPLOAD] ${item.local} → ${item.remote}`)
    }
    return
  }

  const client = new Client()
  client.ftp.verbose = false

  try {
    log(`Conectando ao FTP Backend (${process.env.BACK_FTP_HOST})...`)
    await client.access({
      host    : process.env.BACK_FTP_HOST.trim(),
      user    : process.env.BACK_FTP_USER.trim(),
      password: stripQuotes(process.env.BACK_FTP_PASSWORD),
      secure,
    })

    const remoteBase = await detectRemoteDir(client, process.env.BACK_REMOTE_DIR?.trim())

    log(`Entrando no diretório: /${remoteBase}`)
    await client.ensureDir(`/${remoteBase}`)
    await client.cd(`/${remoteBase}`)

    for (const item of BACKEND_UPLOAD_ITEMS) {
      if (!fs.existsSync(item.local)) {
        warn(`Arquivo/Pasta local '${item.local}' não encontrado. Pulando...`)
        continue
      }

      // Arquivos protegidos: só envia se NÃO existirem no servidor
      if (item.protected) {
        const exists = await remoteExists(client, item.remote)
        if (exists) {
          warn(`Arquivo protegido '${item.remote}' já existe no servidor. Pulando (preservando dados de produção).`)
          continue
        }
        log(`Primeiro deploy: enviando arquivo protegido '${item.local}'...`)
      } else {
        log(`Enviando ${item.local}...`)
      }

      const stats = fs.statSync(item.local)
      if (stats.isDirectory()) {
        await client.uploadFromDir(item.local, item.remote)
      } else {
        await client.uploadFrom(item.local, item.remote)
      }
    }

    log('Backend: deploy concluído. Reiniciando servidor...')
    await restartServer(client)

  } finally {
    client.close()
  }
}

/**
 * Reinicia o servidor Node.js no Hostinger via Passenger (tmp/restart.txt).
 */
async function restartServer(client) {
  try {
    await client.ensureDir('tmp')
    const tempFile = path.join(process.cwd(), '_restart.tmp')
    fs.writeFileSync(tempFile, new Date().toISOString())
    await client.uploadFrom(tempFile, 'tmp/restart.txt')
    fs.unlinkSync(tempFile)
    log('Arquivo tmp/restart.txt enviado — servidor será reiniciado pelo Passenger.')
  } catch (e) {
    warn(`Não foi possível criar tmp/restart.txt: ${e.message}`)
    warn('Reinicie o servidor manualmente via painel Hostinger ou SSH (pm2 restart).')
  }
}

// ─── Ponto de entrada ─────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) log('=== MODO DRY-RUN: nenhum arquivo será enviado ===')

  const steps = []
  if (DO_FRONT) steps.push({ name: 'Frontend', fn: deployFrontend })
  if (DO_BACK)  steps.push({ name: 'Backend',  fn: deployBackend })

  for (const step of steps) {
    log(`\n=== Iniciando deploy: ${step.name} ===`)
    try {
      await step.fn()
    } catch (e) {
      err(`Falha no deploy do ${step.name}:`, e.message)
      process.exit(1)
    }
  }

  log('\n=== Deploy finalizado com sucesso! ===')
}

main()
