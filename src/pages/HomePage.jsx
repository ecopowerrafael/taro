import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Moon, ArrowRight, Sun, Eye, Menu, X } from 'lucide-react'
import { usePlatformContext } from '../context/platform-context'
import { DailyTarotCard } from '../components/DailyTarotCard'
import { SacredGeometry } from '../components/SacredGeometry'
import { FloatingCard } from '../components/FloatingCard'
import { buildHeaderLinks, publicNavLinks } from '../utils/navigation'

const benefits = [
  {
    title: 'Clareza Imediata',
    description: 'Respostas rápidas para dúvidas que tiram seu sono.',
    image: '/clareza-imediata.png',
  },
  {
    title: 'Especialistas Reais',
    description: 'Profissionais avaliados pela comunidade e pela plataforma.',
    image: '/especialistas-reais.png',
  },
  {
    title: 'Privacidade Total',
    description: 'Consultas 100% anônimas e seguras via vídeo.',
    image: '/privacidade-total.png',
  },
  {
    title: 'Economia',
    description: 'Você paga apenas pelos minutos que utilizar.',
    image: '/economia.png',
  },
]

const professionalBenefits = [
  { title: 'Flexibilidade Total', description: 'Trabalhe quando e onde quiser', image: '/flexibilidade-total.png' },
  { title: 'Pagamento Semanal', description: 'Receba via PIX toda semana', image: '/pagamento-semanal.png' },
  { title: 'Suporte Dedicado', description: 'Equipe pronta para te ajudar', image: '/suporte-dedicado.png' },
]

function useCountAnimation({ start, end, duration, shouldStart }) {
  const [value, setValue] = useState(start)

  useEffect(() => {
    if (!shouldStart) {
      return undefined
    }

    const startedAt = performance.now()
    const tickRate = 1000 / 30

    const timer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      const nextValue = Math.round(start + (end - start) * eased)
      setValue(nextValue)

      if (progress >= 1) {
        window.clearInterval(timer)
      }
    }, tickRate)

    return () => {
      window.clearInterval(timer)
    }
  }, [duration, end, shouldStart, start])

  return value
}

export function HomePage() {
  const statsSectionRef = useRef(null)
  const [shouldStartCounters, setShouldStartCounters] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useEffect(() => {
    const target = statsSectionRef.current
    if (!target || shouldStartCounters) {
      return (
        <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato selection:bg-mystic-gold/30 selection:text-mystic-gold">
          {/* BACKGROUND EFFECTS */}
          <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
          <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url(\"https://www.transparenttextures.com/patterns/stardust.png\")' }} />
          <SacredGeometry />
          {/* HEADER e outros elementos mantidos... */}

          {/* FULLSCREEN DAILY TAROT CARD */}
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-mystic-black/95 backdrop-blur-xl">
            <DailyTarotCard />
          </div>
          {/* O RESTANTE DA PÁGINA FICA ESCONDIDO ENQUANTO A CARTA DO DIA ESTIVER VISÍVEL */}
          {/* Se quiser condicionar, pode usar um state para esconder/exibir o fullpage */}
        </div>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url(\"https://www.transparenttextures.com/patterns/stardust.png\")' }} />
      <SacredGeometry />
      {/* HEADER e outros elementos mantidos... */}

      {/* FULLSCREEN DAILY TAROT CARD */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-mystic-black/95 backdrop-blur-xl">
        <DailyTarotCard />
      </div>

      {/* O RESTANTE DA PÁGINA FICA ESCONDIDO ENQUANTO A CARTA DO DIA ESTIVER VISÍVEL */}
      {/* Se quiser condicionar, pode usar um state para esconder/exibir o fullpage */}
    </div>
              Seu Destino
            </h1>
            
            <p className="text-lg md:text-xl text-mystic-purple-light mb-10 max-w-lg leading-relaxed font-light">
              Consulte os melhores oraculistas em uma plataforma imersiva. Encontre respostas, paz e direção espiritual.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              <Link to={isAuthenticated ? '/consultores' : '/cadastro'} className="rounded-full px-8 py-4 bg-mystic-gold text-mystic-black font-bold text-sm uppercase tracking-widest hover:bg-mystic-gold-light transition-colors shadow-gold-glow flex items-center justify-center gap-2 group">
                {isAuthenticated ? 'Encontrar Consultor' : 'Encontrar Guia'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/consultores" className="rounded-full px-8 py-4 border border-mystic-purple-light/50 text-white font-bold text-sm uppercase tracking-widest hover:bg-mystic-purple-light/10 transition-colors glass-panel flex items-center justify-center">
                Explorar Tarólogos
              </Link>
            </div>
          </div>

          {/* Visual Content (Floating Cards) */}
          <div className="w-full lg:w-1/2 h-[500px] relative hidden md:block z-10 mt-16 lg:mt-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-mystic-gold/20 rounded-full blur-[100px]" />
            <FloatingCard icon={Sun} delay="0s" className="top-[10%] left-[20%] -rotate-12" />
            <FloatingCard icon={Eye} delay="-2s" className="top-[30%] left-[50%] rotate-6 z-20 scale-110" />
            <FloatingCard icon={Moon} delay="-4s" className="top-[50%] left-[15%] rotate-12" />
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="container mx-auto px-6 md:px-12 mt-32 mb-32">
          <h2 className="font-playfair text-3xl md:text-4xl text-white text-center mb-12 flex items-center justify-center gap-3">
            Por que escolher <span className="text-gradient-gold italic">Astria</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {benefits.map((benefit) => {
              return (
                <div key={benefit.title} className="group relative flex flex-col items-center text-center rounded-2xl glass-panel p-6 border border-mystic-purple-light/20 hover:border-mystic-gold/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  
                  {/* Background Glow on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-mystic-gold/0 to-mystic-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 mb-4 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-mystic-gold/35 bg-black/20 p-2 shadow-[0_0_20px_rgba(197,160,89,0.12)]">
                    <img src={benefit.image} alt={benefit.title} className="h-full w-full object-contain" />
                  </div>
                  
                  <h3 className="relative font-playfair text-2xl text-white mb-2 group-hover:text-mystic-gold transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="relative text-mystic-purple-light text-sm">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* STATS SECTION */}
        <section ref={statsSectionRef} className="container mx-auto px-6 md:px-12 mb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group rounded-2xl glass-panel p-8 border border-mystic-purple-light/20 hover:border-mystic-gold/50 transition-all text-center text-center"
              >
                <p className="font-playfair text-5xl text-mystic-gold group-hover:scale-110 transition-transform">
                  {stat.value}
                </p>
                <p className="mt-3 text-mystic-purple-light uppercase tracking-widest text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PROFESSIONALS SECTION */}
        <section className="container mx-auto px-6 md:px-12 mb-32">
          <div className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-12 text-center">
            <h2 className="font-playfair text-4xl text-white mb-4 flex flex-col items-center justify-center sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span>Transforme seu Dom em</span> <span className="text-gradient-gold italic">Carreira</span>
            </h2>
            <p className="text-mystic-purple-light max-w-2xl mb-12 mx-auto">
              Horários flexíveis, pagamentos semanais via PIX e suporte total ao profissional. Junte-se a nossa elite de consultores.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {professionalBenefits.map((benefit) => {
                return (
                  <div key={benefit.title} className="group flex flex-col items-center text-center rounded-xl border border-mystic-gold/30 bg-mystic-purple-dark/30 p-6 hover:bg-mystic-purple-dark/60 hover:border-mystic-gold transition-all">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-mystic-gold/35 bg-black/20 p-2 shadow-[0_0_20px_rgba(197,160,89,0.12)] transition-transform group-hover:scale-105">
                      <img src={benefit.image} alt={benefit.title} className="h-full w-full object-contain" />
                    </div>
                    <h3 className="font-playfair text-xl text-white mb-2">{benefit.title}</h3>
                    <p className="text-mystic-purple-light text-sm">{benefit.description}</p>
                  </div>
                )
              })}
            </div>

            <Link to="/seja-consultor" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-mystic-gold to-mystic-gold-light text-mystic-black font-bold uppercase tracking-widest text-sm hover:shadow-gold-glow-lg transition-shadow group mx-auto">
              Quero Ser Consultor
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative border-t border-mystic-gold/20 bg-mystic-black pt-20 pb-10 overflow-hidden">
        {/* Footer Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-mystic-purple-dark/40 blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Brand */}
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <img src="/logoastria.png" alt="Astria" className="w-8 h-8" />
                <span className="font-playfair text-3xl font-bold text-white">Astria</span>
              </div>
              <p className="text-mystic-purple-light text-sm leading-relaxed mb-6">
                A ponte entre o seu momento atual e o destino que o universo preparou para você.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-playfair text-lg text-white mb-6">Plataforma</h4>
              <ul className="space-y-4">
                {['Consultores', 'Serviços', 'Como Funciona', 'Blog'].map((link, i) => {
                  const paths = {
                    'Consultores': '/consultores',
                    'Serviços': '/magias',
                    'Como Funciona': '/como-funciona',
                    'Blog': '/blog'
                  }
                  return (
                    <li key={i}>
                      <a href={paths[link]} className="text-mystic-purple-light hover:text-mystic-gold text-sm transition-colors flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-mystic-gold/50" /> {link}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Para Consultores */}
            <div>
              <h4 className="font-playfair text-lg text-white mb-6">Para Consultores</h4>
              <ul className="space-y-4">
                {[
                  { name: 'Seja Consultor', path: '/seja-consultor' },
                  { name: 'Área do Consultor', path: '/area-consultor' },
                  { name: 'Suporte', path: '/suporte' }
                ].map((link, i) => (
                  <li key={i}>
                    <a href={link.path} className="text-mystic-purple-light hover:text-mystic-gold text-sm transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-playfair text-lg text-white mb-6">Legal</h4>
              <ul className="space-y-4">
                {[
                  { name: 'Termos de Uso', path: '/termos' },
                  { name: 'Privacidade', path: '/privacidade' },
                  { name: 'Central de Ajuda', path: '/ajuda' },
                  { name: 'Contato', path: '/contato' }
                ].map((link, i) => (
                  <li key={i}>
                    <a href={link.path} className="text-mystic-purple-light hover:text-mystic-gold text-sm transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Copyright & Security */}
          <div className="pt-8 border-t border-mystic-purple-light/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-mystic-purple-light/60 text-xs">
              © {new Date().getFullYear()} Astria. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-mystic-purple-light/60 text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Conexão Segura</span>
              <span className="text-mystic-purple-light/60 text-xs">SSL Criptografado</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
