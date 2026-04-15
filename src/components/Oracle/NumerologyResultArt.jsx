import React from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { VibrantNumber } from './VibrantNumber'

const NebulaBg = styled.div`
  position: relative;
  z-index: 0;
  background: transparent;
  overflow: visible;
  margin-top: 1.5rem;
  
  @media (max-width: 640px) {
    margin-top: 1rem;
  }
`

const GlassCard = styled(motion.div)`
  position: relative;
  margin: 0 auto;
  margin-top: 1.8rem;
  max-width: 520px;
  width: 100%;
  background: rgba(25, 10, 40, 0.7);
  border-radius: 2.2rem;
  border: 2px solid #ffe066;
  box-shadow: 0 0 48px 0 #a259ff44, 0 0 0 2px #a259ff22, inset 0 0 20px 0 #ffe06611;
  backdrop-filter: blur(18px);
  padding: 1.8rem 1.6rem 1.8rem 1.6rem;
  z-index: 2;
  overflow: visible;
  
  @media (max-width: 640px) {
    padding: 1.2rem 1rem 1.2rem 1rem;
    margin-top: 1rem;
  }
`

const Seal = styled.div`
  position: absolute;
  left: 50%;
  top: -28px;
  transform: translateX(-50%);
  z-index: 3;
  width: 56px;
  height: 56px;
  background: radial-gradient(circle, #ffe066 60%, #bfa14a 100%);
  border-radius: 50%;
  box-shadow: 0 0 0 4px #fffbe933, 0 2px 16px 0 #ffe06633;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #bfa14a;
  border: 2.5px solid #fffbe9cc;
  font-family: 'EB Garamond', serif;
  font-weight: 700;
  letter-spacing: 0.04em;
  
  @media (max-width: 640px) {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
    top: -24px;
  }
`

const Title = styled(motion.h2)`
  font-family: 'EB Garamond', serif;
  font-size: 1.8rem;
  color: #ffe066;
  text-align: center;
  margin-bottom: 0.8rem;
  margin-top: 0.4rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 16px #ffe06633;
  
  @media (max-width: 640px) {
    font-size: 1.4rem;
    margin-bottom: 0.6rem;
    margin-top: 0.2rem;
  }
`

const Desc = styled.p`
  font-family: 'Inter', sans-serif;
  color: #fffbe9cc;
  font-size: 1rem;
  text-align: center;
  margin-bottom: 1.2rem;
  font-weight: 400;
  
  @media (max-width: 640px) {
    font-size: 0.95rem;
    margin-bottom: 0.8rem;
  }
`

export function NumerologyResultArt({ numero, titulo, teaser }) {
  return (
    <NebulaBg>
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
          Sua Identidade Cósmica
        </Title>
        <VibrantNumber value={numero} />
        <Desc style={{ marginTop: '1rem', marginBottom: '0.8rem' }}>
          <span style={{ fontFamily: 'EB Garamond, serif', fontWeight: 600, fontSize: '1.1rem', color: '#ffe066' }}>{titulo}</span>
        </Desc>
        <Desc style={{ fontSize: '0.95rem', color: '#fffbe9bb', fontStyle: 'italic', marginBottom: 0 }}>
          “{teaser}”
        </Desc>
      </GlassCard>
    </NebulaBg>
  )
}
