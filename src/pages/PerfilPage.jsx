import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Pencil, Wallet, X } from 'lucide-react'
import { motion as Motion } from 'framer-motion'
import { AuthProfileForm } from '../components/AuthProfileForm'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

// ─── Mapa de signos ──────────────────────────────────────────────────────────
const SIGNO_MAP = {
  'Áries':      { symbol: '♈', elemento: 'fogo' },
  'Touro':      { symbol: '♉', elemento: 'terra' },
  'Gêmeos':     { symbol: '♊', elemento: 'ar' },
  'Câncer':     { symbol: '♋', elemento: 'agua' },
  'Leão':       { symbol: '♌', elemento: 'fogo' },
  'Virgem':     { symbol: '♍', elemento: 'terra' },
  'Libra':      { symbol: '♎', elemento: 'ar' },
  'Escorpião':  { symbol: '♏', elemento: 'agua' },
  'Sagitário':  { symbol: '♐', elemento: 'fogo' },
  'Capricórnio':{ symbol: '♑', elemento: 'terra' },
  'Aquário':    { symbol: '♒', elemento: 'ar' },
  'Peixes':     { symbol: '♓', elemento: 'agua' },
}

const ELEMENTO_COLORS = {
  fogo:  { primary: '#FF6B35', glow: 'rgba(255,107,53,0.55)' },
  terra: { primary: '#C5A059', glow: 'rgba(197,160,89,0.55)' },
  ar:    { primary: '#87CEEB', glow: 'rgba(135,206,235,0.55)' },
  agua:  { primary: '#4A90D9', glow: 'rgba(74,144,217,0.55)' },
}

// ─── Componente SVG luxuoso do signo ─────────────────────────────────────────
function SignSeal({ signLabel, size = 120 }) {
  const data = SIGNO_MAP[signLabel]
  if (!data) return null
  const palette = ELEMENTO_COLORS[data.elemento]
  const id = `seal-${signLabel}-${size}`
  return (
    <Motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className="overflow-visible drop-shadow-[0_0_24px_rgba(197,160,89,0.35)]"
      animate={{ scale: [1, 1.04, 1], rotate: [0, 1.5, -1.5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={`${palette.primary}50`} />
          <stop offset="70%" stopColor="#1A0B2E" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
        <linearGradient id={`gold-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7CC" />
          <stop offset="45%" stopColor="#E0C27A" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* fundo */}
      <circle cx="60" cy="60" r="50" fill={`url(#bg-${id})`} />
      {/* anel externo dourado */}
      <circle cx="60" cy="60" r="52" fill="none" stroke={`url(#gold-${id})`} strokeWidth="2.2" />
      {/* anel interno sutil */}
      <circle cx="60" cy="60" r="43" fill="none" stroke={`${palette.primary}55`} strokeWidth="1" />
      {/* ornamento topo */}
      <path d="M60 12 L63 20 L72 20 L65 25 L68 34 L60 29 L52 34 L55 25 L48 20 L57 20 Z"
        fill={`url(#gold-${id})`} opacity="0.9" />
      {/* ornamento base */}
      <path d="M60 108 L63 100 L72 100 L65 95 L68 86 L60 91 L52 86 L55 95 L48 100 L57 100 Z"
        fill={`url(#gold-${id})`} opacity="0.9" />
      {/* glifo central */}
      <text x="60" y="72" textAnchor="middle" fontSize="48" fontWeight="700"
        fill={`url(#gold-${id})`} filter={`url(#glow-${id})`}>
        {data.symbol}
      </text>
    </Motion.svg>
  )
}

// ─── Estrelas de fundo ────────────────────────────────────────────────────────
function MiniStars() {
  const stars = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 2 + 0.6,
      d: Math.random() * 4,
      dur: Math.random() * 3 + 2,
    }))
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.current.map((s) => (
        <Motion.div key={s.id}
          className="absolute rounded-full bg-stardust-gold"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }}
          animate={{ opacity: [0.1, 0.85, 0.1], scale: [1, 1.4, 1] }}
          transition={{ duration: s.dur, delay: s.d, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export function PerfilPage() {
  const {
    profile,
    sign,
    minutesBalance,
    updateProfile,
    logout,
    authLoading,
    isAuthenticated,
    questionRequests,
  } = usePlatformContext()
  const navigate = useNavigate()
  const [seenAnswerIds, setSeenAnswerIds] = useState(new Set())
  const [editModalOpen, setEditModalOpen] = useState(false)
  const seenStorageKey = `astria_answers_seen_${profile?.id || profile?.email || 'anon'}`

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/entrar')
    }
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (!profile) return
    try {
      const raw = localStorage.getItem(seenStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setSeenAnswerIds(new Set(parsed))
      }
    } catch {
      // Ignora storage inválido
    }
  }, [profile, seenStorageKey])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (authLoading) {
    return (
      <PageShell title="Carregando..." subtitle="">
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-mystic-gold border-t-transparent" />
        </div>
      </PageShell>
    )
  }

  if (!profile) return null

  const myAnswers = questionRequests.filter(
    (request) => request.customerEmail === profile.email && request.status === 'answered'
  )

  const unreadAnswersCount = myAnswers.filter((answer) => !seenAnswerIds.has(answer.id)).length

  const saldoFormatado = minutesBalance != null
    ? `R$ ${Number(minutesBalance).toFixed(2).replace('.', ',')}`
    : '–'

  const signData = sign ? SIGNO_MAP[sign] : null

  // ─── Menu de navegação ────────────────────────────────────────────────────
  const menuItems = [
    { label: 'Mapa Astral',   icon: '/mapa-astral.png',          to: '/mapa-astral',      external: false },
    { label: 'Sincronia',     icon: '/almas.png',                 to: '/sincronicidade',   external: false },
    { label: 'Especialistas', icon: '/especialistas-reais.png',   to: '/consultores',      external: false },
    { label: 'Respostas',     icon: '/respostas.png',             to: '/respostas',        external: false,
      badgeCount: unreadAnswersCount > 0 ? unreadAnswersCount : myAnswers.length,
      badgeTone: unreadAnswersCount > 0 ? 'green' : 'red' },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-mystic-black">
      {/* Fundo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(46,2,73,0.65),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_90%,rgba(74,144,217,0.06),transparent)]" />
      </div>
      <MiniStars />

      <PageShell title="" subtitle="">
        <div className="mx-auto max-w-lg px-4 pb-36 pt-2">

          {/* ── HERO: Selo + Nome + Saldo ───────────────────────────── */}
          <div className="mb-8 grid grid-cols-[minmax(0,1fr)_150px] items-center gap-4 rounded-[28px] border border-stardust-gold/20 bg-[rgba(10,0,20,0.42)] px-4 py-4 shadow-[0_0_40px_rgba(197,160,89,0.08)] backdrop-blur-md sm:grid-cols-[minmax(0,1fr)_180px]">
            <div className="flex min-w-0 items-center gap-3">
              {signData ? (
                <div className="shrink-0">
                  <SignSeal signLabel={sign} size={104} />
                </div>
              ) : (
                <Motion.div
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-mystic-purple/40 text-4xl text-stardust-gold/50 shadow-[0_0_26px_rgba(197,160,89,0.18)]"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  ✦
                </Motion.div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-display text-xl text-mystic-goldSoft drop-shadow-[0_0_12px_rgba(197,160,89,0.4)] sm:text-2xl">
                    {profile.name}
                  </h2>
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stardust-gold/10 text-stardust-gold transition hover:bg-stardust-gold/20 hover:text-mystic-goldSoft"
                    aria-label="Editar perfil"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                {sign && (
                  <p className="mt-1 text-[11px] tracking-[0.22em] uppercase text-ethereal-silver/50">{sign}</p>
                )}
              </div>
            </div>

            <Motion.div
              className="relative overflow-hidden rounded-2xl border border-stardust-gold/30 bg-[rgba(10,0,20,0.78)] px-4 py-4 text-center shadow-[0_0_30px_rgba(197,160,89,0.12)] backdrop-blur-md"
              animate={{ boxShadow: ['0 0 18px rgba(197,160,89,0.10)', '0 0 34px rgba(197,160,89,0.22)', '0 0 18px rgba(197,160,89,0.10)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Motion.div
                className="pointer-events-none absolute inset-0"
                animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{ background: 'linear-gradient(90deg, transparent 30%, rgba(255,247,204,0.08) 50%, transparent 70%)', backgroundSize: '300%' }}
              />
              <div className="relative flex items-center justify-center gap-2">
                <Wallet size={15} className="text-stardust-gold/70" />
                <span className="text-[10px] tracking-[0.22em] uppercase text-stardust-gold/60">Saldo</span>
              </div>
              <div className="relative mt-1 font-display text-2xl font-bold text-mystic-goldSoft drop-shadow-[0_0_10px_rgba(197,160,89,0.6)] sm:text-3xl">
                {saldoFormatado}
              </div>
              <Motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/recarregar')}
                className="relative mt-2 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#E0C27A] to-[#C5A059] px-4 py-1.5 text-[11px] font-bold tracking-widest text-mystic-black shadow-[0_0_14px_rgba(197,160,89,0.4)]"
              >
                + Recarregar
              </Motion.button>
            </Motion.div>
          </div>

          {/* ── MENU GRID 2×2 ──────────────────────────────────────── */}
          <div className="mb-8 grid grid-cols-2 gap-3">
            {menuItems.map((item) => {
              const inner = (
                <Motion.div
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative flex flex-col items-center gap-2 rounded-2xl border border-stardust-gold/30 bg-[rgba(26,11,46,0.70)] py-5 px-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md transition hover:border-stardust-gold/60 hover:bg-[rgba(46,22,79,0.75)]"
                >
                  {item.badgeCount !== undefined && (
                    <span
                      className={`absolute right-2 top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[10px] font-bold leading-none ${
                        item.badgeTone === 'green'
                          ? 'border-emerald-300/70 bg-emerald-500 text-white'
                          : 'border-red-300/70 bg-red-500 text-white'
                      }`}
                    >
                      {item.badgeCount > 99 ? '99+' : item.badgeCount}
                    </span>
                  )}
                  <img src={item.icon} alt={item.label} className="h-16 w-16 object-contain drop-shadow-[0_0_18px_rgba(197,160,89,0.85)] sm:h-20 sm:w-20" />
                  <span className="text-center text-[11px] font-medium tracking-widest uppercase text-mystic-goldSoft/80">{item.label}</span>
                </Motion.div>
              )
              return <Link key={item.label} to={item.to}>{inner}</Link>
            })}
          </div>

          <section className="mb-8 flex justify-center">
            <Motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm text-red-400 transition hover:bg-red-500/20"
            >
              <LogOut size={14} /> Sair da Conta
            </Motion.button>
          </section>

        </div>
      </PageShell>

      {editModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setEditModalOpen(false)} />
          <Motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-stardust-gold/30 bg-[linear-gradient(180deg,rgba(26,11,46,0.94),rgba(5,5,5,0.96))] shadow-[0_0_40px_rgba(197,160,89,0.18)]"
          >
            <div className="flex items-center justify-between border-b border-stardust-gold/15 px-5 py-4">
              <div>
                <p className="font-display text-xl text-mystic-goldSoft">Editar Perfil</p>
                <p className="text-[11px] tracking-[0.18em] uppercase text-ethereal-silver/40">Ajuste seus dados pessoais</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stardust-gold/10 text-stardust-gold transition hover:bg-stardust-gold/20"
                aria-label="Fechar modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto p-1">
              <AuthProfileForm
                profile={profile}
                sign={sign}
                onUpdate={async (payload) => {
                  await updateProfile(payload)
                  setEditModalOpen(false)
                }}
                isRegister={false}
              />
            </div>
          </Motion.div>
        </div>
      )}
    </div>
  )
}
