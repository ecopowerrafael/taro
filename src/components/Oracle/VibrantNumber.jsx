import React from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'

// Pulso dourado e brilho metálico
const goldPulse = keyframes`
  0% { text-shadow: 0 0 0 #ffe066, 0 0 0 #fffbe9; }
  40% { text-shadow: 0 0 24px #ffe066cc, 0 0 8px #fffbe9; }
  100% { text-shadow: 0 0 0 #ffe066, 0 0 0 #fffbe9; }
`
const metallicShine = keyframes`
  0% { background-position: -120px 0; }
  100% { background-position: 120px 0; }
`

const NumberWrap = styled(motion.div)`
  position: relative;
  display: inline-block;
  font-family: 'EB Garamond', serif;
  font-size: 5.5rem;
  font-weight: 700;
  color: #ffe066;
  letter-spacing: 0.04em;
  line-height: 1.1;
  filter: drop-shadow(0 0 18px #ffe06699);
  animation: ${goldPulse} 2.2s cubic-bezier(0.4,0,0.2,1) infinite;
  background: linear-gradient(92deg, #ffe066 0%, #fffbe9 40%, #bfa14a 60%, #ffe066 100%);
  background-size: 220px 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation-name: ${goldPulse};
  
  @media (max-width: 640px) {
    font-size: 4rem;
  }
  
  &::after {
    content: '';
    position: absolute;
    left: 0; top: 0; width: 100%; height: 100%;
    background: linear-gradient(100deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.01) 100%);
    background-size: 220px 100%;
    background-repeat: no-repeat;
    background-position: -120px 0;
    mix-blend-mode: lighten;
    pointer-events: none;
    animation: ${metallicShine} 2.8s linear infinite;
  }
`

export function VibrantNumber({ value }) {
  return (
    <NumberWrap
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 12 }}
    >
      {value}
    </NumberWrap>
  )
}
