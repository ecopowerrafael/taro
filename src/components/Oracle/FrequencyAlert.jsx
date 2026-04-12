import React from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

const pulseRadar = keyframes`
  0% { box-shadow: 0 0 0 0 #ffe06655, 0 0 0 0 #ffb30044; }
  60% { box-shadow: 0 0 0 8px #ffe06622, 0 0 0 16px #ffb30011; }
  100% { box-shadow: 0 0 0 0 #ffe06600, 0 0 0 0 #ffb30000; }
`

const AlertBox = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1.1rem;
  background: rgba(40, 20, 10, 0.82);
  border: 1.5px solid #ffb300cc;
  border-radius: 1.2rem;
  padding: 1.2rem 1.6rem;
  margin: 2.2rem auto 0 auto;
  max-width: 420px;
  box-shadow: 0 2px 16px 0 #ffb30022;
  position: relative;
  z-index: 4;
`

const RadarIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffe06622;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: ${pulseRadar} 1.6s infinite;
  box-shadow: 0 0 0 0 #ffe06655;
`

const AlertContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`

const AlertTitle = styled.div`
  color: #ffe066;
  font-family: 'EB Garamond', serif;
  font-size: 1.18rem;
  font-weight: 700;
  margin-bottom: 0.1rem;
  letter-spacing: 0.01em;
`

const AlertDesc = styled.div`
  color: #fffbe9cc;
  font-family: 'Inter', sans-serif;
  font-size: 1.01rem;
  margin-bottom: 0.2rem;
`

const ShineAnim = keyframes`
  0%, 100% { filter: brightness(1.1); opacity: 1; }
  50% { filter: brightness(2.2); opacity: 0.7; }
`

const AlertLink = styled.a`
  color: #ffe066;
  font-weight: 600;
  font-size: 1.01rem;
  text-decoration: underline;
  cursor: pointer;
  animation: ${ShineAnim} 1.2s infinite;
  letter-spacing: 0.01em;
  margin-top: 0.1rem;
  transition: color 0.2s;
  &:hover {
    color: #fffbe9;
    text-shadow: 0 0 8px #ffe06699;
  }
`

export function FrequencyAlert({ desc, onClick }) {
  return (
    <AlertBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.7 }}
    >
      <RadarIcon>
        <AlertTriangle size={28} color="#ffb300" fill="#ffe066" style={{ filter: 'drop-shadow(0 0 8px #ffe06699)' }} />
      </RadarIcon>
      <AlertContent>
        <AlertTitle>Interferência Vibracional Detectada</AlertTitle>
        <AlertDesc>{desc}</AlertDesc>
        <AlertLink onClick={onClick}>SABER COMO LIDAR COM ISSO →</AlertLink>
      </AlertContent>
    </AlertBox>
  )
}
