import React from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

const topics = [
  'Ciclos Pessoais e Ano Universal',
  'Desafios Cármicos e Lições de Vida',
  'Números de Motivação e Expressão',
  'Mapa de Oportunidades Ocultas',
  'Influências Astrológicas Integradas',
  'Compatibilidade Vibracional',
  'Previsões para os próximos 12 meses',
  'Rituais e Recomendações Personalizadas',
]

const UpsellBox = styled(motion.div)`
  margin: 2.8rem auto 0 auto;
  max-width: 420px;
  background: rgba(25, 10, 40, 0.68);
  border-radius: 1.6rem;
  border: 1.5px solid #ffe06699;
  box-shadow: 0 2px 16px 0 #ffe06622;
  padding: 2.2rem 1.7rem 2.7rem 1.7rem;
  position: relative;
  z-index: 3;
  overflow: hidden;
`

const Topic = styled.div`
  color: #ffe066;
  font-family: 'EB Garamond', serif;
  font-size: 1.08rem;
  margin-bottom: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  filter: ${({ blur }) => `blur(${blur}px)`};
  opacity: ${({ blur }) => (blur > 0 ? 0.7 : 1)};
  transition: filter 0.4s, opacity 0.4s;
`

const shimmer = keyframes`
  0% { background-position: -120px 0; }
  100% { background-position: 120px 0; }
`

const UnlockButton = styled(motion.button)`
  width: 100%;
  margin-top: 2.2rem;
  padding: 1.1rem 0;
  border: none;
  border-radius: 1.2rem;
  background: linear-gradient(92deg, #ffe066 0%, #fffbe9 40%, #bfa14a 100%);
  background-size: 220px 100%;
  color: #2d1a00;
  font-family: 'EB Garamond', serif;
  font-weight: 700;
  font-size: 1.18rem;
  box-shadow: 0 2px 16px 0 #ffe06633;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  outline: none;
  transition: box-shadow 0.2s, filter 0.2s;
  filter: brightness(1.15);
  &:hover {
    filter: brightness(1.22);
  }
  &::after {
    content: '';
    position: absolute;
    top: 0; left: -60%; width: 60%; height: 100%;
    background: linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.01) 100%);
    transform: skewX(-18deg);
    pointer-events: none;
    animation: ${shimmer} 1.2s linear infinite;
  }
`

const LockIcon = styled(Lock)`
  margin-right: 10px;
  color: #bfa14a;
  transition: transform 0.4s, color 0.3s;
  ${({ open }) => open && `transform: rotate(-18deg) scale(1.18); color: #ffe066;`}
`

export function UpsellBlurredMap({ onUnlock }) {
  const [lockOpen, setLockOpen] = React.useState(false)
  return (
    <UpsellBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.7 }}
    >
      <div style={{ marginBottom: 18, color: '#ffe066', fontFamily: 'EB Garamond, serif', fontWeight: 700, fontSize: 18, textAlign: 'center' }}>
        Desbloqueie seu Mapa Numerológico Completo
      </div>
      {topics.map((t, i) => (
        <Topic key={i} blur={i > 3 ? (i - 3) * 2.5 : 0}>{t}</Topic>
      ))}
      <UnlockButton
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onMouseEnter={() => setLockOpen(true)}
        onMouseLeave={() => setLockOpen(false)}
        onClick={onUnlock}
      >
        <LockIcon size={22} open={lockOpen ? 1 : 0} />
        DESBLOQUEAR MAPA NUMEROLÓGICO COMPLETO
      </UnlockButton>
    </UpsellBox>
  )
}
