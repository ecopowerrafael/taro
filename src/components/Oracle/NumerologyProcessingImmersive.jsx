import React, { useEffect, useState, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'

// --- Styled Components ---
const GlassContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: rgba(25, 10, 40, 0.7);
  border-radius: 2.2rem;
  border: 1px solid;
  border-image: linear-gradient(90deg, #ffe066 0%, #bfa14a 100%);
  border-image-slice: 1;
  box-shadow: 0 0 32px 0 #a259ff44, 0 0 0 2px #a259ff22;
  backdrop-filter: blur(20px);
  overflow: hidden;
  will-change: transform;
  padding: 2.5rem 1.5rem 2.2rem 1.5rem;
  z-index: 2;
`

const MandalaWrapper = styled.div`
  position: relative;
  width: 220px;
  height: 220px;
  margin: 0 auto 2.5rem auto;
  z-index: 2;
`

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const MandalaSVG = styled.svg`
  position: absolute;
  left: 0; top: 0;
  width: 220px;
  height: 220px;
  stroke: #ffe066;
  stroke-width: 0.7;
  opacity: 0.95;
  animation: ${rotate} 18s linear infinite;
  filter: drop-shadow(0 0 8px #ffe06655);
`

const NumbersOrbit = styled.div`
  position: absolute;
  left: 0; top: 0;
  width: 220px;
  height: 220px;
  pointer-events: none;
  z-index: 3;
`

const morph = keyframes`
  0% { opacity: 0; filter: blur(8px); }
  10% { opacity: 1; filter: blur(0); }
  90% { opacity: 1; filter: blur(0); }
  100% { opacity: 0; filter: blur(8px); }
`

const MorphNumber = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 3.7rem;
  color: #ffe066;
  font-family: 'EB Garamond', serif;
  font-weight: 700;
  text-shadow: 0 0 16px #ffe06699;
  animation: ${morph} 1.2s linear infinite;
  z-index: 4;
`

const TerminalLog = styled.div`
  background: rgba(0,0,0,0.18);
  border-radius: 1.2rem;
  border: 1px solid #ffe06622;
  color: #ffe066cc;
  font-family: 'Fira Mono', 'Consolas', monospace;
  font-size: 1.01rem;
  padding: 1.1rem 1.2rem;
  margin: 2.2rem 0 1.2rem 0;
  min-height: 90px;
  box-shadow: 0 2px 12px 0 #ffe06611;
  z-index: 2;
  white-space: pre-line;
  overflow: hidden;
`

const ParticlesBg = styled.div`
  position: absolute;
  left: 0; top: 0; width: 100%; height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
`

const Particle = styled.div`
  position: absolute;
  font-size: ${({ size }) => size || 1.1}rem;
  color: #ffe066cc;
  opacity: 0.18;
  filter: blur(${({ blur }) => blur || 0}px);
  left: ${({ left }) => left}%;
  bottom: ${({ bottom }) => bottom}%;
  animation: floatUp ${({ duration }) => duration}s linear infinite;
  @keyframes floatUp {
    0% { transform: translateY(0); opacity: 0.18; }
    80% { opacity: 0.22; }
    100% { transform: translateY(-120vh); opacity: 0; }
  }
`

const ProgressBar = styled.div`
  position: absolute;
  left: 0; bottom: 0;
  width: ${({ progress }) => progress}%;
  height: 2px;
  background: linear-gradient(90deg, #ffe066 0%, #bfa14a 100%);
  border-radius: 2px;
  transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
  z-index: 10;
`

const Seal = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.98rem;
  color: #ffe066cc;
  margin-top: 1.2rem;
  opacity: 0.85;
  font-family: 'EB Garamond', serif;
  letter-spacing: 0.01em;
  justify-content: center;
`

// --- Main Component ---
export function NumerologyProcessingImmersive({ nome, dataNascimento, onDone }) {
  // Log de etapas
  const etapas = [
    `Convertendo nome '${nome}' para escala Pitagórica...`,
    `Analisando frequência da Data de Nascimento: ${dataNascimento}...`,
    'Calculando Número de Destino e Missão de Vida...',
    'Cruzando dados com efemérides astronômicas do período...',
    'Finalizando diagnóstico numerológico...'
  ]
  const [logIndex, setLogIndex] = useState(0)
  const [log, setLog] = useState([`Iniciando mapeamento...`])
  const [progress, setProgress] = useState(0)
  const [morphNum, setMorphNum] = useState(1)
  const [orbitAngle, setOrbitAngle] = useState(0)
  const intervalRef = useRef()

  // Log animado
  useEffect(() => {
    if (logIndex < etapas.length) {
      const t = setTimeout(() => {
        setLog(l => [...l, etapas[logIndex]])
        setLogIndex(i => i + 1)
        setProgress(p => Math.min(100, p + 18))
      }, 1500)
      return () => clearTimeout(t)
    } else {
      // Finaliza após 2s
      const t = setTimeout(() => {
        setProgress(100)
        onDone && onDone()
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [logIndex])

  // Morph dos números centrais
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMorphNum(n => (n % 9) + 1)
      setOrbitAngle(a => a + 8)
    }, 350)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Partículas de fundo
  const [particles] = useState(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      left: Math.random() * 100,
      bottom: Math.random() * 100,
      size: 0.9 + Math.random() * 1.2,
      blur: Math.random() * 2.5,
      duration: 7 + Math.random() * 7,
      delay: Math.random() * 5,
      num: Math.ceil(Math.random() * 9)
    }))
  })

  // Números orbitando
  const orbitNumbers = Array.from({ length: 9 }, (_, i) => {
    const angle = ((orbitAngle + i * 40) % 360) * (Math.PI / 180)
    const r = 80
    return {
      x: 110 + r * Math.cos(angle),
      y: 110 + r * Math.sin(angle),
      num: i + 1
    }
  })

  return (
    <GlassContainer>
      <ParticlesBg>
        {particles.map((p, i) => (
          <Particle
            key={i}
            left={p.left}
            bottom={p.bottom}
            size={p.size}
            blur={p.blur}
            duration={p.duration}
            style={{ animationDelay: `${p.delay}s` }}
          >
            {p.num}
          </Particle>
        ))}
      </ParticlesBg>
      <MandalaWrapper>
        <MandalaSVG viewBox="0 0 220 220" fill="none">
          {[...Array(4)].map((_, i) => (
            <circle key={i} cx="110" cy="110" r={40 + i * 25} />
          ))}
          {/* Flor da Vida básica */}
          {[...Array(6)].map((_, i) => (
            <circle key={i+10} cx={110 + 40 * Math.cos((i * Math.PI) / 3)} cy={110 + 40 * Math.sin((i * Math.PI) / 3)} r={40} />
          ))}
          <circle cx="110" cy="110" r="40" />
        </MandalaSVG>
        <NumbersOrbit>
          {orbitNumbers.map((n, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                left: n.x,
                top: n.y,
                fontSize: 22,
                color: '#ffe066',
                opacity: 0.7,
                fontFamily: 'EB Garamond, serif',
                fontWeight: 600,
                textShadow: '0 0 8px #ffe06699',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
              animate={{ scale: progress > 90 ? 1.25 : 1, opacity: progress > 90 ? 0.2 : 0.7 }}
              transition={{ duration: 0.7 }}
            >
              {n.num}
            </motion.div>
          ))}
        </NumbersOrbit>
        <MorphNumber key={morphNum}>{morphNum}</MorphNumber>
      </MandalaWrapper>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ color: '#ffe066', fontFamily: 'EB Garamond, serif', fontSize: 26, textAlign: 'center', marginBottom: 8 }}
      >
        A Dança dos Números Sagrados
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        style={{ color: '#ffe066cc', fontSize: 15, textAlign: 'center', marginBottom: 0 }}
      >
        Sincronizando Numerologia
      </motion.p>
      <TerminalLog>
        {log.map((l, i) => (
          <span key={i}>{l}{i < log.length - 1 ? '\n' : ''}</span>
        ))}
      </TerminalLog>
      <ProgressBar progress={progress} />
      <Seal>
        <span style={{ fontSize: 18, color: '#ffe066' }}>🔒</span>
        <span>[Selo Dourado] Algoritmo Pitagórico Verificado</span>
      </Seal>
    </GlassContainer>
  )
}
