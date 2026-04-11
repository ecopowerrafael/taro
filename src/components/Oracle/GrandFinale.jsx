import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlanetActorStatic } from './PlanetActor';
import { Home, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLANET_ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Rahu','Ketu','Ascendant'];

function getCoords(degree, vmin, cx, cy) {
  const R   = 0.40 * vmin;
  const rad = (Number(degree) - 90) * (Math.PI / 180);
  return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
}

function getAspectColor(diff) {
  if (diff <= 8)                       return '#FFD700'; // conjunção
  if (Math.abs(diff - 60)  <= 6)      return '#44FF88'; // sextil
  if (Math.abs(diff - 90)  <= 6)      return '#FF4444'; // quadratura
  if (Math.abs(diff - 120) <= 8)      return '#4488FF'; // trígono
  if (Math.abs(diff - 180) <= 8)      return '#AA44FF'; // oposição
  return null;
}

export function GrandFinale({ planets, onFinish, centerY }) {
  const [showLines,  setShowLines]  = useState(false);
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();

  const vmin = Math.min(window.innerWidth, window.innerHeight);
  const cx   = window.innerWidth  / 2;
  const cy   = centerY || window.innerHeight / 2;

  const sorted = PLANET_ORDER
    .map(name => planets.find(p => p.name === name))
    .filter(Boolean);

  useEffect(() => {
    const t1 = setTimeout(() => setShowLines(true),  sorted.length * 150 + 2800);
    const t2 = setTimeout(() => setShowButton(true), sorted.length * 150 + 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [sorted.length]);

  // Calcular aspectos entre pares de planetas
  const aspects = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const diff       = Math.abs((Number(sorted[i].longitude) || 0) - (Number(sorted[j].longitude) || 0));
      const normalized = diff > 180 ? 360 - diff : diff;
      const color      = getAspectColor(normalized);
      if (color) {
        const a = getCoords(sorted[i].longitude, vmin, cx, cy);
        const b = getCoords(sorted[j].longitude, vmin, cx, cy);
        aspects.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, color });
      }
    }
  }

  return (
    <>
      {/* Linhas de aspecto — SVG sobre tudo */}
      <svg
        className="fixed inset-0 pointer-events-none"
        style={{ width: '100vw', height: '100vh', zIndex: 25 }}
      >
        {showLines && aspects.map((asp, i) => (
          <motion.line
            key={i}
            x1={asp.x1} y1={asp.y1}
            x2={asp.x2} y2={asp.y2}
            stroke={asp.color}
            strokeWidth="0.8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 1, delay: i * 0.08 }}
          />
        ))}
      </svg>

      {/* Todos os planetas com stagger */}
      {sorted.map((p, i) => (
        <PlanetActorStatic
          key={p.name}
          planetName={p.name}
          degree={p.longitude}
          delay={i * 0.15}
          centerY={cy}
        />
      ))}

      {/* Painel conclusivo */}
      {showButton && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center gap-4 p-6 pb-24 md:pb-10"
          style={{
            background: 'rgba(5,0,10,0.92)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(212,175,55,0.4)',
            boxShadow: '0 -15px 40px rgba(0,0,0,0.6)'
          }}
        >
          <p className="text-mystic-gold font-serif text-xl text-center drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            Seu Céu Natal está completo
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-3 w-full max-w-md">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 border border-mystic-gold/40 text-mystic-gold px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-mystic-gold/10 transition-all"
            >
              <Home size={18} /> Home
            </button>
            
            <button
              onClick={onFinish}
              className="w-full flex items-center justify-center gap-2 bg-mystic-gold text-mystic-dark px-6 py-3 rounded-full font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:scale-105 transition-transform"
            >
              <Sparkles size={18} /> Solicitar Mapa Completo
            </button>
          </div>
          
          <p className="text-amber-100/50 text-[10px] text-center uppercase tracking-widest mt-2">
            O mapa da sua essência foi traçado
          </p>
        </motion.div>
      )}
    </>
  );
}
