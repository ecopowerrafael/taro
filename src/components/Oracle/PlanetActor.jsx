import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PLANET_PNG = {
  Sun:       '/planets/sun.png',
  Moon:      '/planets/moon.png',
  Mercury:   '/planets/mercury.png',
  Venus:     '/planets/venus.png',
  Mars:      '/planets/mars.png',
  Jupiter:   '/planets/jupiter.png',
  Saturn:    '/planets/saturn.png',
  Uranus:    '/planets/uranus.png',
  Neptune:   '/planets/neptune.png',
  Rahu:      '/planets/rahu.png',
  Ketu:      '/planets/ketu.png',
  Ascendant: '/planets/ascendant.png',
};

export const PLANET_GLOW = {
  Sun:       '0 0 40px 20px rgba(255,200,0,0.45)',
  Moon:      '0 0 40px 20px rgba(180,180,255,0.35)',
  Mercury:   '0 0 40px 20px rgba(150,200,255,0.30)',
  Venus:     '0 0 40px 20px rgba(255,150,200,0.35)',
  Mars:      '0 0 40px 20px rgba(255,60,60,0.40)',
  Jupiter:   '0 0 40px 20px rgba(255,180,80,0.35)',
  Saturn:    '0 0 40px 20px rgba(200,160,255,0.30)',
  Uranus:    '0 0 40px 20px rgba(80,255,220,0.30)',
  Neptune:   '0 0 40px 20px rgba(60,100,255,0.35)',
  Rahu:      '0 0 40px 20px rgba(200,200,255,0.30)',
  Ketu:      '0 0 40px 20px rgba(180,255,180,0.25)',
  Ascendant: '0 0 40px 20px rgba(255,215,0,0.40)',
};

function degToRad(deg) {
  return (deg - 90) * (Math.PI / 180);
}

export function PlanetActor({ planetName, degree, visible, onArrival, centerY }) {
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    setArrived(false);
  }, [planetName]);

  const vmin = Math.min(window.innerWidth, window.innerHeight);
  const R    = 0.40 * vmin;
  const cx   = window.innerWidth  / 2;
  const cy   = centerY || window.innerHeight / 2;

  const rad     = degToRad(Number(degree) || 0);
  const targetX = cx + R * Math.cos(rad);
  const targetY = cy + R * Math.sin(rad);

  const src  = PLANET_PNG[planetName];
  const glow = PLANET_GLOW[planetName] || PLANET_GLOW.Sun;

  const handleAnimationComplete = () => {
    if (!arrived) {
      setArrived(true);
      onArrival?.();
    }
  };

  return (
    <AnimatePresence>
      {visible && src && (
        <motion.div
          key={planetName}
          initial={{ x: cx - 32, y: cy - 32, scale: 0, opacity: 0, rotate: 0 }}
          animate={{
            x: targetX - 32,
            y: targetY - 32,
            scale: [0, 1.4, 1],
            opacity: 1,
            rotate: [0, 360],
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          onAnimationComplete={handleAnimationComplete}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 30,
            width: 64,
            height: 64,
            pointerEvents: 'none',
            boxShadow: arrived ? glow : 'none',
            borderRadius: '50%',
            transition: 'box-shadow 0.5s ease',
          }}
        >
          <motion.img
            src={src}
            alt={planetName}
            style={{ width: 64, height: 64, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
            animate={arrived ? { scale: [1, 1.25, 1] } : {}}
            transition={arrived ? { duration: 0.6, ease: 'easeInOut' } : {}}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Versão estática para o Grand Finale (todos os planetas simultaneamente)
export function PlanetActorStatic({ planetName, degree, delay = 0, centerY }) {
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  const R    = 0.40 * vmin;
  const cx   = window.innerWidth  / 2;
  const cy   = centerY || window.innerHeight / 2;

  const rad     = degToRad(Number(degree) || 0);
  const targetX = cx + R * Math.cos(rad);
  const targetY = cy + R * Math.sin(rad);

  const src  = PLANET_PNG[planetName];
  const glow = PLANET_GLOW[planetName] || PLANET_GLOW.Sun;

  if (!src) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.8, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top:  targetY - 24,
        left: targetX - 24,
        zIndex: 30,
        width: 48,
        height: 48,
        pointerEvents: 'none',
        boxShadow: glow,
        borderRadius: '50%',
      }}
    >
      <img src={src} alt={planetName} style={{ width: 48, height: 48 }} />
    </motion.div>
  );
}
