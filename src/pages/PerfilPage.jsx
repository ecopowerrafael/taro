import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Star, LogOut, Wallet } from 'lucide-react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { AuthProfileForm } from '../components/AuthProfileForm'
import { PageShell } from '../components/PageShell'
import { ReviewModal } from '../components/ReviewModal'
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
    token,
  } = usePlatformContext()
  const navigate = useNavigate()
  const [expandedAnswerId, setExpandedAnswerId] = useState(null)
  const [reviewModal, setReviewModal] = useState({ isOpen: false, consultantId: '', consultantName: '', referenceId: '' })
  const [reviewedIds, setReviewedIds] = useState(new Set())

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/entrar')
    }
  }, [authLoading, isAuthenticated, navigate])

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

  const respostasRef = useRef(null)
  const editarRef = useRef(null)

  if (!profile) return null

  // Filtrar respostas recebidas pelo cliente (status === 'answered')
  const myAnswers = questionRequests.filter(
    (request) => request.customerEmail === profile.email && request.status === 'answered'
  )

  const minutosFormatados = minutesBalance != null
    ? minutesBalance >= 60
      ? `${Math.floor(minutesBalance / 60)}h ${minutesBalance % 60}min`
      : `${minutesBalance} min`
    : '–'

  const signData = sign ? SIGNO_MAP[sign] : null

  // ─── Menu de navegação ────────────────────────────────────────────────────
  const menuItems = [
    { label: 'Mapa Astral',   icon: '/mapa-astral.png',          to: '/mapa-astral',      external: false },
    { label: 'Sincronia',     icon: '/almas.png',                 to: '/sincronicidade',   external: false },
    { label: 'Especialistas', icon: '/especialistas-reais.png',   to: '/consultores',      external: false },
    { label: 'Respostas',     icon: '/respostas.png',             to: null,                external: false,
      onClick: () => respostasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
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
          <div className="mb-8 flex flex-col items-center gap-3">
            {/* Selo do signo */}
            {signData ? (
              <SignSeal signLabel={sign} size={130} />
            ) : (
              <Motion.div
                className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-stardust-gold/40 bg-mystic-purple/40 text-5xl text-stardust-gold/50"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                ✦
              </Motion.div>
            )}

            <div className="text-center">
              <h2 className="font-display text-2xl text-mystic-goldSoft drop-shadow-[0_0_12px_rgba(197,160,89,0.4)]">
                {profile.name}
              </h2>
              {sign && (
                <p className="mt-0.5 text-xs tracking-[0.22em] uppercase text-ethereal-silver/50">{sign}</p>
              )}
            </div>

            {/* Card de saldo */}
            <Motion.div
              className="relative mt-2 overflow-hidden rounded-2xl border border-stardust-gold/40 bg-[rgba(10,0,20,0.7)] px-8 py-4 text-center shadow-[0_0_30px_rgba(197,160,89,0.12)] backdrop-blur-md"
              animate={{ boxShadow: ['0 0 18px rgba(197,160,89,0.10)', '0 0 34px rgba(197,160,89,0.22)', '0 0 18px rgba(197,160,89,0.10)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {/* shimmer */}
              <Motion.div
                className="pointer-events-none absolute inset-0"
                animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{ background: 'linear-gradient(90deg, transparent 30%, rgba(255,247,204,0.08) 50%, transparent 70%)', backgroundSize: '300%' }}
              />
              <div className="relative flex items-center justify-center gap-2">
                <Wallet size={15} className="text-stardust-gold/70" />
                <span className="text-[10px] tracking-[0.25em] uppercase text-stardust-gold/60">Saldo</span>
              </div>
              <div className="font-display relative text-3xl font-bold text-mystic-goldSoft drop-shadow-[0_0_10px_rgba(197,160,89,0.6)]">
                {minutosFormatados}
              </div>
              <Motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/recarregar')}
                className="relative mt-2 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#E0C27A] to-[#C5A059] px-5 py-1.5 text-xs font-bold tracking-widest text-mystic-black shadow-[0_0_14px_rgba(197,160,89,0.4)]"
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
                  className="flex flex-col items-center gap-2 rounded-2xl border border-stardust-gold/30 bg-[rgba(26,11,46,0.70)] py-5 px-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md transition hover:border-stardust-gold/60 hover:bg-[rgba(46,22,79,0.75)]"
                >
                  <img src={item.icon} alt={item.label} className="h-14 w-14 object-contain drop-shadow-[0_0_10px_rgba(197,160,89,0.3)]" />
                  <span className="text-center text-[11px] font-medium tracking-widest uppercase text-mystic-goldSoft/80">{item.label}</span>
                </Motion.div>
              )
              if (item.onClick) {
                return <button key={item.label} onClick={item.onClick} className="block w-full text-left">{inner}</button>
              }
              return <Link key={item.label} to={item.to}>{inner}</Link>
            })}
          </div>

          {/* ── EDITAR PERFIL ─────────────────────────────────────── */}
          <section ref={editarRef} className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex-1 border-t border-stardust-gold/20" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-stardust-gold/50">Editar Perfil</span>
              <div className="flex-1 border-t border-stardust-gold/20" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-stardust-gold/25 bg-[rgba(10,0,20,0.65)] backdrop-blur-md">
              <AuthProfileForm
                profile={profile}
                sign={sign}
                onUpdate={updateProfile}
                isRegister={false}
              />
            </div>
            <div className="mt-4 flex justify-center">
              <Motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm text-red-400 transition hover:bg-red-500/20"
              >
                <LogOut size={14} /> Sair da Conta
              </Motion.button>
            </div>
          </section>

          {/* ── RESPOSTAS ─────────────────────────────────────────── */}
          <section ref={respostasRef}>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex-1 border-t border-stardust-gold/20" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-stardust-gold/50">
                Respostas {myAnswers.length > 0 && `(${myAnswers.length})`}
              </span>
              <div className="flex-1 border-t border-stardust-gold/20" />
            </div>

            {myAnswers.length === 0 ? (
              <div className="rounded-2xl border border-stardust-gold/20 bg-[rgba(10,0,20,0.5)] px-5 py-6 text-center text-sm text-ethereal-silver/50">
                Nenhuma resposta recebida ainda.
              </div>
            ) : (
              <div className="grid gap-3">
                {myAnswers.map((answer) => (
                  <article
                    key={answer.id}
                    className="overflow-hidden rounded-2xl border border-stardust-gold/25 bg-[rgba(10,0,20,0.65)] backdrop-blur-md"
                  >
                    {/* Cabeçalho */}
                    <button
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                      onClick={() => setExpandedAnswerId(expandedAnswerId === answer.id ? null : answer.id)}
                    >
                      <div>
                        <p className="font-semibold text-mystic-goldSoft">{answer.consultantName}</p>
                        <p className="text-[10px] text-ethereal-silver/40 mt-0.5">
                          {new Date(answer.answeredAt).toLocaleDateString('pt-BR')} · {answer.questionCount} pergunta(s)
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-stardust-gold transition-transform ${expandedAnswerId === answer.id ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Conteúdo expandido */}
                    <AnimatePresence>
                      {expandedAnswerId === answer.id && (
                        <Motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 border-t border-stardust-gold/15 px-4 py-4">
                            {Array.isArray(answer.entries) && answer.entries.length > 0 && (
                              <div className="rounded-xl bg-black/40 p-3 space-y-2">
                                <p className="text-[11px] font-semibold tracking-widest uppercase text-stardust-gold/60 mb-1">Suas perguntas</p>
                                {answer.entries.map((entry, idx) => (
                                  <p key={entry.id || idx} className="text-xs text-amber-100/80 pb-2 border-b border-stardust-gold/10 last:border-0">
                                    <span className="text-stardust-gold font-bold">P{idx + 1}.</span>{' '}
                                    {entry.question || entry.text || '—'}
                                  </p>
                                ))}
                              </div>
                            )}
                            <div className="rounded-xl bg-black/40 p-3">
                              <p className="text-[11px] font-semibold tracking-widest uppercase text-stardust-gold/60 mb-2">Resposta</p>
                              <p className="text-xs text-amber-50 whitespace-pre-wrap leading-relaxed">{answer.answerSummary}</p>
                            </div>
                            {!reviewedIds.has(answer.id) && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() =>
                                    setReviewModal({
                                      isOpen: true,
                                      consultantId: answer.consultantId,
                                      consultantName: answer.consultantName,
                                      referenceId: answer.id,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-stardust-gold/40 bg-black/30 px-3 py-1.5 text-xs text-stardust-gold transition hover:bg-stardust-gold/10"
                                >
                                  <Star size={12} /> Avaliar consultor
                                </button>
                              </div>
                            )}
                            {reviewedIds.has(answer.id) && (
                              <p className="text-right text-xs text-emerald-400/80">✓ Avaliado</p>
                            )}
                          </div>
                        </Motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                ))}
              </div>
            )}
          </section>

        </div>
      </PageShell>

      <ReviewModal
        isOpen={reviewModal.isOpen}
        consultantName={reviewModal.consultantName}
        consultantId={reviewModal.consultantId}
        referenceId={reviewModal.referenceId}
        sessionType="question"
        token={token}
        onClose={() => setReviewModal(r => ({ ...r, isOpen: false }))}
        onSubmitted={() => {
          setReviewedIds(prev => new Set([...prev, reviewModal.referenceId]))
        }}
      />
    </div>
  )
}
