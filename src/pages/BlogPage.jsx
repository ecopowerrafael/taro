import { PageShell } from '../components/PageShell'
import { SacredGeometry } from '../components/SacredGeometry'
import { Calendar, User, ArrowRight } from 'lucide-react'

const blogPosts = [
  {
    id: 1,
    title: 'Os Segredos do Tarot Revelados',
    excerpt: 'Descubra como funciona a leitura de tarot e como conectar com suas energias pessoais.',
    date: '15 de março de 2026',
    author: 'Mestra Luna',
    category: 'Tarot'
  },
  {
    id: 2,
    title: '5 Rituais de Prosperidade que Funcionam',
    excerpt: 'Aprenda rituais comprovados para atrair abundância e sucesso financeiro em sua vida.',
    date: '12 de março de 2026',
    author: 'Consultor Antonio',
    category: 'Rituais'
  },
  {
    id: 3,
    title: 'Energia Lunar e seus Impactos',
    excerpt: 'Entenda como as fases da lua influenciam suas decisões e energia pessoal.',
    date: '10 de março de 2026',
    author: 'Clarissa Solar',
    category: 'Energia'
  },
  {
    id: 4,
    title: 'Proteção Espiritual Diária',
    excerpt: 'Técnicas simples para se proteger de energias negativas no dia a dia.',
    date: '8 de março de 2026',
    author: 'Mestra Luna',
    category: 'Proteção'
  },
  {
    id: 5,
    title: 'Como Interpretar seus Sonhos',
    excerpt: 'Desvende o significado dos seus sonhos e mensagens do universo.',
    date: '5 de março de 2026',
    author: 'Vidente Maria',
    category: 'Espiritualidade'
  },
  {
    id: 6,
    title: 'Astrologia para Iniciantes',
    excerpt: 'Introdução completa ao mundo da astrologia e seu mapa astral.',
    date: '1 de março de 2026',
    author: 'Astróloga Iris',
    category: 'Astrologia'
  }
]

export function BlogPage() {
  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <SacredGeometry />

      <PageShell title="Blog Astria" subtitle="Conhecimento espiritual e dicas para transformação pessoal">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="group rounded-2xl glass-panel border border-mystic-purple-light/20 hover:border-mystic-gold/50 transition-all overflow-hidden hover:-translate-y-2">
              <div className="p-8 h-full flex flex-col">
                <div className="mb-4 inline-block px-3 py-1 rounded-full border border-mystic-gold/50 bg-mystic-gold/10 text-mystic-gold text-xs uppercase font-semibold tracking-widest">
                  {post.category}
                </div>
                
                <h3 className="font-playfair text-2xl text-white mb-3 group-hover:text-mystic-gold transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-mystic-purple-light text-sm mb-6 line-clamp-3 flex-grow">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-xs text-mystic-purple-light/70 border-t border-mystic-purple-light/20 pt-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {post.author}
                  </div>
                </div>
                
                <button className="w-full rounded-full border border-mystic-gold/50 hover:border-mystic-gold bg-mystic-gold/10 hover:bg-mystic-gold/20 text-mystic-gold px-4 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 group">
                  Ler Artigo
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </PageShell>
    </div>
  )
}
