import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, ArrowRight } from 'lucide-react'
import { usePlatformContext } from '../../context/platform-context'
import { NumerologyPurchaseModal } from './NumerologyPurchaseModal'
import { SacredInput } from './SacredInput'
import { NumerologyProcessingImmersive } from './NumerologyProcessingImmersive'
import { NumerologyResultArt } from './NumerologyResultArt'
import { FrequencyAlert } from './FrequencyAlert'
import { UpsellBlurredMap } from './UpsellBlurredMap'
import { GoldConfetti } from './GoldConfetti'
import styled, { keyframes } from 'styled-components'

const PanelContainer = styled(motion.div)`
  width: 100%;
  max-width: 540px;
  margin: 48px auto 0 auto;
  position: relative;
  border-radius: 2.2rem;
  background: rgba(25, 10, 40, 0.7);
  border: 1px solid;
  border-image: linear-gradient(90deg, #ffe066 0%, #bfa14a 100%);
  border-image-slice: 1;
  box-shadow: 0 0 32px 0 #a259ff44, 0 0 0 2px #a259ff22;
  overflow: visible;
  will-change: transform;
  z-index: 2;
  padding: 36px;
`
const auraPulse = keyframes`
  0% { box-shadow: 0 0 32px 0 #a259ff44, 0 0 0 2px #a259ff22; }
  50% { box-shadow: 0 0 48px 8px #a259ff77, 0 0 0 2px #ffe06633; }
  100% { box-shadow: 0 0 32px 0 #a259ff44, 0 0 0 2px #a259ff22; }
`
const Aura = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: 2.2rem;
  animation: ${auraPulse} 3.5s infinite;
`
const rotateBg = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`
const SacredBg = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  opacity: 0.05;
  pointer-events: none;
  width: 420px;
  height: 420px;
  animation: ${rotateBg} 120s linear infinite;
`

export function NumerologyWidget() {
  const { profile, token } = usePlatformContext()
  const [step, setStep] = useState('input') // 'input', 'loading', 'result'
  const [formData, setFormData] = useState({
    nomeCompleto: profile?.name || '',
    dataNascimento: profile?.birthDate?.split('T')[0] || ''
  })
  const [result, setResult] = useState(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const handleCalculate = async (e) => {
    e.preventDefault()
    setStep('loading')
    try {
      const response = await fetch('/api/numerology/preview', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao calcular numerologia')
      }

      // Simular delay para aumentar valor percebido
      setTimeout(() => {
        setResult(data.data)
        setStep('result')
      }, 4000) // 4 segundos
    } catch (err) {
      console.error('Erro ao calcular numerologia:', err)
      setStep('input')
    }
  }

  return (
    <>
      {/* Painel centralizado numerológico (Portal de Entrada) */}
      {step === 'input' && !showPurchaseModal && (
        <PanelContainer
          key="input-panel"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <Aura />
          <SacredBg>
            <svg width="420" height="420" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#ffe066" strokeWidth="0.5">
                {[...Array(7)].map((_, i) => (
                  <circle key={i} cx="210" cy="210" r={30 + i * 30} />
                ))}
                {[...Array(6)].map((_, i) => (
                  <circle key={i+10} cx={210 + 90 * Math.cos((i * Math.PI) / 3)} cy={210 + 90 * Math.sin((i * Math.PI) / 3)} r={90} />
                ))}
                <circle cx="210" cy="210" r="90" />
              </g>
            </svg>
          </SacredBg>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-mystic-gold/10 border border-mystic-gold/30">
                <Hash className="w-5 h-5 text-mystic-gold" />
              </div>
              <div>
                <h3 className="text-xl font-playfair text-white tracking-tight">Portal da Numerologia</h3>
                <p className="text-xs text-ethereal-silver/60 uppercase tracking-widest">Sincronize seus números</p>
              </div>
            </div>
            <p className="text-mystic-purple-light text-sm mb-8 leading-relaxed">
              Os astros e os números caminham juntos. Confirme seus dados para a análise numérica sagrada:
            </p>
            <form onSubmit={handleCalculate} className="space-y-5">
              <SacredInput
                label="Nome Completo de Registro"
                icon="user"
                type="text"
                required
                value={formData.nomeCompleto}
                onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })}
                placeholder="Seu nome completo"
              />
              <SacredInput
                label="Data de Nascimento"
                icon="calendar"
                type="date"
                required
                value={formData.dataNascimento}
                onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })}
              />
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(197,160,89,0.2)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-mystic-gold to-mystic-gold-light text-black font-bold uppercase tracking-[0.15em] text-xs shadow-lg flex items-center justify-center gap-2 group"
              >
                Calcular Minha Prévia Gratuita
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </form>
          </div>
        </PanelContainer>
      )}
      {/* Tela de processamento */}
      {step === 'loading' && (
        <NumerologyProcessingImmersive
          nome={formData.nomeCompleto}
          dataNascimento={formData.dataNascimento}
          onDone={() => setStep('result')}
        />
      )}
      {/* Tela de resultado */}
      {step === 'result' && result && (
        <ResultWithConfetti
          result={result}
          onUnlock={() => setShowPurchaseModal(true)}
        />
      )}
      {/* Modal de compra: só aparece sozinho */}
      {showPurchaseModal && (
        <NumerologyPurchaseModal
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => setShowPurchaseModal(false)}
          nomeCompleto={formData.nomeCompleto}
          dataNascimento={formData.dataNascimento}
          setFormData={setFormData}
          formData={formData}
        />
      )}
    </>
  )
}

// Wrapper para disparar confetti só na primeira visualização do resultado
function ResultWithConfetti({ result, onUnlock }) {
  const [showConfetti, setShowConfetti] = React.useState(false)
  const shown = React.useRef(false)
  React.useEffect(() => {
    if (!shown.current) {
      setShowConfetti(true)
      shown.current = true
      setTimeout(() => setShowConfetti(false), 2200)
    }
  }, [])
  return (
    <>
      <GoldConfetti trigger={showConfetti} />
      <NumerologyResultArt
        numero={result.caminho_vida.numero}
        titulo={result.caminho_vida.titulo}
        teaser={result.caminho_vida.teaser}
      />
      <FrequencyAlert
        desc={result.caminho_vida.alerta || 'Oscilações energéticas detectadas em seu ciclo atual. Recomenda-se atenção especial a padrões repetitivos e decisões importantes.'}
        onClick={() => alert('Em breve: dicas personalizadas para lidar com sua frequência!')}
      />
      <UpsellBlurredMap onUnlock={onUnlock} />
    </>
  )
}
// (Fim do arquivo)
