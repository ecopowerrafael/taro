import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { getInterpretation } from '../../utils/numerologyInterpretations'

const Container = styled.div`
  width: 100%;
  margin-top: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 640px) {
    margin-top: 1.4rem;
    gap: 0.8rem;
  }
`

const NumberCard = styled(motion.div)`
  background: rgba(255, 224, 102, 0.05);
  border: 1.5px solid #ffe06644;
  border-radius: 1.2rem;
  padding: 1.2rem 1rem;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #ffe066aa;
    background: rgba(255, 224, 102, 0.1);
    box-shadow: 0 0 16px rgba(255, 224, 102, 0.15);
  }
  
  @media (max-width: 640px) {
    padding: 1rem 0.8rem;
  }
`

const NumberValue = styled.div`
  font-family: 'EB Garamond', serif;
  font-size: 2.8rem;
  font-weight: 700;
  color: #ffe066;
  margin-bottom: 0.6rem;
  line-height: 1;
  
  @media (max-width: 640px) {
    font-size: 2.2rem;
    margin-bottom: 0.4rem;
  }
`

const NumberLabel = styled.div`
  font-family: 'EB Garamond', serif;
  font-size: 0.95rem;
  color: #ffe066;
  font-weight: 600;
  margin-bottom: 0.6rem;
  letter-spacing: 0.01em;
  
  @media (max-width: 640px) {
    font-size: 0.85rem;
    margin-bottom: 0.4rem;
  }
`

const NumberDesc = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #fffbe9aa;
  margin: 0;
  line-height: 1.4;
  
  @media (max-width: 640px) {
    font-size: 0.8rem;
    line-height: 1.3;
  }
`

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
}

const numbers = [
  {
    label: 'Número de Destino',
    desc: 'Seu propósito de vida e o caminho que deve seguir'
  },
  {
    label: 'Número de Expressão',
    desc: 'Seus talentos naturais e como se manifesta'
  },
  {
    label: 'Número de Motivação',
    desc: 'Seus desejos internos e impulsos profundos'
  },
  {
    label: 'Número de Impressão',
    desc: 'Como os outros te percebem e sua fachada social'
  }
]

export function NumerologyFourNumbers({ destino, expressao, motivacao, impressao }) {
  const values = [destino, expressao, motivacao, impressao]
  const aspectNames = ['destino', 'expressao', 'motivacao', 'impressao']
  
  return (
    <Container
      as={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {values.map((value, idx) => (
        <NumberCard key={idx} variants={cardVariants}>
          <NumberValue>{value}</NumberValue>
          <NumberLabel>{numbers[idx].label}</NumberLabel>
          <NumberDesc>{getInterpretation(aspectNames[idx], value)}</NumberDesc>
        </NumberCard>
      ))}
    </Container>
  )
}
