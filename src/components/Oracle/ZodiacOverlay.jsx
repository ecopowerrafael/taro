import { motion } from 'framer-motion';

const SIGN_GLYPHS    = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_NAMES_PT  = ['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
const SIGN_NAMES_EN  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const R_OUTER = 42; // vmin
const R_LABEL = 37;
const R_LINE  = 42;

function degToRad(deg) { return (deg - 90) * (Math.PI / 180); }

export function ZodiacOverlay({ visible, activeSign }) {
  const activeIdx = SIGN_NAMES_EN.indexOf(activeSign);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      <motion.svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'visible' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={visible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        {/* Círculos externos */}
        <circle cx="50vw" cy="50vh" r={`${R_OUTER}vmin`} fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
        <circle cx="50vw" cy="50vh" r={`${R_OUTER * 0.55}vmin`} fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.2" />

        {SIGN_GLYPHS.map((glyph, i) => {
          const lineRad  = degToRad(i * 30);
          const x2 = 50 + R_LINE  * Math.cos(lineRad);
          const y2 = 50 + R_LINE  * Math.sin(lineRad);

          const labelRad = degToRad(i * 30 + 15);
          const lx = 50 + R_LABEL * Math.cos(labelRad);
          const ly = 50 + R_LABEL * Math.sin(labelRad);

          const isActive = i === activeIdx;

          return (
            <g key={i}>
              <line
                x1="50vw" y1="50vh"
                x2={`${x2}vmin`} y2={`${y2}vmin`}
                stroke="#D4AF37" strokeWidth="0.5" opacity="0.3"
              />
              <text
                x={`${lx}vmin`}
                y={`${ly}vmin`}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? '#FFD700' : '#D4AF37'}
                fontSize="3.5vmin"
                opacity={isActive ? 1 : 0.5}
                style={isActive ? { filter: 'drop-shadow(0 0 8px #FFD700)' } : {}}
              >
                {glyph}
              </text>
              <text
                x={`${lx}vmin`}
                y={`${ly + 4}vmin`}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? '#FFD700' : '#D4AF37'}
                fontSize="1.6vmin"
                opacity={isActive ? 0.9 : 0.35}
              >
                {SIGN_NAMES_PT[i]}
              </text>
            </g>
          );
        })}
      </motion.svg>
    </div>
  );
}
