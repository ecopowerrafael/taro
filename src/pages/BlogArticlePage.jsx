import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, Calendar, Clock, Tag, User } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { SeoHead } from '../components/SeoHead'
import { blogPosts, getBlogPostBySlug } from '../data/blogPosts'
import { buildAbsoluteUrl } from '../data/siteConfig'

function formatDate(dateString) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateString}T12:00:00`))
}

function buildArticleSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: buildAbsoluteUrl('/logoastria.png'),
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Astria',
      logo: {
        '@type': 'ImageObject',
        url: buildAbsoluteUrl('/logoastria.png'),
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: buildAbsoluteUrl(`/blog/${post.slug}`),
    articleSection: post.category,
    keywords: post.keywords.join(', '),
  }
}

function buildBreadcrumbSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: buildAbsoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: buildAbsoluteUrl('/blog'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: buildAbsoluteUrl(`/blog/${post.slug}`),
      },
    ],
  }
}

function buildFaqSchema(post) {
  if (!post.faq?.length) {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function BlogArticlePage() {
  const { slug } = useParams()
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const relatedPosts = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 3)

  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato">
      <SeoHead
        title={post.seoTitle}
        description={post.description}
        keywords={post.keywords}
        path={`/blog/${post.slug}`}
        type="article"
        structuredData={[buildArticleSchema(post), buildBreadcrumbSchema(post), buildFaqSchema(post)]}
      />
      <PageShell title={post.title} subtitle={post.description}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-3xl border border-mystic-gold/20 bg-black/20 p-6 shadow-glow backdrop-blur-sm md:p-10">
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-mystic-gold/50 bg-mystic-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-mystic-gold">
                {post.category}
              </span>
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-mystic-purple-light/30 px-3 py-1 text-xs text-mystic-purple-light">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mb-8 grid gap-4 border-y border-mystic-purple-light/20 py-4 text-sm text-mystic-purple-light md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-mystic-gold" />
                {formatDate(post.publishedAt)}
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-mystic-gold" />
                {post.author}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-mystic-gold" />
                {post.readTime}
              </div>
            </div>

            <p className="mb-10 text-lg leading-8 text-amber-50/90">{post.intro}</p>

            <div className="space-y-10">
              {post.sections.map((section) => (
                <section key={section.title} className="space-y-4">
                  <h2 className="font-playfair text-3xl text-mystic-goldSoft">{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-8 text-amber-50/85 md:text-lg">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            <section className="mt-12 rounded-3xl border border-mystic-gold/30 bg-mystic-purple-dark/25 p-6 md:p-8">
              <h2 className="font-playfair text-3xl text-white">Proximos passos para transformar essa leitura em acao</h2>
              <p className="mt-4 text-base leading-8 text-amber-50/85">
                Se este tema conversa com o seu momento, o melhor caminho e sair do conteudo geral e partir para uma orientacao personalizada. Na Astria voce pode falar com um especialista, contratar uma magia alinhada ao seu objetivo ou criar sua conta para acompanhar tudo em um so lugar.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <Link to="/consultores" className="rounded-2xl border border-mystic-gold/40 bg-black/25 p-5 transition hover:-translate-y-1 hover:border-mystic-gold hover:bg-black/35">
                  <h3 className="font-playfair text-2xl text-mystic-goldSoft">Falar com consultores</h3>
                  <p className="mt-3 text-sm leading-7 text-mystic-purple-light">Escolha um especialista em tarot, astrologia ou energia e receba uma leitura personalizada.</p>
                </Link>
                <Link to="/magias" className="rounded-2xl border border-mystic-gold/40 bg-black/25 p-5 transition hover:-translate-y-1 hover:border-mystic-gold hover:bg-black/35">
                  <h3 className="font-playfair text-2xl text-mystic-goldSoft">Ver magias</h3>
                  <p className="mt-3 text-sm leading-7 text-mystic-purple-light">Ative um ritual personalizado para amor, protecao, limpeza ou prosperidade.</p>
                </Link>
                <Link to="/cadastro" className="rounded-2xl border border-mystic-gold/40 bg-black/25 p-5 transition hover:-translate-y-1 hover:border-mystic-gold hover:bg-black/35">
                  <h3 className="font-playfair text-2xl text-mystic-goldSoft">Criar conta</h3>
                  <p className="mt-3 text-sm leading-7 text-mystic-purple-light">Cadastre-se para salvar seu progresso, contratar atendimentos e comprar com mais rapidez.</p>
                </Link>
              </div>
            </section>

            <section className="mt-12">
              <div className="mb-6 flex items-center gap-2 text-mystic-goldSoft">
                <Tag className="h-4 w-4" />
                <span className="text-sm uppercase tracking-[0.2em]">Palavras-chave do tema</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {post.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-mystic-purple-light/30 px-4 py-2 text-sm text-mystic-purple-light">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>

            {post.faq?.length ? (
              <section className="mt-12 space-y-5">
                <h2 className="font-playfair text-3xl text-white">Perguntas frequentes</h2>
                {post.faq.map((item) => (
                  <div key={item.question} className="rounded-2xl border border-mystic-purple-light/20 bg-black/20 p-5">
                    <h3 className="text-lg font-semibold text-mystic-goldSoft">{item.question}</h3>
                    <p className="mt-3 text-base leading-7 text-amber-50/85">{item.answer}</p>
                  </div>
                ))}
              </section>
            ) : null}
          </article>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-mystic-gold/25 bg-black/20 p-6 shadow-glow backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-mystic-purple-light">Leitura estrategica</p>
              <h2 className="mt-3 font-playfair text-3xl text-mystic-goldSoft">Converta intuicao em direcao</h2>
              <p className="mt-4 text-sm leading-7 text-amber-50/80">
                Use este artigo como ponto de partida e aprofunde com um consultor que entenda seu caso com contexto real.
              </p>
              <Link to="/consultores" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mystic-gold to-mystic-gold-light px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-mystic-black transition hover:shadow-gold-glow-lg">
                Encontrar consultor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-mystic-gold/25 bg-black/20 p-6 shadow-glow backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-mystic-purple-light">Rituais e trabalhos</p>
              <h2 className="mt-3 font-playfair text-3xl text-mystic-goldSoft">Veja magias alinhadas ao seu objetivo</h2>
              <p className="mt-4 text-sm leading-7 text-amber-50/80">
                Explore rituais para amor, protecao, limpeza e prosperidade com mentores selecionados pela Astria.
              </p>
              <Link to="/magias" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-mystic-gold/50 bg-mystic-gold/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-mystic-gold transition hover:bg-mystic-gold/20">
                Explorar magias
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-mystic-gold/25 bg-black/20 p-6 shadow-glow backdrop-blur-sm">
              <h2 className="font-playfair text-3xl text-white">Leia tambem</h2>
              <div className="mt-5 space-y-4">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.slug} to={`/blog/${relatedPost.slug}`} className="block rounded-2xl border border-mystic-purple-light/20 p-4 transition hover:border-mystic-gold/50 hover:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.18em] text-mystic-purple-light">{relatedPost.category}</p>
                    <h3 className="mt-2 font-playfair text-xl text-mystic-goldSoft">{relatedPost.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-amber-50/75">{relatedPost.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
    </div>
  )
}