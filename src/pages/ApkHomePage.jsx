import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlatformContext } from '../context/PlatformContext'
import { PageShell } from '../components/PageShell'
import { motion } from 'framer-motion'

export function ApkHomePage() {
  const { profile } = usePlatformContext()
  const navigate = useNavigate()

  const hasUsedFreeOracle = profile?.oracle_used_free || false

  return (
    <PageShell title="Seu Destino" subtitle="O que os astros revelam hoje?">
      <div className="grid gap-6 px-4 py-8 max-w-sm mx-auto relative z-10 w-full">
        
        {/* Card Principal - Ritual do Oráculo Astria */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/oraculo')}
          className="group relative flex flex-col items-center justify-center p-10 rounded-3xl border border-mystic-gold/40 bg-black/80 shadow-[0_0_20px_rgba(255,215,0,0.15)] transition-shadow hover:shadow-[0_0_35px_rgba(255,215,0,0.3)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-mystic-purple/30 via-transparent to-black/80 opacity-80 pointer-events-none" />
          
          <img src="/oraculo-astria.png" alt="Oráculo Astria" className="relative z-10 w-28 h-28 mb-4 object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
          <h3 className="relative z-10 font-serif text-2xl text-mystic-gold tracking-widest uppercase font-bold text-center leading-tight">
            Consultar<br/>Oráculo Astria
          </h3>
          
          {!hasUsedFreeOracle && (
             <div className="mt-4 px-5 py-2 rounded-full bg-gradient-to-r from-mystic-gold/20 via-mystic-gold/40 to-mystic-gold/20 border border-mystic-gold/60 relative z-10 shadow-[0_0_15px_rgba(255,215,0,0.3)] animate-pulse">
               <span className="text-xs font-bold text-mystic-gold uppercase tracking-[0.1em] drop-shadow-md">
                 🔮 Primeira Consulta Grátis
               </span>
             </div>
          )}
        </motion.button>

        {/* Botões Secundários */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mt-2"
        >
          <button
            onClick={() => navigate('/consultores')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-mystic-gold/20 bg-black/50 hover:bg-mystic-gold/10 transition-colors shadow-lg backdrop-blur-sm"
          >
            <img src="/especialistas-reais.png" alt="Consultores" className="w-12 h-12 mb-3 object-contain drop-shadow-md" />
            <span className="text-sm font-medium text-amber-50 uppercase tracking-wide">Tarólogos</span>
          </button>
          
          <button
            onClick={() => navigate('/recarregar')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-mystic-gold/20 bg-black/50 hover:bg-mystic-gold/10 transition-colors shadow-lg backdrop-blur-sm"
          >
            <img src="/economia.png" alt="Recarregar" className="w-12 h-12 mb-3 object-contain drop-shadow-md" />
            <span className="text-sm font-medium text-amber-50 uppercase tracking-wide">Recarregar</span>
          </button>

          <button
            onClick={() => navigate('/seja-consultor')}
            className="col-span-2 flex flex-col justify-center items-center p-4 rounded-xl border border-mystic-gold/20 bg-black/40 hover:bg-mystic-gold/10 transition-colors shadow-lg backdrop-blur-sm"
          >
            <span className="flex items-center gap-3">
              <img src="/seja-um-consultor.png" alt="Seja Consultor" className="w-10 h-10 object-contain drop-shadow-md" />
               <span className="text-xs font-bold text-amber-50 uppercase tracking-wider">
                 Trabalhe Conosco
               </span>
            </span>
          </button>
        </motion.div>
      </div>
    </PageShell>
  )
}
