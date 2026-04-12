import React from 'react'
import styled, { keyframes } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { VibrantNumber } from './VibrantNumber'

// Gradiente de luz central
const LightBeam = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  width: 320px;
  height: 100%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center top, #ffe06655 0%, transparent 80%);
  pointer-events: none;
  z-index: 1;
`

const NebulaBg = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  background: linear-gradient(120deg, #1a0933 0%, #2d1a40 100%);
  overflow: hidden;
`

const GlassCard = styled(motion.div)`
  position: relative;
  margin: 0 auto;
  margin-top: 3.5rem;
  max-width: 520px;
  background: rgba(25, 10, 40, 0.7);
  border-radius: 2.2rem;
  border: 2px solid;
  border-image: linear-gradient(90deg, #ffe066 0%, #bfa14a 100%);
  border-image-slice: 1;
  box-shadow: 0 0 48px 0 #a259ff44, 0 0 0 2px #a259ff22;
  backdrop-filter: blur(18px);
  padding: 2.8rem 2.2rem 2.2rem 2.2rem;
  z-index: 2;
  overflow: visible;
`

const Seal = styled.div`
  position: absolute;
  left: 50%;
  top: -38px;
  transform: translateX(-50%);
  z-index: 3;
  width: 76px;
  height: 76px;
  background: radial-gradient(circle, #ffe066 60%, #bfa14a 100%);
  border-radius: 50%;
  box-shadow: 0 0 0 4px #fffbe933, 0 2px 16px 0 #ffe06633;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: #bfa14a;
  border: 2.5px solid #fffbe9cc;
  font-family: 'EB Garamond', serif;
  font-weight: 700;
  letter-spacing: 0.04em;
`

const Title = styled(motion.h2)`
  font-family: 'EB Garamond', serif;
  font-size: 2.1rem;
  color: #ffe066;
  text-align: center;
  margin-bottom: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 16px #ffe06633;
`

const Desc = styled.p`
  font-family: 'Inter', sans-serif;
  color: #fffbe9cc;
  font-size: 1.13rem;
  text-align: center;
  margin-bottom: 2.2rem;
  font-weight: 400;
`

export function NumerologyResultArt({ numero, titulo, teaser }) {
  return (
    <NebulaBg>
      <LightBeam />
      <GlassCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 120 }}
      >
        <Seal>🜁</Seal>
        <Title
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          Sua Identidade Cósmica Revelada
        </Title>
        <VibrantNumber value={numero} />
        <Desc style={{ marginTop: 18, marginBottom: 10 }}>
          <span style={{ fontFamily: 'EB Garamond, serif', fontWeight: 600, fontSize: 20, color: '#ffe066' }}>{titulo}</span>
        </Desc>
        <Desc style={{ fontSize: 16, color: '#fffbe9bb', fontStyle: 'italic', marginBottom: 0 }}>
          “{teaser}”
        </Desc>
      </GlassCard>
    </NebulaBg>
  )
}
