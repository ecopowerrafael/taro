import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LockKeyhole, Wallet, Users, Zap, Star, Clock3, ShieldCheck, Sparkles } from 'lucide-react'
import { usePlatformContext } from '../context/platform-context'
import { DailyTarotCard } from '../components/DailyTarotCard'

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-mystic-gradient px-4 py-8 text-amber-50 md:px-8">
      <div className="galaxy-stars"></div>
      <div className="galaxy-orb galaxy-orb--one"></div>
      <div className="galaxy-orb galaxy-orb--two"></div>
      <div className="galaxy-orb galaxy-orb--three"></div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-xl2 border border-mystic-gold/50 bg-gradient-to-br from-mystic-purple/70 via-[#1f0f38]/70 to-[#0b0715]/70 px-6 py-8 shadow-glow backdrop-blur-xl">
          <div className="grid items-center gap-6 md:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Astria"
                  className="h-11 w-11 rounded-xl border border-mystic-gold/40 bg-black/35 object-contain p-1"
                />
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/60">Astria</p>
              </div>
              <h1 className="mt-2 font-display text-5xl leading-tight text-mystic-goldSoft md:text-6xl">
                Sua primeira resposta está a um clique
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-amber-100/85">
                {isAuthenticated 
                  ? 'Bem-vindo de volta! Explore os consultores disponíveis agora.' 
                  : 'Cadastre-se agora e encontre o consultor ideal para você.'}
              </p>
              <div className="group mt-5 w-full max-w-sm">
                <div className="rounded-2xl border border-mystic-gold/80 bg-gradient-to-br from-mystic-gold/25 via-transparent to-mystic-gold/10 p-[2px] shadow-[0_0_30px_rgba(197,160,89,0.25)] transition duration-500 group-hover:scale-[1.01] group-hover:shadow-[0_0_45px_rgba(197,160,89,0.38)]">
                  <div className="rounded-2xl bg-[#140a24]/90 p-2">
                    <img
                      src="/astrologa.png"
                      alt="Astróloga da plataforma"
                      className="h-64 w-full rounded-xl object-cover object-top md:h-72"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link
                    to="/consultores"
                    className="rounded-lg border border-mystic-gold/80 bg-gradient-to-r from-mystic-gold/90 to-amber-500/85 px-5 py-3 font-medium text-black shadow-[0_8px_26px_rgba(197,160,89,0.28)] transition hover:-translate-y-0.5 hover:brightness-110"
                  >
                    Ver Consultores
                  </Link>
                ) : (
                  <Link
                    to="/cadastro"
                    className="rounded-lg border border-mystic-gold/80 bg-gradient-to-r from-mystic-gold/90 to-amber-500/85 px-5 py-3 font-medium text-black shadow-[0_8px_26px_rgba(197,160,89,0.28)] transition hover:-translate-y-0.5 hover:brightness-110"
                  >
                    Criar Minha Conta
                  </Link>
                )}
                <Link
                  to="/seja-consultor"
                  className="rounded-lg border border-mystic-gold/60 bg-black/25 px-5 py-3 font-medium text-mystic-goldSoft transition hover:-translate-y-0.5 hover:bg-mystic-gold/10"
                >
                  Para Profissionais
                </Link>
              </div>
            </div>
            <div className="hidden flex-col gap-6 md:flex">
              <div className="rounded-2xl border border-mystic-gold/25 bg-black/20 p-6 text-center backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/60">Conexão Cósmica</p>
                <p className="mt-4 font-display text-4xl text-mystic-goldSoft">Consultas de Tarot ao vivo</p>
                <p className="mt-3 text-sm leading-relaxed text-amber-100/80">
                  Sessões com especialistas reais, cobrança transparente por minuto e privacidade total.
                </p>
              </div>
              <DailyTarotCard />
            </div>
          </div>
        </header>

        <section className="rounded-xl2 border border-mystic-gold/30 bg-mystic-purple/45 p-6 shadow-glow backdrop-blur-md">
          <h2 className="font-display text-4xl text-mystic-goldSoft">Como as Consultas te Ajudam</h2>
          <p className="mt-2 max-w-3xl text-amber-100/80">
            Descubra por que milhares de pessoas confiam em nossos consultores para transformar suas vidas.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <article
                  key={benefit.title}
                  className="group relative overflow-hidden rounded-xl border border-mystic-gold/30 bg-gradient-to-br from-black/35 via-[#130a21]/70 to-black/35 p-5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-mystic-gold/65 hover:shadow-[0_18px_45px_rgba(197,160,89,0.20)]"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-mystic-gold/10 to-transparent transition duration-700 group-hover:translate-x-full"></div>
                  <div className="relative mb-3 inline-flex rounded-full border border-mystic-gold/50 bg-mystic-gold/10 p-2">
                    <Icon className="text-mystic-goldSoft" size={18} />
                  </div>
                  <h3 className="relative font-display text-2xl text-mystic-goldSoft">{benefit.title}</h3>
                  <p className="relative mt-2 text-sm text-amber-100/80">{benefit.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section
          ref={statsSectionRef}
          className="rounded-xl2 border border-mystic-gold/30 bg-mystic-purple/45 p-6 shadow-glow backdrop-blur-md"
        >
          <h2 className="font-display text-4xl text-mystic-goldSoft">Transforme seu Dom em Carreira</h2>
          <p className="mt-2 max-w-3xl text-amber-100/80">
            Horários flexíveis, pagamentos semanais via PIX e suporte total ao profissional. Junte-se a
            nossa elite de consultores.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {professionalBenefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <article
                  key={benefit.title}
                  className="group rounded-xl border border-mystic-gold/30 bg-gradient-to-br from-black/40 via-[#140b26]/70 to-black/30 p-5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-mystic-gold/65 hover:shadow-[0_20px_45px_rgba(197,160,89,0.20)]"
                >
                  <div className="flex justify-center">
                    <Icon className="text-mystic-goldSoft transition duration-300 group-hover:scale-110" size={18} />
                  </div>
                  <h3 className="mt-3 font-display text-2xl text-mystic-goldSoft">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-amber-100/80">{benefit.description}</p>
                </article>
              )
            })}
          </div>
          <Link
            to="/seja-consultor"
            className="mt-6 inline-flex rounded-lg border border-mystic-gold/60 px-5 py-3 font-medium text-mystic-goldSoft transition hover:bg-mystic-gold/10"
          >
            Quero ser Consultor
          </Link>
        </section>

        <section className="rounded-xl2 border border-mystic-gold/30 bg-mystic-purple/45 p-6 shadow-glow backdrop-blur-md">
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group rounded-xl border border-mystic-gold/30 bg-gradient-to-br from-black/45 via-[#12091f]/75 to-black/35 p-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-mystic-gold/70 hover:shadow-[0_22px_50px_rgba(197,160,89,0.22)]"
              >
                <p className="font-display text-4xl text-mystic-goldSoft transition duration-300 group-hover:scale-[1.04]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-amber-100/75">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="rounded-xl2 border border-mystic-gold/30 bg-mystic-purple/45 p-6 shadow-glow backdrop-blur-md">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Astria"
                className="h-10 w-10 rounded-lg border border-mystic-gold/35 bg-black/30 object-contain p-1"
              />
              <p className="text-xs uppercase tracking-[0.25em] text-amber-100/60">Astria</p>
            </div>
            <p className="mt-2 text-sm text-amber-100/80">
              Conectando você ao universo através dos melhores consultores espirituais.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium text-mystic-goldSoft">Plataforma</p>
              <div className="flex flex-col gap-2 text-sm text-amber-100/80">
                <Link to="/consultores" className="hover:text-mystic-goldSoft">
                  Encontrar Consultor
                </Link>
                <Link to="/cadastro" className="hover:text-mystic-goldSoft">
                  Criar Conta
                </Link>
                <Link to="/entrar" className="hover:text-mystic-goldSoft">
                  Entrar
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-mystic-goldSoft">Para Consultores</p>
              <div className="flex flex-col gap-2 text-sm text-amber-100/80">
                <Link to="/seja-consultor" className="hover:text-mystic-goldSoft">
                  Seja um Consultor
                </Link>
                <Link to="/area-consultor" className="hover:text-mystic-goldSoft">
                  Área do Consultor
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-mystic-goldSoft">Legal</p>
              <div className="flex flex-col gap-2 text-sm text-amber-100/80">
                <Link to="/termos" className="hover:text-mystic-goldSoft">
                  Termos de Uso
                </Link>
                <Link to="/privacidade" className="hover:text-mystic-goldSoft">
                  Política de Privacidade
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 border-t border-mystic-gold/20 pt-4 text-xs text-amber-100/70">
            <Star size={14} className="text-mystic-goldSoft" />
            Astria
          </div>
        </footer>
      </div>
    </main>
  )
}
