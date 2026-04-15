import React from 'react'
import { PageShell } from '../components/PageShell'
import { NumerologyWidget } from '../components/Oracle/NumerologyWidget'
import { Sparkles, Moon } from 'lucide-react'

export function NumerologiaPage() {
  return (
    <PageShell>
      <div className="container mx-auto px-6 py-8 flex flex-col items-center min-h-[80vh] pb-8">
        {/* Header Reduzido */}
        <div className="text-center mb-8 md:mb-12 relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-10 blur-xl">
            <Moon className="w-16 h-16 text-mystic-gold" />
          </div>
          
          <h1 className="font-playfair text-2xl md:text-5xl text-white mb-2 tracking-tighter">
            Mapa <span className="text-gradient-gold italic">Numerológico</span>
          </h1>
          
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-10 bg-mystic-gold/30" />
            <Sparkles className="w-4 h-4 text-mystic-gold animate-pulse" />
            <div className="h-px w-10 bg-mystic-gold/30" />
          </div>
        </div>

        {/* Numerology Experience */}
        <div className="w-full max-w-4xl glass-panel rounded-[40px] border border-stardust-gold/10 overflow-hidden shadow-2xl relative p-1 md:p-12">
          {/* Subtle Glow Corners */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-mystic-gold/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-mystic-gold/5 blur-3xl pointer-events-none" />
          
          <div className="py-4 md:py-10">
            <NumerologyWidget />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 md:mt-16 text-center text-ethereal-silver/40 text-sm max-w-lg">
          <p className="mb-4">
            A numerologia pitagórica revela a vibração sagrada que seu nome e nascimento 
            imprimem no tecido do universo.
          </p>
          <div className="h-px w-24 bg-mystic-gold/20 mx-auto" />
        </div>
      </div>
    </PageShell>
  )
}
