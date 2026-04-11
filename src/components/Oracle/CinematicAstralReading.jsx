import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Typewriter from 'typewriter-effect';
import { MapBackground } from './MapBackground';
import { ZodiacOverlay } from './ZodiacOverlay';
import { PlanetActor } from './PlanetActor';
import { GrandFinale } from './GrandFinale';
import { getInterpretationText } from '../../data/astrologyData';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const PLANET_ORDER = [
  'Sun','Moon','Mercury','Venus','Mars',
  'Jupiter','Saturn','Uranus','Neptune',
  'Rahu','Ketu','Ascendant',
];

const PLANET_NAMES_PT = {
  Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercúrio', Venus: 'Vênus',
  Mars: 'Marte', Jupiter: 'Júpiter', Saturn: 'Saturno',
  Uranus: 'Urano', Neptune: 'Netuno',
  Rahu: 'Rahu (Nodo Norte)', Ketu: 'Ketu (Nodo Sul)', Ascendant: 'Ascendente',
};

const SIGN_NAMES_PT = {
  Aries:'Áries', Taurus:'Touro', Gemini:'Gêmeos', Cancer:'Câncer',
  Leo:'Leão', Virgo:'Virgem', Libra:'Libra', Scorpio:'Escorpião',
  Sagittarius:'Sagitário', Capricorn:'Capricórnio', Aquarius:'Aquário', Pisces:'Peixes',
};

const WESTERN_SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

// Estrelas puras — sem lib externa
function StarField() {
  const stars = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      top:      `${Math.random() * 100}%`,
      left:     `${Math.random() * 100}%`,
      size:     Math.random() * 2 + 1,
      delay:    Math.random() * 4,
      duration: Math.random() * 3 + 2,
    })), []
  );

  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
      {stars.map(s => (
        <motion.div
          key={s.id}
          style={{
            position: 'absolute',
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,0.8)`,
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// CENAS: 'map_zoom' → 'zodiac_rise' → 'planet_scene' → 'grand_finale'
export function CinematicAstralReading({ planets, lat, lng, onFinish }) {
  const [scene,       setScene]       = useState('map_zoom');
  const [planetIndex, setPlanetIndex] = useState(0);
  const [arrived,     setArrived]     = useState(false);
  const [textKey,     setTextKey]     = useState(0);

  // Filtra e ordena planetas conforme PLANET_ORDER
  const sortedPlanets = useMemo(() =>
    PLANET_ORDER.map(name => planets.find(p => p.name === name)).filter(Boolean),
    [planets]
  );

  const currentPlanet = sortedPlanets[planetIndex];
  const signIdx    = Math.floor((Number(currentPlanet?.longitude) || 0) / 30);
  const signEn     = WESTERN_SIGNS[signIdx % 12];
  const signPt     = SIGN_NAMES_PT[signEn] || signEn;
  const planetPt   = PLANET_NAMES_PT[currentPlanet?.name] || currentPlanet?.name;
  const interpretation = currentPlanet
    ? getInterpretationText(currentPlanet.name, signEn, Boolean(currentPlanet.is_retrograde), currentPlanet.position)
    : '';

  const handleMapReady = useCallback(() => {
    setScene('zodiac_rise');
    setTimeout(() => setScene('planet_scene'), 1800);
  }, []);

  const handleArrival = useCallback(() => {
    setArrived(true);
  }, []);

  const handleNext = () => {
    if (planetIndex < sortedPlanets.length - 1) {
      setArrived(false);
      setTextKey(k => k + 1);
      setPlanetIndex(i => i + 1);
    } else {
      setScene('grand_finale');
    }
  };

  const handleBack = () => {
    if (planetIndex > 0) {
      setArrived(false);
      setTextKey(k => k + 1);
      setPlanetIndex(i => i - 1);
    } else {
      onFinish?.();
    }
  };

  const isLastPlanet = planetIndex === sortedPlanets.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#05000A]">

      {/* Camada 0 — Mapa OSM */}
      <MapBackground
        lat={lat}
        lng={lng}
        onReady={handleMapReady}
        zoomOut={scene === 'grand_finale'}
      />

      {/* Camada 10 — Poeira estelar */}
      <StarField />

      {/* Camada 20 — Roda zodiacal */}
      <ZodiacOverlay
        visible={scene !== 'map_zoom'}
        activeSign={scene === 'planet_scene' ? signEn : null}
      />

      {/* Camada 30 — Planeta ativo */}
      {scene === 'planet_scene' && currentPlanet && (
        <PlanetActor
          planetName={currentPlanet.name}
          degree={currentPlanet.longitude}
          visible={true}
          onArrival={handleArrival}
        />
      )}

      {/* Grand Finale */}
      {scene === 'grand_finale' && (
        <GrandFinale planets={sortedPlanets} onFinish={onFinish} />
      )}

      {/* Camada 40 — Painel de texto (bottom sheet) */}
      <AnimatePresence>
        {scene === 'planet_scene' && arrived && (
          <motion.div
            key={`text-${planetIndex}`}
            initial={{ y: 220, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 220, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-40"
            style={{
              height: '42vh',
              background: 'rgba(5,0,10,0.90)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(212,175,55,0.35)',
              overflowY: 'auto',
              padding: '20px 24px 96px',
            }}
          >
            <p className="text-mystic-gold font-serif text-lg mb-1 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
              {planetPt} em {signPt}
            </p>
            {currentPlanet?.is_retrograde && (
              <span className="text-xs text-amber-400 mb-2 block">Retrógrado</span>
            )}
            <div className="text-gray-300 text-sm leading-relaxed font-serif">
              <Typewriter
                key={textKey}
                onInit={(tw) => tw.typeString(interpretation).start()}
                options={{ delay: 28, cursor: '✧' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camada 50 — Barra de navegação */}
      {scene === 'planet_scene' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
          style={{
            background: 'rgba(5,0,10,0.75)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(212,175,55,0.2)',
          }}
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-mystic-gold border border-mystic-gold/40 rounded-full px-4 py-2 text-sm font-semibold hover:bg-mystic-gold/10 transition-all"
          >
            <ChevronLeft size={16} /> Voltar
          </button>

          <span className="text-xs text-amber-100/50">
            {planetIndex + 1} / {sortedPlanets.length}
          </span>

          <AnimatePresence>
            {arrived && (
              <motion.button
                key="next-btn"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: [1, 1.06, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
                onClick={handleNext}
                className="flex items-center gap-1 bg-mystic-gold text-mystic-dark rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wider shadow-[0_0_14px_rgba(255,215,0,0.4)] hover:scale-105"
              >
                {isLastPlanet
                  ? <><CheckCircle size={16} /> Ver Resumo</>
                  : <>Próxima Leitura <ChevronRight size={16} /></>
                }
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Loading inicial */}
      <AnimatePresence>
        {scene === 'map_zoom' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="text-6xl select-none"
            >
              ✦
            </motion.div>
            <p className="text-mystic-gold font-serif text-lg animate-pulse">
              Os astros estão se posicionando...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
