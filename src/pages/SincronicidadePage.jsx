import { useState, useEffect, useRef, useCallback } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'

// ─── Dados dos signos ────────────────────────────────────────────────────────
const SIGNOS = [
  { id: 'aries',       label: 'Áries',       symbol: '♈', elemento: 'fogo',  datas: '21/03 – 19/04' },
  { id: 'taurus',      label: 'Touro',        symbol: '♉', elemento: 'terra', datas: '20/04 – 20/05' },
  { id: 'gemini',      label: 'Gêmeos',       symbol: '♊', elemento: 'ar',    datas: '21/05 – 20/06' },
  { id: 'cancer',      label: 'Câncer',       symbol: '♋', elemento: 'agua',  datas: '21/06 – 22/07' },
  { id: 'leo',         label: 'Leão',         symbol: '♌', elemento: 'fogo',  datas: '23/07 – 22/08' },
  { id: 'virgo',       label: 'Virgem',       symbol: '♍', elemento: 'terra', datas: '23/08 – 22/09' },
  { id: 'libra',       label: 'Libra',        symbol: '♎', elemento: 'ar',    datas: '23/09 – 22/10' },
  { id: 'scorpio',     label: 'Escorpião',    symbol: '♏', elemento: 'agua',  datas: '23/10 – 21/11' },
  { id: 'sagittarius', label: 'Sagitário',    symbol: '♐', elemento: 'fogo',  datas: '22/11 – 21/12' },
  { id: 'capricorn',   label: 'Capricórnio', symbol: '♑', elemento: 'terra', datas: '22/12 – 19/01' },
  { id: 'aquarius',    label: 'Aquário',      symbol: '♒', elemento: 'ar',    datas: '20/01 – 18/02' },
  { id: 'pisces',      label: 'Peixes',       symbol: '♓', elemento: 'agua',  datas: '19/02 – 20/03' },
]

// Cores por elemento
const ELEMENTO_COLORS = {
  fogo:  { primary: '#FF6B35', glow: 'rgba(255,107,53,0.6)',  smoke: ['#FF6B35','#FFD700','#FF4500'] },
  terra: { primary: '#8B7355', glow: 'rgba(139,115,85,0.6)', smoke: ['#8B7355','#C5A059','#6B8E23'] },
  ar:    { primary: '#87CEEB', glow: 'rgba(135,206,235,0.6)', smoke: ['#87CEEB','#E0E7FF','#C8D6F0'] },
  agua:  { primary: '#4A90D9', glow: 'rgba(74,144,217,0.6)', smoke: ['#4A90D9','#7B68EE','#00CED1'] },
}

// ─── Perfis amorosos dos signos ──────────────────────────────────────────────
const SIGNO_PERFIS = {
  aries: {
    titulo: 'O Conquistador Audaz',
    particularidade: 'Precisa de autonomia e de uma "causa" dentro da relação. Se o tédio se instala, a chama apaga.',
    vantagem: 'Lealdade feroz e uma honestidade brutal que elimina joguinhos. Com Áries, você sempre sabe onde pisa.',
  },
  taurus: {
    titulo: 'O Âncora de Vênus',
    particularidade: 'O amor passa pelos cinco sentidos. Se não houver toque, boa comida e estabilidade financeira, ele se retrai.',
    vantagem: 'É o signo mais construtor do zodíaco. Estar com Touro é ter a garantia de que o relacionamento será um investimento sólido e seguro.',
  },
  gemini: {
    titulo: 'O Poliglota do Afeto',
    particularidade: 'O órgão mais sexual de Gêmeos é o cérebro. Se a conversa morrer, o interesse morre junto.',
    vantagem: 'Adaptabilidade extrema. Eles trazem leveza, riso e uma renovação constante que impede o relacionamento de envelhecer.',
  },
  cancer: {
    titulo: 'O Guardião do Ninho',
    particularidade: 'Memória emocional implacável. Eles não esquecem como você os fez sentir há dez anos.',
    vantagem: 'Uma capacidade de cuidado e intuição que faz o parceiro se sentir a pessoa mais protegida do mundo. É o acolhimento absoluto.',
  },
  leo: {
    titulo: 'O Sol do Relacionamento',
    particularidade: 'Precisa de admiração mútua. Se ele não se sente o "protagonista" na vida do parceiro, o brilho se torna drama.',
    vantagem: 'Generosidade magnânima. Leão eleva o parceiro, celebra suas vitórias como se fossem dele e traz um romance digno de cinema.',
  },
  virgo: {
    titulo: 'O Alquimista da Rotina',
    particularidade: 'Demonstra amor através do serviço. Ele não vai fazer um poema, mas vai consertar o seu computador e organizar sua agenda.',
    vantagem: 'A busca pela melhor versão do casal. Virgem lapida a relação até que ela funcione como uma máquina perfeita e saudável.',
  },
  libra: {
    titulo: 'O Arquiteto da Harmonia',
    particularidade: 'Horror ao conflito. Pode omitir o que sente para não quebrar a paz, o que exige um parceiro atento às entrelinhas.',
    vantagem: 'A arte da parceria. Libra é o mestre em fazer o outro se sentir ouvido, valorizado e esteticamente em paz.',
  },
  scorpio: {
    titulo: 'O Mergulhador de Abismos',
    particularidade: '"Tudo ou nada". Não suporta conexões superficiais. Ele exige a entrega das sombras, não apenas das luzes.',
    vantagem: 'Uma lealdade transformadora. Escorpião cura o parceiro através da profundidade e protege a relação com uma intensidade mística.',
  },
  sagittarius: {
    titulo: 'O Arqueiro da Liberdade',
    particularidade: 'O relacionamento deve ser uma expansão, nunca uma gaiola. Ele precisa sentir que a vida é maior ao seu lado.',
    vantagem: 'Otimismo contagiante. Sagitário transforma qualquer crise em uma aventura filosófica e mantém a chama da esperança sempre acesa.',
  },
  capricorn: {
    titulo: 'O Arquiteto do Legado',
    particularidade: 'O amor é um compromisso sério, quase um contrato de alma. Ele demora a se abrir, mas quando o faz, é para sempre.',
    vantagem: 'Provedoria e suporte inabalável. Capricórnio é a rocha que sustenta o parceiro nos momentos de maior tempestade.',
  },
  aquarius: {
    titulo: 'O Visionário do Desapego',
    particularidade: 'Precisa de amizade antes do romance. Ele valoriza o espaço individual tanto quanto a conexão do casal.',
    vantagem: 'Originalidade e zero posse. Com Aquário, você terá um parceiro que respeita sua individualidade e te incentiva a ser autêntico.',
  },
  pisces: {
    titulo: 'O Poeta do Invisível',
    particularidade: 'Tende a idealizar o parceiro. Vive em uma frequência mística onde o amor é uma forma de sacrifício e beleza.',
    vantagem: 'Empatia sem limites. Peixes sente a sua dor antes de você falar, oferecendo uma conexão espiritual que transcende o plano físico.',
  },
}

// ─── Utilitários ─────────────────────────────────────────────────────────────
function getMatch(s1, s2) {
  // Cobre todos os 144 pares ordenados com 78 chaves únicas
  const key = [s1, s2].sort().join('_')
  return import('../data/sincronicidade.json').then((m) => m.default[key] ?? null)
}

function getSigno(id) {
  return SIGNOS.find((s) => s.id === id)
}

// ─── Partícula de coração flutuante ──────────────────────────────────────────
function FloatingHeart({ x, y, delay, size }) {
  return (
    <Motion.div
      className="pointer-events-none absolute select-none"
      style={{ left: x, top: y, fontSize: size }}
      initial={{ opacity: 0, y: 0, scale: 0.4 }}
      animate={{ opacity: [0, 0.8, 0], y: -120, scale: [0.4, 1, 0.6] }}
      transition={{ duration: 3.5, delay, ease: 'easeOut' }}
    >
      ♡
    </Motion.div>
  )
}

// ─── Campo de estrelas CSS ────────────────────────────────────────────────────
function StarField({ count = 60 }) {
  const stars = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
    }))
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.current.map((s) => (
        <Motion.div
          key={s.id}
          className="absolute rounded-full bg-stardust-gold"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.1, 0.9, 0.1], scale: [1, 1.4, 1] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ─── Partícula de fumaça ──────────────────────────────────────────────────────
function SmokeParticle({ x, color, delay }) {
  const randX = (Math.random() - 0.5) * 140
  const size = Math.random() * 60 + 30
  return (
    <Motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        left: x,
        bottom: '40%',
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}55 0%, ${color}11 60%, transparent 80%)`,
        filter: 'blur(12px)',
      }}
      initial={{ opacity: 0, y: 0, x: 0, scale: 0.3 }}
      animate={{
        opacity: [0, 0.6, 0.4, 0],
        y: [-20, -100, -180],
        x: [0, randX / 2, randX],
        scale: [0.3, 1.2, 1.8],
      }}
      transition={{ duration: 2.8, delay, ease: 'easeOut' }}
    />
  )
}

// ─── Smoke burst durante a fusão ─────────────────────────────────────────────
function SmokeBurst({ colors }) {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: `${30 + Math.random() * 40}%`,
    color: colors[i % colors.length],
    delay: i * 0.12,
  }))
  return (
    <>
      {particles.map((p) => (
        <SmokeParticle key={p.id} x={p.x} color={p.color} delay={p.delay} />
      ))}
    </>
  )
}

// ─── Corações flutuando (lote) ────────────────────────────────────────────────
function HeartsLayer() {
  const hearts = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: `${5 + Math.random() * 90}%`,
      y: `${10 + Math.random() * 80}%`,
      delay: Math.random() * 5,
      size: `${Math.random() * 14 + 10}px`,
    }))
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-[#E0527A]/50">
      {hearts.current.map((h) => (
        <FloatingHeart key={h.id} x={h.x} y={h.y} delay={h.delay} size={h.size} />
      ))}
    </div>
  )
}

// ─── Seletor de signo ─────────────────────────────────────────────────────────
function SignSelector({ label, value, onChange, iconSrc, iconAlt }) {
  const selected = value ? getSigno(value) : null
  const [open, setOpen] = useState(false)

  return (
    <div className="relative w-full max-w-[240px]">
      <p className="mb-2 text-center text-xs tracking-[0.2em] text-stardust-gold/70 uppercase">{label}</p>

      {/* Botão de seleção */}
      <Motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className={`relative w-full overflow-hidden rounded-2xl border px-4 py-4 text-center transition-all ${
          selected
            ? 'border-stardust-gold/70 bg-mystic-purple/60'
            : 'border-stardust-gold/30 bg-mystic-purple/30'
        }`}
      >
        {/* Glow de elemento */}
        {selected && (
          <Motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ background: `radial-gradient(ellipse at center, ${ELEMENTO_COLORS[selected.elemento].glow} 0%, transparent 70%)` }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <div className="relative z-10 flex flex-col items-center gap-1.5">
          <img
            src={iconSrc}
            alt={iconAlt}
            className="h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(197,160,89,0.45)]"
          />
          <span className="font-display text-lg text-mystic-goldSoft">
            {selected ? selected.label : label}
          </span>
          {selected && (
            <span className="text-[11px] tracking-widest text-ethereal-silver/50 uppercase">{selected.datas}</span>
          )}
        </div>
      </Motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <Motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-stardust-gold/30 bg-[rgba(10,0,20,0.97)] shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="max-h-72 overflow-y-auto py-1">
              {SIGNOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onChange(s.id); setOpen(false) }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stardust-gold/10 ${
                    value === s.id ? 'bg-stardust-gold/15 text-stardust-gold' : 'text-ethereal-silver/80'
                  }`}
                >
                  <span className="flex-shrink-0">
                    <LuxurySignSeal sign={s} size={36} />
                  </span>
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-[10px] text-ethereal-silver/40">{s.datas}</div>
                  </div>
                  <span className={`ml-auto text-[10px] capitalize px-1.5 py-0.5 rounded-full border ${
                    s.elemento === 'fogo'  ? 'border-orange-500/40 text-orange-400' :
                    s.elemento === 'terra' ? 'border-yellow-700/40 text-yellow-600' :
                    s.elemento === 'ar'    ? 'border-sky-400/40   text-sky-300' :
                                             'border-blue-500/40  text-blue-400'
                  }`}>{s.elemento}</span>
                </button>
              ))}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Contador animado ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, duration = 1.8 }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const elapsed = (now - start) / 1000
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCurrent(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return <>{current}</>
}

// ─── Efeito typewriter ────────────────────────────────────────────────────────
function Typewriter({ text, delay = 0, speed = 28 }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay * 1000)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    setDisplayed('')
    let i = 0
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(iv)
    }, speed)
    return () => clearInterval(iv)
  }, [started, text])

  return <>{displayed}</>
}

// ─── Cor do percentual ────────────────────────────────────────────────────────
function percentColor(p) {
  if (p >= 85) return '#FFD700'
  if (p >= 65) return '#C5A059'
  if (p >= 45) return '#A57CDB'
  return '#E5E7EB'
}

function LuxurySignSeal({ sign, size = 92, pulse = false }) {
  if (!sign) return null

  const palette = ELEMENTO_COLORS[sign.elemento] ?? ELEMENTO_COLORS.fogo
  const id = `${sign.id}-${size}`

  return (
    <Motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className="overflow-visible"
      animate={pulse ? { scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] } : undefined}
      transition={pulse ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="40%" r="68%">
          <stop offset="0%" stopColor={`${palette.primary}55`} />
          <stop offset="70%" stopColor="#1A0B2E" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
        <linearGradient id={`gold-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7CC" />
          <stop offset="45%" stopColor="#E0C27A" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="60" cy="60" r="50" fill={`url(#bg-${id})`} />
      <circle cx="60" cy="60" r="52" fill="none" stroke={`url(#gold-${id})`} strokeWidth="2.4" />
      <circle cx="60" cy="60" r="43" fill="none" stroke={`${palette.primary}66`} strokeWidth="1.1" />

      <path
        d="M60 12 L63 20 L72 20 L65 25 L68 34 L60 29 L52 34 L55 25 L48 20 L57 20 Z"
        fill={`url(#gold-${id})`}
        opacity="0.9"
      />
      <path
        d="M60 108 L63 100 L72 100 L65 95 L68 86 L60 91 L52 86 L55 95 L48 100 L57 100 Z"
        fill={`url(#gold-${id})`}
        opacity="0.9"
      />

      <text
        x="60"
        y="72"
        textAnchor="middle"
        fontSize="48"
        fontWeight="700"
        fill={`url(#gold-${id})`}
        filter={`url(#glow-${id})`}
        style={{ letterSpacing: '0.02em' }}
      >
        {sign.symbol}
      </text>
    </Motion.svg>
  )
}

// ─── Reveal: card com perfil do signo antes da fusão ────────────────────────
function SignRevealPhase({ signoA, signoB, onComplete }) {
  const [index, setIndex] = useState(0)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const signIds = [signoA, signoB]
  const currentSignId = signIds[index]
  const currentSign = getSigno(currentSignId)
  const perfil = SIGNO_PERFIS[currentSignId]
  const palette = ELEMENTO_COLORS[currentSign.elemento]

  const particMs = perfil.particularidade.length * 18
  const vantagMs = perfil.vantagem.length * 18
  const totalMs = particMs + 300 + vantagMs + 3000

  useEffect(() => {
    const t = setTimeout(() => {
      if (index === 0) {
        setIndex(1)
      } else {
        onCompleteRef.current()
      }
    }, totalMs)
    return () => clearTimeout(t)
  }, [index, totalMs])

  return (
    <AnimatePresence mode="wait">
      <Motion.div
        key={index}
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-stardust-gold/40 bg-[rgba(6,0,18,0.72)] p-6 shadow-[0_0_70px_rgba(197,160,89,0.22)] backdrop-blur-xl sm:p-8"
      >
        {/* Glow de elemento */}
        <Motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${palette.glow}, transparent 68%)` }}
        />
        {/* Shimmer */}
        <Motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          style={{ background: 'linear-gradient(90deg, transparent 30%, rgba(255,247,204,0.07) 50%, transparent 70%)', backgroundSize: '300%' }}
        />

        {/* Indicadores de progresso */}
        <div className="relative mb-2 flex justify-center gap-2">
          {signIds.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? 'w-8 bg-stardust-gold' : 'w-4 bg-stardust-gold/25'
              }`}
            />
          ))}
        </div>

        {/* Seal animado */}
        <div className="relative my-5 flex justify-center">
          <Motion.div
            animate={{
              filter: [
                `drop-shadow(0 0 12px ${palette.primary}60)`,
                `drop-shadow(0 0 28px ${palette.primary})`,
                `drop-shadow(0 0 12px ${palette.primary}60)`,
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <LuxurySignSeal sign={currentSign} size={110} pulse />
          </Motion.div>
        </div>

        {/* Nome + título */}
        <div className="relative mb-6 text-center">
          <p className="font-display text-2xl tracking-[0.12em] text-mystic-goldSoft sm:text-3xl">
            {currentSign.symbol} {currentSign.label}
          </p>
          <p className="mt-1 text-sm italic tracking-wider text-stardust-gold/55">{perfil.titulo}</p>
        </div>

        {/* Particularidade */}
        <div className="relative mb-4 rounded-2xl border border-stardust-gold/20 bg-black/35 p-4">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.26em] uppercase text-stardust-gold/65">✦ Particularidade</p>
          <p className="min-h-[3em] text-sm leading-relaxed text-ethereal-silver/85">
            <Typewriter text={perfil.particularidade} delay={0} speed={18} />
          </p>
        </div>

        {/* Vantagem */}
        <div className="relative rounded-2xl border border-emerald-500/20 bg-black/35 p-4">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.26em] uppercase text-emerald-400/65">✦ Vantagem</p>
          <p className="min-h-[3em] text-sm leading-relaxed text-ethereal-silver/85">
            <Typewriter text={perfil.vantagem} delay={particMs / 1000 + 0.3} speed={18} />
          </p>
        </div>
      </Motion.div>
    </AnimatePresence>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function SincronicidadePage() {
  const navigate = useNavigate()
  const [signoA, setSignoA] = useState('')
  const [signoB, setSignoB] = useState('')
  const [fase, setFase] = useState('input') // 'input' | 'fusao' | 'resultado'
  const [resultado, setResultado] = useState(null)
  const [showHearts, setShowHearts] = useState(false)
  const [heartsTick, setHeartsTick] = useState(0)
  const smokeColors = useRef([])
  const matchDataPromiseRef = useRef(null)

  // Gera corações periodicamente na tela de resultado
  useEffect(() => {
    if (fase !== 'resultado') return
    const iv = setInterval(() => setHeartsTick((t) => t + 1), 4000)
    return () => clearInterval(iv)
  }, [fase])

  const handleVerSincronicidade = useCallback(() => {
    if (!signoA || !signoB) return
    const sA = getSigno(signoA)
    const sB = getSigno(signoB)
    const colorsA = ELEMENTO_COLORS[sA.elemento].smoke
    const colorsB = ELEMENTO_COLORS[sB.elemento].smoke
    smokeColors.current = [...new Set([...colorsA, ...colorsB])]

    // Pré-carrega dados enquanto o reveal é exibido
    matchDataPromiseRef.current = getMatch(signoA, signoB)
    setFase('reveal')
  }, [signoA, signoB])

  const handleRevealComplete = useCallback(async () => {
    setFase('fusao')
    const data = await (matchDataPromiseRef.current ?? getMatch(signoA, signoB))
    await new Promise((r) => setTimeout(r, 2800))
    setResultado(data)
    setFase('resultado')
    setShowHearts(true)
  }, [signoA, signoB])

  const handleReset = () => {
    setFase('input')
    setResultado(null)
    setShowHearts(false)
    setSignoA('')
    setSignoB('')
    matchDataPromiseRef.current = null
  }

  const signoAData = signoA ? getSigno(signoA) : null
  const signoBData = signoB ? getSigno(signoB) : null

  return (
    <div className="relative min-h-screen overflow-hidden bg-mystic-black">
      {/* Fundo gradiente */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(46,2,73,0.6),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(74,144,217,0.08),transparent)]" />
      </div>

      {/* Estrelas de fundo */}
      <StarField count={70} />

      <PageShell
        title="Sincronicidade de Almas"
        subtitle="Descubra a frequência da sua conexão"
      >
        <div className="mx-auto max-w-2xl px-4 pb-32 pt-4">

          {/* ── FASE INPUT ─────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {fase === 'input' && (
              <Motion.div
                key="input"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
              >
                {/* Seletores */}
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
                  <SignSelector
                    label="Seu signo"
                    value={signoA}
                    onChange={setSignoA}
                    iconSrc="/signodela.png"
                    iconAlt="Ícone para selecionar seu signo"
                  />

                  {/* Ícone central */}
                  <Motion.div
                    className="flex-shrink-0 text-3xl text-stardust-gold/60"
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    ✦
                  </Motion.div>

                  <SignSelector
                    label="Signo da outra pessoa"
                    value={signoB}
                    onChange={setSignoB}
                    iconSrc="/signodele.png"
                    iconAlt="Ícone para selecionar o signo da outra pessoa"
                  />
                </div>

                {/* Indicador de elementos selecionados */}
                {signoA && signoB && (
                  <Motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex justify-center gap-4 text-sm"
                  >
                    <span className="rounded-full border border-stardust-gold/30 bg-stardust-gold/10 px-3 py-1 capitalize text-stardust-gold">
                      {signoAData.elemento}
                    </span>
                    <span className="text-stardust-gold/40">+</span>
                    <span className="rounded-full border border-stardust-gold/30 bg-stardust-gold/10 px-3 py-1 capitalize text-stardust-gold">
                      {signoBData.elemento}
                    </span>
                  </Motion.div>
                )}

                {/* CTA */}
                <div className="mt-10 flex justify-center">
                  <Motion.button
                    whileHover={{ scale: signoA && signoB ? 1.04 : 1 }}
                    whileTap={{ scale: signoA && signoB ? 0.97 : 1 }}
                    onClick={handleVerSincronicidade}
                    disabled={!signoA || !signoB}
                    className={`relative overflow-hidden rounded-2xl px-10 py-4 text-lg font-bold tracking-[0.12em] transition-all ${
                      signoA && signoB
                        ? 'cursor-pointer bg-gradient-to-r from-[#C5A059] via-[#E0C27A] to-[#C5A059] text-mystic-black shadow-[0_0_32px_rgba(197,160,89,0.45)]'
                        : 'cursor-not-allowed bg-stardust-gold/20 text-stardust-gold/40'
                    }`}
                  >
                    {signoA && signoB && (
                      <Motion.div
                        className="absolute inset-0"
                        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', backgroundSize: '200%' }}
                      />
                    )}
                    <span className="relative z-10">✦ Ver Sincronicidade</span>
                  </Motion.button>
                </div>

                {/* Disclaimer */}
                <p className="mt-6 text-center text-sm leading-relaxed text-ethereal-silver/60">
                  Duas trajetórias, um único desenho estelar. Selecione as energias que deseja cruzar e observe como os elementos reagem à presença um do outro. O Cosmo não comete erros de cálculo; ele apenas revela afinidades.
                </p>
              </Motion.div>
            )}

            {/* ── FASE REVEAL ─────────────────────────────────────────────── */}
            {fase === 'reveal' && (
              <Motion.div
                key="reveal"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45 }}
              >
                <p className="mb-4 text-center text-[11px] tracking-[0.28em] uppercase text-stardust-gold/45">
                  Lendo as energias dos signos...
                </p>
                <SignRevealPhase
                  signoA={signoA}
                  signoB={signoB}
                  onComplete={handleRevealComplete}
                />
              </Motion.div>
            )}

            {/* ── FASE FUSÃO ──────────────────────────────────────────────── */}
            {fase === 'fusao' && (
              <Motion.div
                key="fusao"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative flex min-h-[340px] flex-col items-center justify-center"
              >
                {/* Fumaça */}
                <SmokeBurst colors={smokeColors.current} />

                {/* Ícones orbitando */}
                <div className="relative flex h-40 w-40 items-center justify-center">
                  {/* Ícone A em órbita */}
                  <Motion.div
                    className="absolute"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2.6, ease: 'linear', repeat: Infinity }}
                    style={{ transformOrigin: '50% 50%' }}
                  >
                    <Motion.span
                      animate={{ x: [-48, 48, -48], y: [-20, 20, -20] }}
                      transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity }}
                      className="inline-block"
                      style={{ filter: `drop-shadow(0 0 12px ${ELEMENTO_COLORS[signoAData?.elemento ?? 'fogo'].primary})` }}
                    >
                      <LuxurySignSeal sign={signoAData} size={84} pulse />
                    </Motion.span>
                  </Motion.div>

                  {/* Ícone B em órbita inversa */}
                  <Motion.div
                    className="absolute"
                    animate={{ rotate: [360, 0] }}
                    transition={{ duration: 2.6, ease: 'linear', repeat: Infinity }}
                  >
                    <Motion.span
                      animate={{ x: [48, -48, 48], y: [20, -20, 20] }}
                      transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity }}
                      className="inline-block"
                      style={{ filter: `drop-shadow(0 0 12px ${ELEMENTO_COLORS[signoBData?.elemento ?? 'agua'].primary})` }}
                    >
                      <LuxurySignSeal sign={signoBData} size={84} pulse />
                    </Motion.span>
                  </Motion.div>

                  {/* Pulso central */}
                  <Motion.div
                    className="h-16 w-16 rounded-full"
                    style={{ background: `radial-gradient(circle, ${smokeColors.current[0] ?? '#C5A059'}66, transparent 70%)` }}
                    animate={{ scale: [0.6, 1.6, 0.6], opacity: [0.3, 0.9, 0.3] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                <Motion.p
                  className="mt-8 text-center text-sm tracking-[0.22em] text-stardust-gold/70 uppercase"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  Calculando sincronicidade...
                </Motion.p>
              </Motion.div>
            )}

            {/* ── FASE RESULTADO ──────────────────────────────────────────── */}
            {fase === 'resultado' && resultado && (
              <Motion.div
                key="resultado"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="relative"
              >
                {/* Corações flutuantes */}
                <AnimatePresence>
                  <HeartsLayer key={heartsTick} />
                </AnimatePresence>

                {/* Card de resultado */}
                <div className="relative overflow-hidden rounded-3xl border border-stardust-gold/30 bg-[rgba(10,0,20,0.75)] p-8 shadow-[0_0_60px_rgba(197,160,89,0.15)] backdrop-blur-md">
                  {/* Shimmer border */}
                  <Motion.div
                    className="pointer-events-none absolute inset-0 rounded-3xl"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ background: 'linear-gradient(135deg, rgba(197,160,89,0.15) 0%, transparent 50%, rgba(197,160,89,0.1) 100%)' }}
                  />

                  {/* Signos */}
                  <div className="mb-6 flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <Motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ filter: `drop-shadow(0 0 10px ${ELEMENTO_COLORS[signoAData.elemento].primary})` }}
                      >
                        <LuxurySignSeal sign={signoAData} size={90} pulse />
                      </Motion.div>
                      <span className="mt-1 text-xs text-ethereal-silver/50">{signoAData.label}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <Motion.span
                        className="text-2xl text-stardust-gold"
                        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        ✦
                      </Motion.span>
                    </div>

                    <div className="flex flex-col items-center">
                      <Motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ filter: `drop-shadow(0 0 10px ${ELEMENTO_COLORS[signoBData.elemento].primary})` }}
                      >
                        <LuxurySignSeal sign={signoBData} size={90} pulse />
                      </Motion.div>
                      <span className="mt-1 text-xs text-ethereal-silver/50">{signoBData.label}</span>
                    </div>
                  </div>

                  {/* Percentual */}
                  <div className="mb-3 text-center">
                    <Motion.div
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    >
                      <span
                        className="block font-display text-8xl font-bold leading-none"
                        style={{
                          color: percentColor(resultado.percent),
                          textShadow: `0 0 40px ${percentColor(resultado.percent)}88`,
                        }}
                      >
                        <AnimatedCounter target={resultado.percent} />%
                      </span>
                    </Motion.div>
                  </div>

                  {/* Dinâmica */}
                  <Motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-5 text-center font-display text-xl tracking-[0.15em] text-mystic-goldSoft"
                  >
                    {resultado.dinamica}
                  </Motion.p>

                  {/* Texto de gancho (typewriter) */}
                  <Motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mx-auto mb-8 max-w-sm text-center text-sm leading-relaxed text-ethereal-silver/75"
                  >
                    <Typewriter text={resultado.texto} delay={0.9} />
                  </Motion.p>

                  {/* Divisor */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex-1 border-t border-stardust-gold/20" />
                    <span className="text-xs text-stardust-gold/40">✦</span>
                    <div className="flex-1 border-t border-stardust-gold/20" />
                  </div>

                  {/* CTA Conversão */}
                  <Motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="mb-4 rounded-2xl border border-mystic-purple-light/30 bg-mystic-purple/30 p-4 text-center"
                  >
                    <p className="mb-1 text-xs tracking-widest text-stardust-gold/60 uppercase">
                      {resultado.percent >= 65 ? 'Potencialize essa união' : 'Supere os desafios'}
                    </p>
                    <p className="mb-4 text-sm text-ethereal-silver/70">
                      {resultado.percent >= 65
                        ? 'O Sol revela a sintonia, mas o destino está nos detalhes. O Vênus dele(a) se alinha com o seu Marte?'
                        : 'Os signos solares mostram a superfície. Descubra como superar os desafios com a Sinastria Completa.'}
                    </p>
                    <Motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/mapa-astral')}
                      className="w-full rounded-xl bg-gradient-to-r from-[#C5A059] via-[#E0C27A] to-[#C5A059] py-3 font-bold tracking-[0.1em] text-mystic-black shadow-[0_0_24px_rgba(197,160,89,0.4)] transition-all hover:shadow-[0_0_36px_rgba(197,160,89,0.6)]"
                    >
                      {resultado.percent >= 65 ? '✦ Desbloquear Análise de Vênus e Marte' : '✦ Desbloquear Análise Completa'}
                    </Motion.button>
                  </Motion.div>

                  {/* Botão consultores */}
                  <Motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate('/consultores')}
                    className="mb-4 w-full rounded-xl border border-stardust-gold/30 py-3 text-sm tracking-wider text-stardust-gold/80 transition hover:bg-stardust-gold/10"
                  >
                    Falar com Consultor ao Vivo
                  </Motion.button>

                  {/* Compartilhar */}
                  <Motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.7 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      const text = `${signoAData.symbol} ${signoAData.label} + ${signoBData.symbol} ${signoBData.label}\n✦ Nossa Sincronicidade é de ${resultado.percent}% ✦\n${resultado.dinamica}\n\nDescubra a sua em appastria.online`
                      if (navigator.share) {
                        navigator.share({ title: 'Sincronicidade de Almas · Astria', text }).catch(() => {})
                      } else {
                        navigator.clipboard.writeText(text).catch(() => {})
                      }
                    }}
                    className="mb-6 w-full rounded-xl border border-ethereal-silver/20 py-3 text-sm tracking-wider text-ethereal-silver/60 transition hover:border-stardust-gold/30 hover:text-stardust-gold/80"
                  >
                    ↑ Compartilhar Sincronicidade
                  </Motion.button>

                  {/* Refazer */}
                  <button
                    onClick={handleReset}
                    className="w-full text-center text-xs tracking-widest text-ethereal-silver/30 transition hover:text-ethereal-silver/60"
                  >
                    Calcular outra combinação
                  </button>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageShell>
    </div>
  )
}
