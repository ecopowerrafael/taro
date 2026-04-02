import fs from 'node:fs/promises'
import path from 'node:path'
import { blogPosts } from '../src/data/blogPosts.js'
import { getRouteSeo, buildAbsoluteImageUrl, buildAbsoluteUrl, sitemapStaticRoutes, siteConfig } from '../src/data/siteConfig.js'

const distDir = path.resolve(process.cwd(), 'dist')
const templatePath = path.join(distDir, 'index.html')
const apiBaseUrl = (process.env.VITE_API_BASE_URL || siteConfig.siteUrl).replace(/\/$/, '')

const staticContentByRoute = {
  '/': {
    heading: 'Astria: tarot online, astrologia, magias e consultas espirituais',
    body: [
      'A Astria conecta voce a consultores espirituais, especialistas em tarot online, astrologia, orientacao energetica e magias personalizadas.',
      'Escolha consultores, explore rituais e inicie sua jornada espiritual com uma plataforma segura e otimizada para atendimento humano.',
    ],
    ctas: [
      { label: 'Ver consultores', href: '/consultores' },
      { label: 'Explorar magias', href: '/magias' },
      { label: 'Criar conta', href: '/cadastro' },
    ],
  },
  '/blog': {
    heading: 'Blog Astria sobre tarot, astrologia, sonhos, rituais e protecao espiritual',
    body: [
      'Leia artigos otimizados para SEO sobre tarot online, astrologia para iniciantes, significado dos sonhos, protecao espiritual e rituais de prosperidade.',
      'Cada conteudo da Astria foi estruturado para informar, atrair e converter leitores em consultas, cadastros e compras de magias.',
    ],
    ctas: blogPosts.slice(0, 3).map((post) => ({ label: post.title, href: `/blog/${post.slug}` })),
  },
  '/consultores': {
    heading: 'Consultores espirituais online na Astria',
    body: [
      'Compare consultores de tarot, astrologia e orientacao energetica e encontre o especialista ideal para seu momento.',
      'A plataforma Astria oferece consultas online com atendimento humano, praticidade e seguranca.',
    ],
    ctas: [
      { label: 'Criar conta', href: '/cadastro' },
      { label: 'Como funciona', href: '/como-funciona' },
    ],
  },
  '/magias': {
    heading: 'Magias personalizadas e rituais espirituais na Astria',
    body: [
      'Ative magias personalizadas para amor, prosperidade, protecao e limpeza energetica com mentores selecionados.',
      'Escolha um ritual alinhado ao seu objetivo e acompanhe sua experiencia dentro da plataforma Astria.',
    ],
    ctas: [
      { label: 'Ver consultores', href: '/consultores' },
      { label: 'Criar conta', href: '/cadastro' },
    ],
  },
  '/cadastro': {
    heading: 'Cadastre-se na Astria e comece sua jornada espiritual online',
    body: [
      'Crie sua conta para acessar consultores espirituais, tarot online, astrologia, recarga de saldo e magias personalizadas.',
    ],
    ctas: [
      { label: 'Explorar consultores', href: '/consultores' },
      { label: 'Explorar magias', href: '/magias' },
    ],
  },
  '/seja-consultor': {
    heading: 'Seja consultor na Astria',
    body: [
      'Cadastre-se para atender online com tarot, astrologia e orientacao espiritual em uma plataforma com suporte dedicado e pagamentos semanais.',
    ],
    ctas: [{ label: 'Criar cadastro de consultor', href: '/seja-consultor' }],
  },
  '/como-funciona': {
    heading: 'Como funciona a Astria',
    body: [
      'Entenda como contratar consultores, fazer recarga de saldo, entrar em consultas por video e ativar magias personalizadas na Astria.',
    ],
    ctas: [
      { label: 'Ver consultores', href: '/consultores' },
      { label: 'Criar conta', href: '/cadastro' },
    ],
  },
  '/ajuda': {
    heading: 'Central de ajuda Astria',
    body: ['Encontre respostas sobre cadastro, consultas, pagamentos, saldo, magias e atendimento na plataforma Astria.'],
    ctas: [{ label: 'Falar com suporte', href: '/suporte' }],
  },
  '/suporte': {
    heading: 'Suporte Astria',
    body: ['Nossa equipe atende usuarios e consultores com suporte para conta, consultas, pagamentos e uso da plataforma.'],
    ctas: [{ label: 'Entrar em contato', href: '/contato' }],
  },
  '/contato': {
    heading: 'Contato Astria',
    body: ['Entre em contato com a equipe da Astria para suporte, duvidas comerciais e parcerias.'],
    ctas: [{ label: 'Ir para suporte', href: '/suporte' }],
  },
  '/termos': {
    heading: 'Termos de uso da Astria',
    body: ['Consulte as condicoes gerais de uso da plataforma Astria, incluindo consultas espirituais, pagamentos e acesso.'],
    ctas: [{ label: 'Politica de privacidade', href: '/privacidade' }],
  },
  '/privacidade': {
    heading: 'Politica de privacidade da Astria',
    body: ['Entenda como a Astria protege seus dados em consultas espirituais, pagamentos e navegacao pela plataforma.'],
    ctas: [{ label: 'Termos de uso', href: '/termos' }],
  },
}

async function fetchJson(resource, fallback = []) {
  try {
    const response = await fetch(`${apiBaseUrl}${resource}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    return Array.isArray(payload) ? payload : fallback
  } catch (error) {
    console.warn(`[Prerender] Falha ao buscar ${resource}:`, error.message)
    return fallback
  }
}

async function fetchPublicBuildData() {
  const [consultants, spells] = await Promise.all([
    fetchJson('/api/consultants', []),
    fetchJson('/api/spells', []),
  ])

  return {
    consultants,
    spells,
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function slugToDir(route) {
  if (route === '/') {
    return distDir
  }
  return path.join(distDir, route.replace(/^\//, ''))
}

function buildHead({ title, description, keywords, canonicalPath, image, robots = 'index, follow', schemas = [] }) {
  const canonicalUrl = buildAbsoluteUrl(canonicalPath)
  const imageUrl = buildAbsoluteImageUrl(image)

  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="keywords" content="${escapeHtml((keywords || []).join(', '))}" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteConfig.name)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    ...schemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`),
  ].join('\n    ')
}

function buildStaticBody(route) {
  const content = staticContentByRoute[route]
  if (!content) {
    return '<section><h1>Astria</h1></section>'
  }

  return `
    <main style="max-width:960px;margin:0 auto;padding:48px 24px;font-family:Georgia,serif;color:#f5e7c2;background:#120d1b;min-height:100vh;">
      <section style="border:1px solid rgba(197,160,89,.28);border-radius:28px;padding:32px;background:rgba(0,0,0,.22);box-shadow:0 18px 50px rgba(0,0,0,.25);">
        <p style="color:#c5a059;text-transform:uppercase;letter-spacing:.2em;font-size:12px;">Astria</p>
        <h1 style="font-size:42px;line-height:1.15;margin:14px 0 18px;">${escapeHtml(content.heading)}</h1>
        ${content.body.map((paragraph) => `<p style="font-size:18px;line-height:1.8;color:#eadfbf;">${escapeHtml(paragraph)}</p>`).join('')}
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;">
          ${(content.ctas || [])
            .map(
              (cta) => `<a href="${escapeHtml(cta.href)}" style="display:inline-block;border-radius:999px;padding:14px 22px;border:1px solid rgba(197,160,89,.45);color:#c5a059;text-decoration:none;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(cta.label)}</a>`,
            )
            .join('')}
        </div>
      </section>
    </main>`
}

function buildBlogArticleBody(post) {
  return `
    <main style="max-width:1080px;margin:0 auto;padding:48px 24px;font-family:Georgia,serif;color:#f5e7c2;background:#120d1b;min-height:100vh;">
      <article style="border:1px solid rgba(197,160,89,.28);border-radius:28px;padding:32px;background:rgba(0,0,0,.22);box-shadow:0 18px 50px rgba(0,0,0,.25);">
        <p style="color:#c5a059;text-transform:uppercase;letter-spacing:.22em;font-size:12px;">${escapeHtml(post.category)}</p>
        <h1 style="font-size:44px;line-height:1.15;margin:14px 0 16px;">${escapeHtml(post.title)}</h1>
        <p style="font-size:18px;line-height:1.8;color:#eadfbf;">${escapeHtml(post.description)}</p>
        <p style="font-size:14px;line-height:1.7;color:#bfae80;margin-top:10px;">Publicado em ${escapeHtml(post.publishedAt)} por ${escapeHtml(post.author)} • ${escapeHtml(post.readTime)}</p>
        <div style="margin-top:28px;display:flex;flex-wrap:wrap;gap:10px;">
          ${post.tags.map((tag) => `<span style="border:1px solid rgba(197,160,89,.35);border-radius:999px;padding:8px 14px;font-size:13px;color:#d8cda9;">#${escapeHtml(tag)}</span>`).join('')}
        </div>
        <section style="margin-top:30px;">
          <p style="font-size:19px;line-height:1.9;color:#f2e7c8;">${escapeHtml(post.intro)}</p>
          ${post.sections
            .map(
              (section) => `
                <section style="margin-top:34px;">
                  <h2 style="font-size:30px;color:#d6b569;margin-bottom:12px;">${escapeHtml(section.title)}</h2>
                  ${section.paragraphs.map((paragraph) => `<p style="font-size:18px;line-height:1.9;color:#eadfbf;">${escapeHtml(paragraph)}</p>`).join('')}
                </section>`,
            )
            .join('')}
        </section>
        <section style="margin-top:40px;border:1px solid rgba(197,160,89,.25);border-radius:24px;padding:24px;background:rgba(63,34,80,.3);">
          <h2 style="font-size:28px;margin:0 0 12px;">Proximos passos</h2>
          <p style="font-size:18px;line-height:1.8;color:#eadfbf;">Aprofunde este tema com uma consulta espiritual, uma magia personalizada ou criando sua conta na Astria.</p>
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:22px;">
            <a href="/consultores" style="display:inline-block;border-radius:999px;padding:14px 22px;background:#d6b569;color:#140e1c;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Ver consultores</a>
            <a href="/magias" style="display:inline-block;border-radius:999px;padding:14px 22px;border:1px solid rgba(197,160,89,.45);color:#d6b569;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Ver magias</a>
            <a href="/cadastro" style="display:inline-block;border-radius:999px;padding:14px 22px;border:1px solid rgba(197,160,89,.45);color:#d6b569;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Criar conta</a>
          </div>
        </section>
      </article>
    </main>`
}

function buildBlogArticleSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Astria',
      logo: { '@type': 'ImageObject', url: buildAbsoluteUrl('/logoastria.png') },
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: buildAbsoluteUrl(`/blog/${post.slug}`),
    articleSection: post.category,
    keywords: post.keywords.join(', '),
  }
}

function buildConsultantSchema(consultant) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: consultant.name,
    description: consultant.description || consultant.tagline || `Consultor espiritual online da Astria: ${consultant.name}.`,
    image: consultant.photo || buildAbsoluteUrl('/logoastria.png'),
    url: buildAbsoluteUrl(`/consultor/${consultant.id}`),
    knowsAbout: ['tarot online', 'consulta espiritual', 'astrologia', 'orientacao energetica'],
  }
}

function buildSpellSchema(spell) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: spell.title,
    description: spell.shortDescription || spell.description,
    image: buildAbsoluteImageUrl(spell.imageUrl),
    brand: {
      '@type': 'Brand',
      name: 'Astria',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: Number(spell.price || 0).toFixed(2),
      availability: 'https://schema.org/InStock',
      url: buildAbsoluteUrl(`/magias/${spell.id}`),
    },
  }
}

async function readTemplate() {
  return fs.readFile(templatePath, 'utf8')
}

function applyTemplate(template, { headMarkup, bodyMarkup }) {
  const withHead = template
    .replace(/<title>[\s\S]*?<\/title>/i, headMarkup)
    .replace(/<meta name="description"[\s\S]*?\/>/i, '')
    .replace(/<meta name="keywords"[\s\S]*?\/>/i, '')

  return withHead.replace('<div id="root"></div>', `<div id="root">${bodyMarkup}</div>`)
}

async function writeRouteHtml(route, html) {
  const targetDir = slugToDir(route)
  await fs.mkdir(targetDir, { recursive: true })
  await fs.writeFile(path.join(targetDir, 'index.html'), html, 'utf8')
}

async function prerenderStaticRoutes(template) {
  for (const route of sitemapStaticRoutes) {
    const seo = getRouteSeo(route)
    const headMarkup = buildHead({
      title: seo.title || siteConfig.defaultTitle,
      description: seo.description || siteConfig.defaultDescription,
      keywords: seo.keywords || siteConfig.defaultKeywords,
      canonicalPath: route,
      image: siteConfig.defaultImage,
      robots: seo.noindex ? 'noindex, nofollow' : 'index, follow',
    })
    const html = applyTemplate(template, {
      headMarkup,
      bodyMarkup: buildStaticBody(route),
    })
    await writeRouteHtml(route, html)
  }
}

async function prerenderBlogArticles(template) {
  for (const post of blogPosts) {
    const route = `/blog/${post.slug}`
    const headMarkup = buildHead({
      title: post.seoTitle,
      description: post.description,
      keywords: post.keywords,
      canonicalPath: route,
      image: siteConfig.defaultImage,
      robots: 'index, follow',
      schemas: [buildBlogArticleSchema(post)],
    })
    const html = applyTemplate(template, {
      headMarkup,
      bodyMarkup: buildBlogArticleBody(post),
    })
    await writeRouteHtml(route, html)
  }
}

function buildConsultantBody(consultant) {
  return `
    <main style="max-width:1080px;margin:0 auto;padding:48px 24px;font-family:Georgia,serif;color:#f5e7c2;background:#120d1b;min-height:100vh;">
      <article style="border:1px solid rgba(197,160,89,.28);border-radius:28px;padding:32px;background:rgba(0,0,0,.22);box-shadow:0 18px 50px rgba(0,0,0,.25);">
        <p style="color:#c5a059;text-transform:uppercase;letter-spacing:.22em;font-size:12px;">Consultor Astria</p>
        <h1 style="font-size:44px;line-height:1.15;margin:14px 0 16px;">${escapeHtml(consultant.name)}</h1>
        <p style="font-size:18px;line-height:1.8;color:#eadfbf;">${escapeHtml(consultant.tagline || consultant.description || 'Consulta espiritual online com atendimento humano na Astria.')}</p>
        ${consultant.description ? `<p style="font-size:18px;line-height:1.9;color:#eadfbf;margin-top:18px;">${escapeHtml(consultant.description)}</p>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;">
          <span style="border:1px solid rgba(197,160,89,.35);border-radius:999px;padding:10px 16px;font-size:14px;color:#d8cda9;">Video: R$ ${Number(consultant.pricePerMinute || 0).toFixed(2)}/min</span>
          <span style="border:1px solid rgba(197,160,89,.35);border-radius:999px;padding:10px 16px;font-size:14px;color:#d8cda9;">3 perguntas: R$ ${Number(consultant.priceThreeQuestions || 0).toFixed(2)}</span>
          <span style="border:1px solid rgba(197,160,89,.35);border-radius:999px;padding:10px 16px;font-size:14px;color:#d8cda9;">5 perguntas: R$ ${Number(consultant.priceFiveQuestions || 0).toFixed(2)}</span>
        </div>
        <section style="margin-top:40px;border:1px solid rgba(197,160,89,.25);border-radius:24px;padding:24px;background:rgba(63,34,80,.3);">
          <h2 style="font-size:28px;margin:0 0 12px;">Agende sua experiencia</h2>
          <p style="font-size:18px;line-height:1.8;color:#eadfbf;">Converse com este consultor pela Astria, compare outros especialistas ou crie sua conta para contratar com mais rapidez.</p>
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:22px;">
            <a href="/consultor/${escapeHtml(String(consultant.id))}" style="display:inline-block;border-radius:999px;padding:14px 22px;background:#d6b569;color:#140e1c;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Abrir perfil</a>
            <a href="/consultores" style="display:inline-block;border-radius:999px;padding:14px 22px;border:1px solid rgba(197,160,89,.45);color:#d6b569;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Ver consultores</a>
            <a href="/cadastro" style="display:inline-block;border-radius:999px;padding:14px 22px;border:1px solid rgba(197,160,89,.45);color:#d6b569;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Criar conta</a>
          </div>
        </section>
      </article>
    </main>`
}

function buildSpellBody(spell) {
  return `
    <main style="max-width:1080px;margin:0 auto;padding:48px 24px;font-family:Georgia,serif;color:#f5e7c2;background:#120d1b;min-height:100vh;">
      <article style="border:1px solid rgba(197,160,89,.28);border-radius:28px;padding:32px;background:rgba(0,0,0,.22);box-shadow:0 18px 50px rgba(0,0,0,.25);">
        <p style="color:#c5a059;text-transform:uppercase;letter-spacing:.22em;font-size:12px;">Magia personalizada</p>
        <h1 style="font-size:44px;line-height:1.15;margin:14px 0 16px;">${escapeHtml(spell.title)}</h1>
        <p style="font-size:18px;line-height:1.8;color:#eadfbf;">${escapeHtml(spell.shortDescription || spell.description || 'Ritual espiritual personalizado na Astria.')}</p>
        ${spell.description ? `<p style="font-size:18px;line-height:1.9;color:#eadfbf;margin-top:18px;">${escapeHtml(spell.description)}</p>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;">
          <span style="border:1px solid rgba(197,160,89,.35);border-radius:999px;padding:10px 16px;font-size:14px;color:#d8cda9;">Valor: R$ ${Number(spell.price || 0).toFixed(2)}</span>
          ${spell.consultantName ? `<span style="border:1px solid rgba(197,160,89,.35);border-radius:999px;padding:10px 16px;font-size:14px;color:#d8cda9;">Mentor: ${escapeHtml(spell.consultantName)}</span>` : ''}
        </div>
        <section style="margin-top:40px;border:1px solid rgba(197,160,89,.25);border-radius:24px;padding:24px;background:rgba(63,34,80,.3);">
          <h2 style="font-size:28px;margin:0 0 12px;">Ative seu ritual</h2>
          <p style="font-size:18px;line-height:1.8;color:#eadfbf;">Explore esta magia, fale com consultores da Astria e crie sua conta para contratar com rapidez e seguranca.</p>
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:22px;">
            <a href="/magias/${escapeHtml(String(spell.id))}" style="display:inline-block;border-radius:999px;padding:14px 22px;background:#d6b569;color:#140e1c;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Abrir magia</a>
            <a href="/magias" style="display:inline-block;border-radius:999px;padding:14px 22px;border:1px solid rgba(197,160,89,.45);color:#d6b569;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Ver magias</a>
            <a href="/cadastro" style="display:inline-block;border-radius:999px;padding:14px 22px;border:1px solid rgba(197,160,89,.45);color:#d6b569;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Criar conta</a>
          </div>
        </section>
      </article>
    </main>`
}

async function prerenderDynamicConsultants(template, consultants) {
  for (const consultant of consultants) {
    if (!consultant?.id || !consultant?.name) {
      continue
    }

    const route = `/consultor/${consultant.id}`
    const headMarkup = buildHead({
      title: `${consultant.name} | Consultor espiritual online na Astria`,
      description:
        consultant.tagline ||
        consultant.description ||
        `Conheca ${consultant.name}, consultor espiritual online na Astria, e escolha a melhor forma de atendimento para sua consulta.`,
      keywords: [consultant.name, 'consultor espiritual online', 'tarot online', 'consulta espiritual'],
      canonicalPath: route,
      image: consultant.photo || siteConfig.defaultImage,
      robots: 'index, follow',
      schemas: [buildConsultantSchema(consultant)],
    })

    const html = applyTemplate(template, {
      headMarkup,
      bodyMarkup: buildConsultantBody(consultant),
    })

    await writeRouteHtml(route, html)
  }
}

async function prerenderDynamicSpells(template, spells) {
  for (const spell of spells) {
    if (!spell?.id || !spell?.title) {
      continue
    }

    const route = `/magias/${spell.id}`
    const headMarkup = buildHead({
      title: `${spell.title} | Magia personalizada na Astria`,
      description:
        spell.shortDescription ||
        spell.description ||
        `Conheca os detalhes da magia ${spell.title} na Astria.`,
      keywords: [spell.title, 'magia personalizada', 'ritual espiritual', 'Astria magias'],
      canonicalPath: route,
      image: spell.imageUrl || siteConfig.defaultImage,
      robots: 'index, follow',
      schemas: [buildSpellSchema(spell)],
    })

    const html = applyTemplate(template, {
      headMarkup,
      bodyMarkup: buildSpellBody(spell),
    })

    await writeRouteHtml(route, html)
  }
}

async function run() {
  const template = await readTemplate()
  const { consultants, spells } = await fetchPublicBuildData()
  await prerenderStaticRoutes(template)
  await prerenderBlogArticles(template)
  await prerenderDynamicConsultants(template, consultants)
  await prerenderDynamicSpells(template, spells)
  console.log('Prerender estatico das rotas publicas e artigos concluido com sucesso.')
}

run().catch((error) => {
  console.error('Falha ao gerar prerender estatico.')
  console.error(error)
  process.exit(1)
})