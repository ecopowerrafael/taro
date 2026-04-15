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
  gap: 0.8rem;
  background: rgba(40, 20, 10, 0.82);
  border: 1.5px solid #ffb300cc;
  border-radius: 1.2rem;
  padding: 1rem 1.2rem;
  margin: 1.6rem auto 0 auto;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 2px 16px 0 #ffb30022;
  position: relative;
  z-index: 4;
  
  @media (max-width: 640px) {
    gap: 0.7rem;
    padding: 0.9rem 1rem;
    margin: 1.2rem auto 0 auto;
  }
`

const RadarIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffe06622;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  animation: ${pulseRadar} 1.6s infinite;
  box-shadow: 0 0 0 0 #ffe06655;
  
  @media (max-width: 640px) {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
  }
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
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
  letter-spacing: 0.01em;
  
  @media (max-width: 640px) {
    font-size: 0.95rem;
    margin-bottom: 0.15rem;
  }
`

const AlertDesc = styled.div`
  color: #fffbe9cc;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  margin-bottom: 0.3rem;
  
  @media (max-width: 640px) {
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
`

const ShineAnim = keyframes`
  0%, 100% { filter: brightness(1.1); opacity: 1; }
  50% { filter: brightness(2.2); opacity: 0.7; }
`

const AlertLink = styled.a`
  color: #ffe066;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: underline;
  cursor: pointer;
  animation: ${ShineAnim} 1.2s infinite;
  letter-spacing: 0.01em;
  margin-top: 0.15rem;
  transition: color 0.2s;
  display: inline-block;
  &:hover {
    color: #fffbe9;
    text-shadow: 0 0 8px #ffe06699;
  }
  
  @media (max-width: 640px) {
    font-size: 0.9rem;
    margin-top: 0.1rem;
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
