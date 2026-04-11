import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, User, Calendar, ArrowRight, Lock, Sparkles, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlatformContext } from '../../context/platform-context'

export function NumerologyWidget() {
  const { profile } = usePlatformContext()
  const [step, setStep] = useState('input') // 'input', 'loading', 'result'
  const [formData, setFormData] = useState({
    nomeCompleto: profile?.name || '',
    dataNascimento: profile?.birthDate?.split('T')[0] || ''
  })
  const [result, setResult] = useState(null)

  const handleCalculate = async (e) => {
    e.preventDefault()
    setStep('loading')
    
    try {
      const response = await fetch('/api/numerology/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      
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
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-mystic-goldSoft font-bold ml-1">Nome Completo de Registro</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-gold/40 group-focus-within:text-mystic-gold transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})}
                      className="w-full bg-black/40 border border-stardust-gold/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-mystic-gold/50 transition-all"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-mystic-goldSoft font-bold ml-1">Data de Nascimento</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-gold/40 group-focus-within:text-mystic-gold transition-colors" />
                    <input 
                      type="date" 
                      required
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                      className="w-full bg-black/40 border border-stardust-gold/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-mystic-gold/50 transition-all"
                    />
                  </div>
                </div>

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
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center text-center"
            >
              <div className="relative mb-8">
                <Loader2 className="w-16 h-16 text-mystic-gold animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-mystic-gold animate-pulse" />
              </div>
              <h3 className="text-2xl font-playfair text-white mb-2 italic">Sincronizando Numerologia...</h3>
              <p className="text-mystic-purple-light text-sm max-w-xs mx-auto">
                Mapeando as vibrações pitagóricas do seu nome e destino.
              </p>
            </motion.div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && result && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-8">
                <Sparkles className="w-4 h-4 text-mystic-gold" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-mystic-goldSoft font-bold">Sua Essência Numérica</span>
                <Sparkles className="w-4 h-4 text-mystic-gold" />
              </div>

              {/* Bento-like Grid for Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
                
                {/* Caminho da Vida - Destaque */}
                <div className="col-span-1 md:col-span-2 p-6 rounded-[24px] bg-gradient-to-br from-mystic-gold/10 to-transparent border border-mystic-gold/30 flex flex-col items-center text-center">
                  <div className="text-6xl font-display text-mystic-goldSoft mb-2 drop-shadow-gold">{result.caminho_vida.numero}</div>
                  <h4 className="text-lg font-playfair text-white mb-2">Seu Número de Destino: {result.caminho_vida.titulo}</h4>
                  <p className="text-sm text-ethereal-silver/80 leading-relaxed italic relative">
                    "{result.caminho_vida.teaser}"
                    <span className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </p>
                </div>

                {/* Expressão & Alma */}
                <div className="p-5 rounded-[24px] bg-black/40 border border-stardust-gold/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-mystic-goldSoft/60 mb-1">Expressão</span>
                    <span className="text-white text-sm font-medium">Talentos Naturais</span>
                  </div>
                  <div className="text-3xl font-display text-mystic-gold">{result.expressao.numero}</div>
                </div>

                <div className="p-5 rounded-[24px] bg-black/40 border border-stardust-gold/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-mystic-goldSoft/60 mb-1">Desejo da Alma</span>
                    <span className="text-white text-sm font-medium">Motivação Íntima</span>
                  </div>
                  <div className="text-3xl font-display text-mystic-gold">{result.desejo_alma.numero}</div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="w-full p-8 rounded-[24px] bg-mystic-purple/20 border border-mystic-gold/20 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-mystic-gold to-transparent opacity-50" />
                
                <h4 className="text-xl font-playfair text-white mb-4">Desvende seu Mapa Numerológico Completo</h4>
                
                <ul className="text-xs text-ethereal-silver/70 space-y-3 mb-8 text-left inline-block">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-mystic-gold" /> Ciclos de Vida e Desafios para 2026.</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-mystic-gold" /> Sua "máscara" social e a primeira impressão.</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-mystic-gold" /> Compatibilidade Numerológica Profunda.</li>
                </ul>

                <Link 
                  to="/numerologia"
                  className="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-mystic-gold transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  Desbloquear Mapa Completo
                </Link>
              </div>

              <button 
                onClick={() => setStep('input')}
                className="mt-6 text-[10px] text-ethereal-silver/40 uppercase tracking-widest hover:text-mystic-gold transition-colors"
              >
                Recalcular Dados
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
