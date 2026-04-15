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
  margin: 1.6rem auto 0 auto;
  max-width: 420px;
  width: 100%;
  background: rgba(25, 10, 40, 0.68);
  border-radius: 1.6rem;
  border: 1.5px solid #ffe06699;
  box-shadow: 0 2px 16px 0 #ffe06622;
  padding: 1.6rem 1.4rem 1.8rem 1.4rem;
  position: relative;
  z-index: 3;
  overflow: hidden;
  
  @media (max-width: 640px) {
    margin: 1.2rem auto 0 auto;
    padding: 1.3rem 1.1rem 1.5rem 1.1rem;
  }
`

const Topic = styled.div`
  color: #ffe066;
  font-family: 'EB Garamond', serif;
  font-size: 1rem;
  margin-bottom: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  filter: ${({ blur }) => `blur(${blur}px)`};
  opacity: ${({ blur }) => (blur > 0 ? 0.7 : 1)};
  transition: filter 0.4s, opacity 0.4s;
  
  @media (max-width: 640px) {
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }
`

const shimmer = keyframes`
  0% { background-position: -120px 0; }
  100% { background-position: 120px 0; }
`

const UnlockButton = styled(motion.button)`
  width: 100%;
  margin-top: 1.6rem;
  padding: 0.95rem 0;
  border: none;
  border-radius: 1.2rem;
  background: linear-gradient(92deg, #ffe066 0%, #fffbe9 40%, #bfa14a 100%);
  background-size: 220px 100%;
  color: #2d1a00;
  font-family: 'EB Garamond', serif;
  font-weight: 700;
  font-size: 1.05rem;
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
  
  @media (max-width: 640px) {
    margin-top: 1.2rem;
    padding: 0.8rem 0;
    font-size: 0.95rem;
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
  const displayedTopics = React.useMemo(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640 
      ? topics.slice(0, 4)
      : topics
  }, [])

  return (
    <UpsellBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.7 }}
    >
      <div style={{ marginBottom: 1.2, color: '#ffe066', fontFamily: 'EB Garamond, serif', fontWeight: 700, fontSize: '1rem', textAlign: 'center' }}>
        Desbloqueie seu Mapa Completo
      </div>
      {displayedTopics.map((t, i) => (
        <Topic key={i} blur={i > 3 ? (i - 3) * 2.5 : 0}>{t}</Topic>
      ))}
      <UnlockButton
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onMouseEnter={() => setLockOpen(true)}
        onMouseLeave={() => setLockOpen(false)}
        onClick={onUnlock}
      >
        <LockIcon size={20} open={lockOpen ? 1 : 0} />
        DESBLOQUEAR COMPLETO
      </UnlockButton>
    </UpsellBox>
  )
}
