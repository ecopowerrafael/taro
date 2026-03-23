import { motion as Motion } from 'framer-motion'

export function TarotCard({ title, subtitle }) {
  return (
    <div className="perspective-1000">
      <Motion.div
        initial={{ rotateY: 180, opacity: 0.45 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-52 rounded-xl border border-stardust-gold/60 bg-gradient-to-br from-[#120a20] via-[#2a1845] to-[#0a070f] p-4 shadow-[0_15px_45px_rgba(0,0,0,0.45)]"
      >
        <div className="absolute inset-2 rounded-lg border border-stardust-gold/35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(229,231,235,0.25),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(197,160,89,0.25),transparent_35%)]" />
        <div className="relative flex h-full flex-col justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-ethereal-silver/75">Arcano em Revelação</p>
          <div>
            <p className="font-display text-3xl text-stardust-gold">{title}</p>
            <p className="mt-2 text-sm text-ethereal-silver/80">{subtitle}</p>
          </div>
          <p className="text-right font-display text-xl text-stardust-gold/80">✦</p>
        </div>
      </Motion.div>
    </div>
  )
}
