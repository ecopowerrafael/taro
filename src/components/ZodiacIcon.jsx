const glyphBySign = {
  Áries: '♈',
  Touro: '♉',
  Gêmeos: '♊',
  Câncer: '♋',
  Leão: '♌',
  Virgem: '♍',
  Libra: '♎',
  Escorpião: '♏',
  Sagitário: '♐',
  Capricórnio: '♑',
  Aquário: '♒',
  Peixes: '♓',
}

export function ZodiacIcon({ sign, className = 'h-10 w-10' }) {
  const glyph = glyphBySign[sign] ?? '✦'

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`Signo ${sign ?? 'desconhecido'}`}
    >
      <defs>
        <linearGradient id={`gold-gradient-${sign}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0C27A" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="#1A0B2E" stroke="#C5A059" strokeWidth="2.5" />
      <circle
        cx="50"
        cy="50"
        r="37"
        fill="none"
        stroke={`url(#gold-gradient-${sign})`}
        strokeWidth="1.5"
        opacity="0.7"
      />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="36"
        fill={`url(#gold-gradient-${sign})`}
        fontFamily="serif"
      >
        {glyph}
      </text>
    </svg>
  )
}
