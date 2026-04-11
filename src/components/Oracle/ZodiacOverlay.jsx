import { motion } from 'framer-motion';

const SIGN_GLYPHS    = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_NAMES_PT  = ['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
const SIGN_NAMES_EN  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const R_OUTER = 42; // vmin
const R_LABEL = 37;
const R_LINE  = 42;

function degToRad(deg) { return (deg - 90) * (Math.PI / 180); }

export function ZodiacOverlay({ visible, activeSign, centerX, centerY }) {
  const activeIdx = SIGN_NAMES_EN.indexOf(activeSign);
  const cx = centerX || window.innerWidth / 2;
  const cy = centerY || window.innerHeight / 2;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      <motion.svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'visible' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={visible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Círculos externos */}
        <circle cx={cx} cy={cy} r={`${R_OUTER}vmin`} fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.4" />
        <circle cx={cx} cy={cy} r={`${R_OUTER * 0.55}vmin`} fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.15" />

        {SIGN_GLYPHS.map((glyph, i) => {
          const lineRad  = degToRad(i * 30);
          const lx1 = cx + (R_OUTER * 0.55 * Math.min(window.innerWidth, window.innerHeight) / 100) * Math.cos(lineRad);
          const ly1 = cy + (R_OUTER * 0.55 * Math.min(window.innerWidth, window.innerHeight) / 100) * Math.sin(lineRad);
          const lx2 = cx + (R_LINE  * Math.min(window.innerWidth, window.innerHeight) / 100) * Math.cos(lineRad);
          const ly2 = cy + (R_LINE  * Math.min(window.innerWidth, window.innerHeight) / 100) * Math.sin(lineRad);

          const labelRad = degToRad(i * 30 + 15);
          const tx = cx + (R_LABEL * Math.min(window.innerWidth, window.innerHeight) / 100) * Math.cos(labelRad);
          const ty = cy + (R_LABEL * Math.min(window.innerWidth, window.innerHeight) / 100) * Math.sin(labelRad);

          const isActive = i === activeIdx;

          return (
            <g key={i}>
              <line
                x1={lx1} y1={ly1}
                x2={lx2} y2={ly2}
                stroke="#D4AF37" strokeWidth="0.5" opacity="0.25"
              />
              
              {/* Sign Glyph Container */}
              <g style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transformOrigin: `${tx}px ${ty}px`, transition: 'transform 0.5s ease' }}>
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isActive ? '#FFD700' : '#D4AF37'}
                  fontSize="4.2vmin"
                  opacity={isActive ? 1 : 0.45}
                  style={{ 
                    filter: isActive ? 'url(#glow)' : 'none',
                    fontFamily: 'serif',
                    transition: 'all 0.5s ease'
                  }}
                >
                  {glyph}
                </text>
                
                {isActive && (
                   <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    x={tx}
                    y={ty + (4.5 * Math.min(window.innerWidth, window.innerHeight) / 100)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#FFD700"
                    fontSize="1.8vmin"
                    style={{ fontFamily: 'serif', letterSpacing: '0.1em', fontWeight: 'bold' }}
                  >
                    {SIGN_NAMES_PT[i].toUpperCase()}
                  </motion.text>
                )}
              </g>
            </g>
          );
        })}
      </motion.svg>
    </div>
  );
}
