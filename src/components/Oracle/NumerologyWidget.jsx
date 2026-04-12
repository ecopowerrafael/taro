import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, User, Calendar, ArrowRight, Lock, Sparkles, Loader2, AlertTriangle, Map } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlatformContext } from '../../context/platform-context'
import { NumerologyPurchaseModal } from './NumerologyPurchaseModal'
import { SacredInput } from './SacredInput'
import { NumerologyProcessingImmersive } from './NumerologyProcessingImmersive'
import { NumerologyResultArt } from './NumerologyResultArt'
import { FrequencyAlert } from './FrequencyAlert'
import { UpsellBlurredMap } from './UpsellBlurredMap'
import { GoldConfetti } from './GoldConfetti'

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
      }, 2000)
    } catch (err) {
      console.error('Erro ao calcular numerologia:', err)
      setStep('input')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel border border-stardust-gold/20 rounded-[32px] overflow-hidden shadow-2xl relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-mystic-gold/5 blur-3xl pointer-events-none" />
      
      <div className="p-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: INPUT */}
          {step === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
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
            </motion.div>
          )}

          {/* STEP 2: LOADING */}
          {step === 'loading' && (
            <NumerologyProcessingImmersive
              nome={formData.nomeCompleto}
              dataNascimento={formData.dataNascimento}
              onDone={() => setStep('result')}
            />
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && result && (
            <ResultWithConfetti
              result={result}
              setShowPurchaseModal={setShowPurchaseModal}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Wrapper para disparar confetti só na primeira visualização do resultado
function ResultWithConfetti({ result, setShowPurchaseModal }) {
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
      <UpsellBlurredMap onUnlock={() => setShowPurchaseModal(true)} />
    </>
  )
}
// (Fim do arquivo)
        </AnimatePresence>
      </div>
    </div>
  )
}
// (Fim do arquivo)
