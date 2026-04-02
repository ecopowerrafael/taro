import fs from 'node:fs/promises'
import path from 'node:path'
import { SitemapStream, streamToPromise } from 'sitemap'
import { blogPosts } from '../src/data/blogPosts.js'
import { sitemapStaticRoutes, siteConfig } from '../src/data/siteConfig.js'

const distDir = path.resolve(process.cwd(), 'dist')
const sitemapPath = path.join(distDir, 'sitemap.xml')
const robotsPath = path.join(distDir, 'robots.txt')
const apiBaseUrl = (process.env.VITE_API_BASE_URL || siteConfig.siteUrl).replace(/\/$/, '')

async function fetchJson(resource, fallback = []) {
  try {
    const response = await fetch(`${apiBaseUrl}${resource}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    return Array.isArray(payload) ? payload : fallback
  } catch (error) {
    console.warn(`[Sitemap] Falha ao buscar ${resource}:`, error.message)
    return fallback
  }
}

async function fetchPublicRoutesData() {
  const [consultants, spells] = await Promise.all([
    fetchJson('/api/consultants', []),
    fetchJson('/api/spells', []),
  ])

  return {
    consultants,
    spells,
  }
}

async function ensureDist() {
  await fs.mkdir(distDir, { recursive: true })
}

async function writeSitemap() {
  const stream = new SitemapStream({ hostname: siteConfig.siteUrl })
  const { consultants, spells } = await fetchPublicRoutesData()

  sitemapStaticRoutes.forEach((route) => {
    stream.write({ url: route, changefreq: route === '/' ? 'daily' : 'weekly', priority: route === '/' ? 1 : 0.8 })
  })

  blogPosts.forEach((post) => {
    stream.write({
      url: `/blog/${post.slug}`,
      changefreq: 'monthly',
      priority: 0.75,
      lastmodISO: `${post.publishedAt}T12:00:00.000Z`,
    })
  })

  consultants.forEach((consultant) => {
    if (!consultant?.id) {
      return
    }

    stream.write({
      url: `/consultor/${consultant.id}`,
      changefreq: 'weekly',
      priority: 0.7,
    })
  })

  spells.forEach((spell) => {
    if (!spell?.id) {
      return
    }

    stream.write({
      url: `/magias/${spell.id}`,
      changefreq: 'weekly',
      priority: 0.72,
      lastmodISO: spell.updatedAt || spell.createdAt || undefined,
    })
  })

  stream.end()
  const xml = await streamToPromise(stream)
  await fs.writeFile(sitemapPath, xml.toString(), 'utf8')
}

async function writeRobots() {
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /perfil',
    'Disallow: /area-consultor',
    'Disallow: /recarregar',
    'Disallow: /sala',
    '',
    `Sitemap: ${siteConfig.siteUrl}/sitemap.xml`,
  ].join('\n')

  await fs.writeFile(robotsPath, robots, 'utf8')
}

async function run() {
  await ensureDist()
  await writeSitemap()
  await writeRobots()
  console.log('Sitemap e robots.txt gerados com sucesso.')
}

run().catch((error) => {
  console.error('Falha ao gerar sitemap e robots.txt.')
  console.error(error)
  process.exit(1)
})