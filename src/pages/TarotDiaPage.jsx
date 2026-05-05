import React from 'react'
import { PageShell } from '../components/PageShell'
import { CinematicTarot } from '../components/Oracle/CinematicTarot'
import { Sparkles, Stars } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function TarotDiaPage() {
  const { t } = useTranslation()
  return (
    <PageShell>
      <div className="container mx-auto px-6 py-4 flex flex-col items-center min-h-[80vh]">
        {/* Header Reduzido */}
        <div className="text-center mb-8 relative">
          <h1 className="font-playfair text-3xl md:text-5xl text-white mb-2 tracking-tighter">
            {t('daily_card.title_prefix', 'Carta do')} <span className="text-gradient-gold italic">{t('daily_card.title_highlight', 'Dia')}</span>
          </h1>
          
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-mystic-gold/30" />
            <Sparkles className="w-4 h-4 text-mystic-gold animate-pulse" />
            <div className="h-px w-8 bg-mystic-gold/30" />
          </div>
        </div>

        {/* Cinematic Experience */}
        <div className="w-full max-w-6xl glass-panel rounded-[40px] border border-mystic-gold/10 overflow-hidden shadow-2xl relative">
          <div className="py-8 md:py-12">
            <CinematicTarot />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center text-ethereal-silver/40 text-sm max-w-lg">
          <p>
            {t('daily_card.footer_text', 'As interpretações do Tarot Astria são baseadas em sabedoria ancestral combinada com o fluxo energético do momento presente.')}
          </p>
        </div>
      </div>
    </PageShell>
  )
}
