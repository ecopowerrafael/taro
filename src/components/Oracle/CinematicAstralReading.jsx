import { useState, useCallback, useMemo, useEffect } from 'react';
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
export function CinematicAstralReading({ planets, transits, mode = 'natal', lat, lng, onFinish }) {
  const [scene,       setScene]       = useState('map_zoom');
  const [planetIndex, setPlanetIndex] = useState(0);
  const [arrived,     setArrived]     = useState(false);
  const [textKey,     setTextKey]     = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;
  const mapHeight = isDesktop ? '87.5vh' : '100vh';
  const centerY   = isDesktop ? (window.innerHeight * 0.875) / 2 : window.innerHeight / 2;
  const centerYStr = isDesktop ? '43.75vh' : '50vh';

  // Filtra e ordena planetas conforme PLANET_ORDER
  const sortedItems = useMemo(() => {
    if (mode === 'daily') return transits || [];
    return PLANET_ORDER.map(name => planets?.find(p => p.name === name)).filter(Boolean);
  }, [planets, transits, mode]);

  const currentItem = sortedItems[planetIndex];
  
  // Lógica específica por modo
  const currentPlanet = mode === 'daily' ? currentItem?.transitPlanet : currentItem;
  const planetPt   = PLANET_NAMES_PT[currentPlanet?.name] || currentPlanet?.name;
  
  const signIdx    = Math.floor((Number(currentPlanet?.longitude) || 0) / 30);
  const signEn     = WESTERN_SIGNS[signIdx % 12];
  const signPt     = SIGN_NAMES_PT[signEn] || signEn;

  const interpretation = useMemo(() => {
    if (mode === 'daily') return currentItem?.interpretation?.text || '';
    if (!currentPlanet) return '';
    return getInterpretationText(currentPlanet.name, signEn, Boolean(currentPlanet.is_retrograde), currentPlanet.position);
  }, [mode, currentItem, currentPlanet, signEn]);

  const titleText = useMemo(() => {
    if (mode === 'daily') return `${currentItem?.interpretation?.title || 'Trânsito'}`;
    return `${planetPt} em ${signPt}`;
  }, [mode, currentItem, planetPt, signPt]);

  const handleMapReady = useCallback(() => {
    setScene('zodiac_rise');
    setTimeout(() => setScene('planet_scene'), 1800);
  }, []);

  const handleArrival = useCallback(() => {
    setArrived(true);
  }, []);

  const handleNext = () => {
    if (planetIndex < sortedItems.length - 1) {
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

  const isLastPlanet = planetIndex === sortedItems.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#05000A]">

      {/* Camada 0 — Mapa OSM */}
      <div style={{ height: mapHeight, position: 'relative', overflow: 'hidden' }}>
        <MapBackground
          lat={lat}
          lng={lng}
          onReady={handleMapReady}
          zoomOut={scene === 'grand_finale'}
        />
      </div>

      {/* Camada 10 — Poeira estelar */}
      <StarField />

      {/* Camada 20 — Roda zodiacal */}
      <ZodiacOverlay
        visible={scene !== 'map_zoom'}
        activeSign={scene === 'planet_scene' ? signEn : null}
        centerX={windowWidth / 2}
        centerY={centerY}
      />

      {/* Camada 25 — Planetas Natais em segundo plano (Modo Diário) */}
      {mode === 'daily' && planets && planets.length > 0 && scene === 'planet_scene' && (
        <div className="pointer-events-none opacity-30">
          {planets.map((p) => (
            <PlanetActor
              key={`natal-${p.name}`}
              planetName={p.name}
              degree={p.longitude}
              visible={true}
              centerY={centerY}
              isBackground={true}
            />
          ))}
        </div>
      )}

      {/* Camada 30 — Planeta ativo */}
      {scene === 'planet_scene' && currentPlanet && (
        <PlanetActor
          planetName={currentPlanet.name}
          degree={currentPlanet.longitude}
          visible={true}
          onArrival={handleArrival}
          centerY={centerY}
        />
      )}

      {/* Grand Finale */}
      {scene === 'grand_finale' && (
        <GrandFinale 
          planets={mode === 'daily' ? sortedItems.map(t => t.transitPlanet) : sortedItems} 
          onFinish={onFinish} 
          centerY={centerY} 
        />
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
            className="fixed left-0 right-0 z-40"
            style={{
              bottom: isDesktop ? 0 : '160px',
              height: isDesktop ? '12.5vh' : '25vh',
              background: 'rgba(5,0,10,0.96)',
              backdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(212,175,55,0.35)',
              overflowY: 'auto',
              padding: isDesktop ? '0 24px' : '16px 20px 20px',
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: isDesktop ? 'center' : 'initial',
              gap: isDesktop ? '0' : '12px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.7)'
            }}
          >
            {/* Desktop Navigation - Integrated into the bar */}
            {isDesktop && (
              <div className="flex items-center gap-4 pr-8 border-r border-mystic-gold/20 h-full">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-mystic-gold hover:text-mystic-goldSoft transition-colors font-serif uppercase tracking-widest text-xs"
                >
                  <ChevronLeft size={18} /> Voltar
                </button>
              </div>
            )}

            <div className={`${isDesktop ? 'px-8 flex items-center gap-6 flex-1' : 'mb-2'}`}>
              <div className={isDesktop ? 'flex-shrink-0 border-r border-mystic-gold/10 pr-6' : 'mb-2'}>
                <p className="text-mystic-gold font-serif text-lg mb-0 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
                  {titleText}
                </p>
                {(mode === 'daily' || currentPlanet?.is_retrograde) && (
                  <span className="text-[10px] text-amber-400 block uppercase tracking-tighter">
                    {mode === 'daily' ? `${planetPt} em ${signPt}` : 'Retrógrado'}
                  </span>
                )}
              </div>
              <div className="text-gray-300 text-sm leading-relaxed font-serif overflow-y-auto max-h-full py-2">
                <Typewriter
                  key={textKey}
                  onInit={(tw) => tw.typeString(interpretation).start()}
                  options={{ delay: 18, cursor: '✧' }}
                />
              </div>
            </div>

            {/* Desktop Next Button - Integrated */}
            {isDesktop && (
              <div className="pl-8 border-l border-mystic-gold/20 h-full flex items-center gap-6">
                <span className="text-[10px] text-amber-100/30 uppercase tracking-[0.2em] font-serif">
                  {planetIndex + 1} / {sortedItems.length}
                </span>
                <AnimatePresence>
                  {arrived && (
                    <motion.button
                      key="next-btn-desktop"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-mystic-gold text-mystic-dark rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:scale-105 transition-all"
                    >
                      {isLastPlanet ? 'Ver Resumo' : 'Próxima'} <ChevronRight size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camada 50 — Barra de navegação (Mobile Only) */}
      {scene === 'planet_scene' && !isDesktop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
          style={{
            bottom: '80px',
            height: '80px',
            background: 'rgba(5,0,10,0.85)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(212,175,55,0.2)',
            pointerEvents: 'none'
          }}
        >
          <div className="flex items-center justify-between w-full pointer-events-auto">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-mystic-gold border border-mystic-gold/40 rounded-full px-4 py-2 text-sm font-semibold hover:bg-mystic-gold/10 transition-all bg-black/40 backdrop-blur-md"
            >
              <ChevronLeft size={16} /> Voltar
            </button>

            <span className="text-xs text-amber-100/50 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
              {planetIndex + 1} / {sortedItems.length}
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
          </div>
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
