import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LockKeyhole, Wallet, Users, Zap, Star, Clock3, ShieldCheck, Sparkles, Moon, ArrowRight, Sun, Eye, Menu, X } from 'lucide-react'
import { usePlatformContext } from '../context/platform-context'
import { DailyTarotCard } from '../components/DailyTarotCard'
import { SacredGeometry } from '../components/SacredGeometry'
import { FloatingCard } from '../components/FloatingCard'
import { buildHeaderLinks, publicNavLinks } from '../utils/navigation'

const benefits = [
  {
    title: 'Clareza Imediata',
    description: 'Respostas rápidas para dúvidas que tiram seu sono.',
    icon: Zap,
  },
  {
    title: 'Especialistas Reais',
    description: 'Profissionais avaliados pela comunidade e pela plataforma.',
    icon: Users,
  },
  {
    title: 'Privacidade Total',
    description: 'Consultas 100% anônimas e seguras via vídeo.',
    icon: LockKeyhole,
  },
  {
    title: 'Economia',
    description: 'Você paga apenas pelos minutos que utilizar.',
    icon: Wallet,
  },
]

const professionalBenefits = [
  { title: 'Flexibilidade Total', description: 'Trabalhe quando e onde quiser', icon: Clock3 },
  { title: 'Pagamento Semanal', description: 'Receba via PIX toda semana', icon: Sparkles },
  { title: 'Suporte Dedicado', description: 'Equipe pronta para te ajudar', icon: ShieldCheck },
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
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }
        setShouldStartCounters(true)
        observer.disconnect()
      },
      { threshold: 0.35 },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [shouldStartCounters])

  const activeConsultants = useCountAnimation({
    start: 25,
    end: 150,
    duration: 3200,
    shouldStart: shouldStartCounters,
  })
  const completedSessions = useCountAnimation({
    start: 1,
    end: 5000,
    duration: 3800,
    shouldStart: shouldStartCounters,
  })
  const completedSessionsText =
    completedSessions < 1000
      ? String(completedSessions).padStart(3, '0')
      : new Intl.NumberFormat('pt-BR').format(completedSessions)
  const stats = [
    { value: `${activeConsultants}+`, label: 'Consultores Ativos' },
    { value: `${completedSessionsText}+`, label: 'Consultas Realizadas' },
    { value: '4.9', label: 'Avaliação Média' },
    { value: '24/7', label: 'Sempre Disponíveis' },
  ]

  const { isAuthenticated } = usePlatformContext()
  const navLinks = buildHeaderLinks({ isAuthenticated, isConsultant: false, isAdmin: false })

  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato selection:bg-mystic-gold/30 selection:text-mystic-gold">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
      <SacredGeometry />
      
      {/* DYNAMIC MOUSE LIGHT (Desktop only) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 hidden md:block"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212,175,55,0.06), transparent 40%)`
        }}
      />

      {/* HEADER */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-3 glass-panel shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'py-6 bg-transparent'}`}>
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer">
            <img src="/logoastria.png" alt="Astria" className="w-8 h-8" />
            <span className="font-playfair text-2xl font-bold tracking-wider text-white">
              Astria
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {publicNavLinks.filter((link) => link.label !== 'Home').map((link) => {
              return (
                <Link key={link.to} to={link.to} className="text-sm uppercase tracking-widest text-mystic-purple-light hover:text-mystic-gold transition-colors duration-300 relative group">
                  {link.label}
                  <span className="absolute -bottom-2 left-0 w-0 h-px bg-mystic-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <Link to="/consultores" className="text-mystic-purple-light hover:text-mystic-gold transition-colors">
                <Eye className="w-5 h-5" />
              </Link>
            ) : null}
            <Link to={isAuthenticated ? '/consultores' : '/cadastro'} className="relative group overflow-hidden rounded-full px-8 py-3 bg-gradient-to-r from-mystic-purple-dark to-mystic-black border border-mystic-gold/50 hover:border-mystic-gold transition-all duration-300 shadow-gold-glow hover:shadow-gold-glow-lg">
              <span className="relative z-10 font-semibold text-sm tracking-widest text-gradient-gold uppercase">
                {isAuthenticated ? 'Ver Consultores' : 'Agendar Sessão'}
              </span>
              <div className="absolute inset-0 w-full h-full bg-mystic-gold opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-mystic-gold" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      <div className={`fixed inset-0 z-40 bg-mystic-black/95 backdrop-blur-xl transition-all duration-500 md:hidden flex flex-col items-center justify-center gap-8 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {navLinks.map((link) => {
          return (
            <Link key={link.to} to={link.to} className="font-playfair text-3xl text-white hover:text-gradient-gold transition-colors" onClick={() => setMobileMenuOpen(false)}>
              {link.label}
            </Link>
          )
        })}
        <Link to={isAuthenticated ? '/consultores' : '/cadastro'} onClick={() => setMobileMenuOpen(false)} className="mt-8 rounded-full px-10 py-4 border border-mystic-gold text-gradient-gold font-bold tracking-widest uppercase">
          {isAuthenticated ? 'Ver Consultores' : 'Entrar / Agendar'}
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <main className="relative z-10 pt-32 pb-20">
        
        {/* HERO SECTION */}
        <section className="container mx-auto px-6 md:px-12 min-h-[80vh] flex flex-col lg:flex-row items-center justify-center relative">
          
          {/* Text Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left z-20 mt-10 lg:mt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mystic-purple-light/30 bg-mystic-purple-light/10 backdrop-blur-sm mb-8 animate-pulse">
              <Sparkles className="w-4 h-4 text-mystic-gold" />
              <span className="text-xs uppercase tracking-widest text-mystic-purple-light">Conecte-se com o Invisível</span>
            </div>
            
            <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl leading-[1.1] mb-6 drop-shadow-2xl">
              Desvende os <br/>
              <span className="text-gradient-gold italic pr-4">Mistérios</span> do<br/>
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
              const Icon = benefit.icon
              return (
                <div key={benefit.title} className="group relative rounded-2xl glass-panel p-6 border border-mystic-purple-light/20 hover:border-mystic-gold/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  
                  {/* Background Glow on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-mystic-gold/0 to-mystic-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 inline-flex rounded-full border border-mystic-gold/50 bg-mystic-gold/10 p-3 mb-4">
                    <Icon className="text-mystic-gold w-6 h-6" />
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
          <div className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-12">
            <h2 className="font-playfair text-4xl text-white mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span>Transforme seu Dom em</span> <span className="text-gradient-gold italic">Carreira</span>
            </h2>
            <p className="text-mystic-purple-light max-w-2xl mb-12">
              Horários flexíveis, pagamentos semanais via PIX e suporte total ao profissional. Junte-se a nossa elite de consultores.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {professionalBenefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <div key={benefit.title} className="group rounded-xl border border-mystic-gold/30 bg-mystic-purple-dark/30 p-6 hover:bg-mystic-purple-dark/60 hover:border-mystic-gold transition-all">
                    <Icon className="w-8 h-8 text-mystic-gold mb-3 group-hover:scale-120 transition-transform" />
                    <h3 className="font-playfair text-xl text-white mb-2">{benefit.title}</h3>
                    <p className="text-mystic-purple-light text-sm">{benefit.description}</p>
                  </div>
                )
              })}
            </div>

            <Link to="/seja-consultor" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-mystic-gold to-mystic-gold-light text-mystic-black font-bold uppercase tracking-widest text-sm hover:shadow-gold-glow-lg transition-shadow group">
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
