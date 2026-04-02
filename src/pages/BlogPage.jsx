import { PageShell } from '../components/PageShell'
import { SeoHead } from '../components/SeoHead'
import { SacredGeometry } from '../components/SacredGeometry'
import { buildAbsoluteUrl } from '../data/siteConfig'
import { blogPosts } from '../data/blogPosts'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function formatDate(dateString) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateString}T12:00:00`))
}

function buildBlogCollectionSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog Astria',
    description: 'Artigos sobre tarot online, astrologia, sonhos, rituais, protecao espiritual e magias personalizadas.',
    url: buildAbsoluteUrl('/blog'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: blogPosts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: buildAbsoluteUrl(`/blog/${post.slug}`),
        name: post.title,
      })),
    },
  }
}

export function BlogPage() {
  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato">
      <SeoHead
        title="Blog Astria | Tarot, astrologia, protecao espiritual, sonhos e rituais"
        description="Leia conteudos estrategicos sobre tarot online, astrologia, sonhos, protecao espiritual e rituais com foco em autoconhecimento e conversao."
        keywords={[
          'blog tarot online',
          'blog astrologia',
          'rituais espirituais',
          'protecao espiritual',
          'significado dos sonhos',
        ]}
        path="/blog"
        structuredData={buildBlogCollectionSchema()}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <SacredGeometry />

      <PageShell title="Blog Astria" subtitle="Conteudo estrategico sobre tarot online, astrologia, sonhos, rituais, protecao espiritual e magias personalizadas.">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.id} className="group rounded-2xl glass-panel border border-mystic-purple-light/20 hover:border-mystic-gold/50 transition-all overflow-hidden hover:-translate-y-2">
              <div className="p-8 h-full flex flex-col">
                <div className="mb-4 inline-block px-3 py-1 rounded-full border border-mystic-gold/50 bg-mystic-gold/10 text-mystic-gold text-xs uppercase font-semibold tracking-widest">
                  {post.category}
                </div>
                
                <Link to={`/blog/${post.slug}`} className="block">
                  <h3 className="font-playfair text-2xl text-white mb-3 group-hover:text-mystic-gold transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                
                <p className="text-mystic-purple-light text-sm mb-6 line-clamp-3 flex-grow">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-xs text-mystic-purple-light/70 border-t border-mystic-purple-light/20 pt-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.publishedAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {post.author}
                  </div>
                </div>
                
                <Link to={`/blog/${post.slug}`} className="w-full rounded-full border border-mystic-gold/50 hover:border-mystic-gold bg-mystic-gold/10 hover:bg-mystic-gold/20 text-mystic-gold px-4 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 group">
                  Ler Artigo
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </PageShell>
    </div>
  )
}
