import { useEffect, useState } from 'react'
import { Star, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { SacredGeometry } from '../components/SacredGeometry'

const services = [
  {
    id: 1,
    title: 'Amarração',
    subtitle: 'Trago seu amor de volta em 7 dias',
    description: 'Poderoso ritual de amarração com técnicas ancestrais para reconectar você com o amor que deseja. Efeitos notáveis em 7 dias.',
    price: 450,
    duration: 'Ritual de 7 dias',
    icon: '💝',
  },
  {
    id: 2,
    title: 'Prosperidade',
    subtitle: 'Abrir as portas da Prosperidade',
    description: 'Trabalho espiritual para atrair abundância, sucesso financeiro e oportunidades em sua vida. Abra as portas para a prosperidade.',
    price: 620,
    duration: 'Trabalho contínuo',
    icon: '🪙',
  },
  {
    id: 3,
    title: 'Quebra de Olho Gordo',
    subtitle: 'Retirar mal que fizeram sobre você',
    description: 'Proteção espiritual contra inveja e mau olhado. Ritual poderoso para neutralizar energias negativas direcionadas a você.',
    price: 590,
    duration: 'Ritual completo',
    icon: '🛡️',
  },
]

export function MagiasPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato selection:bg-mystic-gold/30 selection:text-mystic-gold">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
      <SacredGeometry />

      {/* PAGE SHELL */}
      <PageShell title="Serviços Mágicos" subtitle="Escolha o ritual que melhor se alinha com suas necessidades e desejos.">
        {/* HERO SECTION */}
        <section className="mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mystic-purple-light/30 bg-mystic-purple-light/10 backdrop-blur-sm mb-8">
            <Sparkles className="w-4 h-4 text-mystic-gold" />
            <span className="text-xs uppercase tracking-widest text-mystic-purple-light">Poder Ancestral</span>
          </div>
          
          <h1 className="font-playfair text-5xl md:text-6xl leading-[1.1] mb-6 drop-shadow-2xl">
            Trabalhos <br/>
            <span className="text-gradient-gold italic">Mágicos</span> de <br/>
            Poder Comprovado
          </h1>
          
          <p className="text-lg md:text-xl text-mystic-purple-light mb-8 max-w-2xl leading-relaxed font-light">
            Nossos especialistas realizam rituais ancestrais com poder comprovado. Escolha o trabalho que melhor se alinha com seus objetivos e deixe as energias do universo atuarem em sua verdade.
          </p>
        </section>

        {/* SERVICES GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {services.map((service) => (
            <div key={service.id} className="group relative rounded-2xl glass-panel p-8 border border-mystic-purple-light/20 hover:border-mystic-gold/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              
              {/* Background Glow on Hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-mystic-gold/0 to-mystic-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Icon */}
              <div className="relative z-10 text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">
                {service.icon}
              </div>
              
              {/* Title */}
              <h3 className="relative font-playfair text-3xl text-white mb-2 group-hover:text-mystic-gold transition-colors">
                {service.title}
              </h3>
              
              {/* Subtitle */}
              <p className="relative text-mystic-gold text-sm font-semibold mb-3 italic">
                {service.subtitle}
              </p>
              
              {/* Description */}
              <p className="relative text-mystic-purple-light text-sm mb-6 leading-relaxed">
                {service.description}
              </p>
              
              {/* Duration */}
              <p className="relative text-xs text-mystic-purple-light/60 uppercase tracking-widest mb-8">
                {service.duration}
              </p>

              {/* Divider */}
              <div className="relative w-12 h-px bg-gradient-to-r from-mystic-gold to-transparent mb-6" />

              {/* Price & Button */}
              <div className="relative flex items-end justify-between">
                <div>
                  <p className="text-xs text-mystic-purple-light uppercase tracking-widest">Investimento</p>
                  <p className="font-playfair text-3xl text-mystic-gold font-bold">
                    R$ {service.price.toLocaleString('pt-BR')}
                  </p>
                </div>
                <Link
                  to="/cadastro"
                  className="rounded-full px-6 py-3 bg-mystic-gold text-mystic-black font-bold text-sm uppercase tracking-widest hover:bg-mystic-gold-light transition-colors shadow-gold-glow group-hover:shadow-gold-glow-lg"
                >
                  Contratar
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* INFO SECTION */}
        <section className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-12 mb-20">
          <h2 className="font-playfair text-4xl text-white mb-8 flex items-center gap-3">
            Como Nossos <span className="text-gradient-gold italic">Rituais</span> Funcionam
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Contrate', description: 'Escolha o ritual que deseja receber' },
              { step: '02', title: 'Consulta', description: 'Nosso especialista faz uma leitura energética' },
              { step: '03', title: 'Execução', description: 'Ritual é executado conforme seus objetivos' },
              { step: '04', title: 'Acompanhamento', description: 'Receba atualizações durante o processo' },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-mystic-gold/30 bg-mystic-purple-dark/30 p-6 text-center">
                <p className="font-playfair text-4xl text-mystic-gold mb-3">{item.step}</p>
                <h3 className="font-playfair text-xl text-white mb-3">{item.title}</h3>
                <p className="text-mystic-purple-light text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="text-center">
          <h2 className="font-playfair text-4xl text-white mb-4">Pronto para Transformar sua Vida?</h2>
          <p className="text-mystic-purple-light text-lg mb-8 max-w-2xl mx-auto">
            Contratar um de nossos serviços mágicos é o primeiro passo para atrair as mudanças que você deseja.
          </p>
          <Link
            to="/cadastro"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-mystic-gold to-mystic-gold-light text-mystic-black font-bold uppercase tracking-widest text-sm hover:shadow-gold-glow-lg transition-shadow group"
          >
            Começar Agora
            <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </Link>
        </section>

      </PageShell>
    </div>
  )
}
