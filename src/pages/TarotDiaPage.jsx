import React from 'react'
import { PageShell } from '../components/PageShell'
import { CinematicTarot } from '../components/Oracle/CinematicTarot'
import { Sparkles, Stars } from 'lucide-react'

export function TarotDiaPage() {
  return (
    <PageShell>
      <div className="container mx-auto px-6 py-12 flex flex-col items-center min-h-[80vh]">
        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-20 blur-2xl">
            <Stars className="w-20 h-20 text-mystic-gold" />
          </div>
          
          <h1 className="font-playfair text-4xl md:text-6xl text-white mb-4 tracking-tighter">
            Carta do <span className="text-gradient-gold italic">Dia</span>
          </h1>
          <p className="text-mystic-purple-light text-lg max-w-xl mx-auto font-light">
            Conecte-se com as energias do Tarot Cinematográfico Astria. <br/>
            Escolha um tema e deixe o destino revelar seu caminho.
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="h-px w-12 bg-mystic-gold/30" />
            <Sparkles className="w-5 h-5 text-mystic-gold animate-pulse" />
            <div className="h-px w-12 bg-mystic-gold/30" />
          </div>
        </div>

        {/* Cinematic Experience */}
        <div className="w-full max-w-6xl glass-panel rounded-[40px] border border-mystic-gold/10 overflow-hidden shadow-2xl relative">
          {/* Subtle Glow Corners */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-mystic-gold/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-mystic-gold/5 blur-3xl pointer-events-none" />
          
          <div className="py-12 md:py-20">
            <CinematicTarot />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center text-ethereal-silver/40 text-sm max-w-lg">
          <p>
            As interpretações do Tarot Astria são baseadas em sabedoria ancestral 
            combinada com o fluxo energético do momento presente.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
