import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const TableContainer = styled(motion.div)`
  width: 100%;
  margin-top: 1.8rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  border: 1px solid #ffe06633;
  overflow: hidden;
  
  @media (max-width: 640px) {
    margin-top: 1.4rem;
  }
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  
  @media (max-width: 640px) {
    font-size: 0.9rem;
  }
`

const TableHeader = styled.thead`
  background: rgba(255, 224, 102, 0.08);
  border-bottom: 1px solid #ffe06633;
`

const TableHeaderCell = styled.th`
  color: #ffe066;
  padding: 0.8rem;
  text-align: left;
  font-weight: 600;
  letter-spacing: 0.01em;
  
  @media (max-width: 640px) {
    padding: 0.6rem;
  }
`

const TableBody = styled.tbody`
  tr:nth-child(odd) {
    background: rgba(255, 224, 102, 0.03);
  }
  
  tr:hover {
    background: rgba(255, 224, 102, 0.08);
  }
`

const TableRow = styled.tr`
  border-bottom: 1px solid #ffe06622;
  transition: background 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
`

const TableCell = styled.td`
  color: #fffbe9cc;
  padding: 0.8rem;
  
  @media (max-width: 640px) {
    padding: 0.6rem 0.5rem;
  }
  
  &:first-child {
    color: #ffe066;
    font-weight: 600;
    width: 35%;
  }
  
  &:nth-child(2) {
    color: #ffe06699;
    font-size: 0.9rem;
    width: 30%;
  }
`

const data = [
  {
    calculo: 'Número de Destino',
    base: 'Data de nascimento',
    revela: 'O propósito de vida, a missão e as lições a aprender.'
  },
  {
    calculo: 'Número de Expressão',
    base: 'Todas as letras do nome',
    revela: 'Seus talentos naturais e como você se manifesta no mundo.'
  },
  {
    calculo: 'Número de Motivação',
    base: 'Vogais do nome',
    revela: 'O que te impulsiona, seus desejos internos e essência emocional (a "alma").'
  },
  {
    calculo: 'Número de Impressão',
    base: 'Consoantes do nome',
    revela: 'Como os outros percebem você e a sua "fachada" social.'
  }
]

export function NumerologyInfoTable() {
  return (
    <TableContainer
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7 }}
    >
      <Table>
        <TableHeader>
          <tr>
            <TableHeaderCell>Cálculo</TableHeaderCell>
            <TableHeaderCell>Base de dados</TableHeaderCell>
            <TableHeaderCell>O que revela</TableHeaderCell>
          </tr>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.calculo}</TableCell>
              <TableCell>{row.base}</TableCell>
              <TableCell>{row.revela}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
