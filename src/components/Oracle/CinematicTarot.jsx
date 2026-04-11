import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Typewriter from 'typewriter-effect'
import { Sparkles, Heart, DollarSign, Users, Activity, RotateCcw, MessageCircle, AlertTriangle, Map, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlatformContext } from '../../context/platform-context'

const STATES = {
  INVITE: 'invite',
  SHUFFLING: 'shuffling',
  DRAWING: 'drawing',
  REVEALING: 'revealing',
  INTERPRETATION: 'interpretation'
}

const THEMES = [
  { id: 'Amor', label: 'Amor', icon: Heart, color: '#ff4d6d' },
  { id: 'Dinheiro', label: 'Dinheiro', icon: DollarSign, color: '#ffd700' },
  { id: 'Família', label: 'Família', icon: Users, color: '#4cc9f0' },
  { id: 'Saúde', label: 'Saúde', icon: Activity, color: '#70e000' }
]


export function CinematicTarot() {
  const { profile, token } = usePlatformContext()
  const [state, setState] = useState(STATES.INVITE)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [drawnCard, setDrawnCard] = useState(null)
  const [isHovered, setIsHovered] = useState(false)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  // Inicializar 78 cartas (apenas para a animação de explosão)
  useEffect(() => {
    const initialCards = Array.from({ length: 78 }).map((_, i) => ({
      id: i,
      rotation: Math.random() * 360,
      x: 0,
      y: 0,
      z: 0
    }))
    setCards(initialCards)
  }, [])

  // Ao montar, buscar carta já sorteada do ciclo
  useEffect(() => {
    async function fetchExistingCard() {
      setLoading(true)
      try {
        const response = await fetch('/api/tarot/tirar-carta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tema: 'Amor' }) // Tema padrão só para buscar carta já sorteada
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok && data && data.id) {
          setDrawnCard(data)
          setSelectedTheme(THEMES.find(t => t.id === data.tema) || null)
          setState(STATES.INTERPRETATION)
        }
      } catch (e) {
        // ignora
      }
      setLoading(false)
    }
    fetchExistingCard()
    // eslint-disable-next-line
  }, [token])

  const handleThemeSelect = async (theme) => {
    setSelectedTheme(theme)
    setState(STATES.SHUFFLING)

    // Simular o tempo de embaralhamento antes de chamar a API
    setTimeout(async () => {
      try {
        const response = await fetch('/api/tarot/tirar-carta', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tema: theme.id })
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao tirar carta')
        }

        setDrawnCard(data)
        setSelectedTheme(theme)
        // Mudar para o estado de tiragem após o "caos"
        setTimeout(() => {
          setState(STATES.DRAWING)
        }, 2000)
      } catch (error) {
        console.error('Erro ao tirar carta:', error)
        setState(STATES.INVITE)
      }
    }, 1500)
  }

  const handleCardClick = () => {
    if (state === STATES.DRAWING) {
      setState(STATES.REVEALING)
      setTimeout(() => {
        setState(STATES.INTERPRETATION)
      }, 2000)
    }
  }

  const reset = () => {
    setState(STATES.INVITE)
    setSelectedTheme(null)
    setDrawnCard(null)
  }

  return (
    <div className="relative w-full min-h-[600px] flex flex-col items-center justify-center overflow-hidden bg-transparent perspective-1000">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mystic-gold/5 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* ESTADO 1: O CONVITE */}
        {state === STATES.INVITE && !loading && (
          <motion.div 
            key="invite"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative flex flex-col items-center"
          >
            {/* Texto de instrução acima dos botões */}
            <div className="mb-4 text-center text-xs text-mystic-goldSoft font-semibold">
              Escolha o Tema que quer saber e pense forte na sua pergunta!
            </div>
            {/* Baralho Levitando */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotateZ: [-1, 1, -1]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="relative w-48 h-72 mb-12 shadow-2xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 rounded-xl border-2 border-mystic-gold/30 bg-black overflow-hidden shadow-[0_0_30px_rgba(197,160,89,0.2)]">
                <img src="/cartas/verso.png" alt="Verso" className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-tr from-mystic-gold/20 to-transparent pointer-events-none" />
              </div>
              {/* Efeito de profundidade do baralho */}
              <div className="absolute -right-1 top-1 bottom-1 w-2 bg-mystic-gold/10 rounded-r-lg blur-[1px]" />
            </motion.div>

            {/* Botões Dourados */}
            <div className="grid grid-cols-2 gap-4">
              {THEMES.map((theme) => {
                const Icon = theme.icon
                return (
                  <motion.button
                    key={theme.id}
                    whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${theme.color}40` }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleThemeSelect(theme)}
                    className="flex items-center gap-3 px-6 py-3 rounded-full border border-mystic-gold/50 bg-black/40 backdrop-blur-md text-white font-medium tracking-wider uppercase text-xs transition-all hover:border-mystic-gold group"
                  >
                    <Icon className="w-4 h-4 text-mystic-gold group-hover:scale-110 transition-transform" />
                    {theme.label}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ESTADO 2: A ESCOLHA E O CAOS (EMBARALHAR) */}
        {state === STATES.SHUFFLING && (
          <motion.div 
            key="shuffling"
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{ 
                  x: [
                    0, 
                    (Math.random() - 0.5) * window.innerWidth * 0.8, 
                    (Math.random() - 0.5) * 100,
                    0
                  ],
                  y: [
                    0, 
                    (Math.random() - 0.5) * window.innerHeight * 0.8, 
                    (Math.random() - 0.5) * 100,
                    0
                  ],
                  rotateY: [0, 360, 720],
                  rotateZ: [0, card.rotation, card.rotation * 2],
                  opacity: [1, 0.8, 0.5, 0],
                  scale: [1, 0.5, 0.3, 0]
                }}
                transition={{ 
                  duration: 2.5, 
                  ease: "easeInOut",
                  delay: i * 0.01 
                }}
                className="absolute w-24 h-36 rounded-lg overflow-hidden border border-mystic-gold/20"
              >
                <img src="/cartas/verso.png" alt="Card" className="w-full h-full object-cover" />
              </motion.div>
            ))}
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="z-50 text-mystic-gold font-playfair text-2xl italic tracking-widest animate-pulse"
            >
              Consultando o Destino...
            </motion.div>
          </motion.div>
        )}

        {/* ESTADO 3: A TIRAGEM */}
        {state === STATES.DRAWING && (
          <motion.div 
            key="drawing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ 
                rotateX: [-3, 3, -3],
                rotateY: [-5, 5, -5],
                rotateZ: [-1, 1, -1],
                y: [0, -15, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              onClick={handleCardClick}
              className="relative w-64 h-[400px] cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 rounded-2xl border-2 border-mystic-gold bg-black shadow-[0_0_60px_rgba(197,160,89,0.5)] overflow-hidden">
                <img src="/cartas/verso.png" alt="Verso" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-mystic-gold/20 via-transparent to-white/10 pointer-events-none" />
              </div>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 text-mystic-goldSoft text-sm uppercase tracking-[0.2em] font-bold animate-pulse"
            >
              Toque no Arcano para Revelar
            </motion.p>
          </motion.div>
        )}

        {/* ESTADO 4 & 5: A REVELAÇÃO E INTERPRETAÇÃO */}
        {(state === STATES.REVEALING || state === STATES.INTERPRETATION) && drawnCard && (
          <motion.div 
            key="revealing"
            className="flex flex-col lg:flex-row items-center justify-center gap-12 p-6 max-w-5xl"
          >
            {/* A CARTA REVELADA */}
            <motion.div
              initial={{ rotateY: 180, scale: 0.8, opacity: 0 }}
              animate={{ 
                rotateY: 0, 
                scale: 1, 
                opacity: 1,
                rotateZ: [-1, 1, -1]
              }}
              transition={{ 
                rotateY: { duration: 1.5, ease: "easeOut" },
                scale: { duration: 0.8 },
                opacity: { duration: 0.5 },
                rotateZ: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative w-64 h-[400px] flex-shrink-0"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Brilho de fundo */}
              <div className="absolute inset-0 bg-mystic-gold/20 blur-[60px] rounded-full scale-110" />
              
              <div className="relative h-full w-full rounded-2xl border-2 border-mystic-gold shadow-[0_0_40px_rgba(197,160,89,0.3)] overflow-hidden group">
                <img 
                  src={drawnCard.face_img} 
                  alt={drawnCard.id} 
                  className="w-full h-full object-cover"
                />
                {/* Overlay de luxo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10 pointer-events-none" />
              </div>
            </motion.div>

            {/* A INTERPRETAÇÃO */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col max-w-md"
            >
              <div className="inline-flex items-center gap-2 mb-4 text-mystic-goldSoft uppercase tracking-widest text-xs font-bold">
                {selectedTheme && <selectedTheme.icon className="w-4 h-4" />}
                <span>{selectedTheme?.label} • {drawnCard.nome || drawnCard.id.replace(/_/g, ' ')}</span>
              </div>

              <div className="glass-panel border border-mystic-gold/20 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-mystic-gold to-transparent opacity-50" />
                
                <h2 className="font-playfair text-3xl text-white mb-6">O Oráculo diz...</h2>
                
                <div className="text-amber-100/90 leading-relaxed italic text-lg min-h-[100px]">
                  {state === STATES.INTERPRETATION ? (
                    <Typewriter
                      options={{
                        delay: 30,
                        cursor: '✨',
                        autoStart: true,
                        loop: false,
                      }}
                      onInit={(typewriter) => {
                        typewriter.typeString(drawnCard.texto).start()
                      }}
                    />
                  ) : (
                    <div className="w-full h-2 bg-mystic-gold/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.5 }}
                        className="h-full bg-mystic-gold"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                    onClick={reset}
                    className="flex items-center gap-2 text-mystic-gold hover:text-white transition-colors text-sm uppercase tracking-widest font-bold group"
                  >
                    <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Nova Tiragem
                  </motion.button>

                  {state === STATES.INTERPRETATION && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 4 }}
                      className="w-full sm:w-auto"
                    >
                      <Link 
                        to="/consultores"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-mystic-gold/10 border border-mystic-gold/50 text-mystic-gold hover:bg-mystic-gold hover:text-black transition-all duration-500 text-xs font-bold uppercase tracking-widest group"
                      >
                        <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Falar com Consultor (R$ 1,97)
                      </Link>
                    </motion.div>
                  )}
                </div>

                {/* Alerta de Frequência / Astro Crítico */}
                {state === STATES.INTERPRETATION && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 5 }}
                    className="mt-10"
                  >
                    {!drawnCard.hasChart ? (
                      <Link 
                        to="/mapa-astral"
                        className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-mystic-gold/20 bg-mystic-gold/5 hover:bg-mystic-gold/10 transition-colors group text-center"
                      >
                        <div className="p-3 rounded-full bg-mystic-gold/10 border border-mystic-gold/30 group-hover:scale-110 transition-transform">
                          <Map className="w-6 h-6 text-mystic-gold" />
                        </div>
                        <div>
                          <h4 className="text-white font-playfair text-lg mb-1">Potencialize sua Leitura</h4>
                          <p className="text-ethereal-silver/60 text-xs uppercase tracking-widest">Complemente fazendo seu Mapa Astral Grátis</p>
                        </div>
                      </Link>
                    ) : drawnCard.criticalAstro ? (
                      <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <AlertTriangle className="w-12 h-12 text-red-500" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-red-400 font-bold">Alerta de Frequência</span>
                        </div>

                        <p className="text-white text-sm leading-relaxed mb-4">
                          {drawnCard.criticalAstro.interpretacao}
                        </p>

                        <Link 
                          to="/consultores"
                          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-mystic-gold font-bold hover:text-white transition-colors"
                        >
                          Saber como lidar com isso <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl border border-mystic-gold/20 bg-mystic-gold/5 text-center">
                        <p className="text-ethereal-silver/60 text-[10px] uppercase tracking-widest">Suas energias astrais estão em equilíbrio hoje</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  )
}
