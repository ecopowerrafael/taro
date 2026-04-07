import { motion as Motion } from 'framer-motion'

export function RouteLoader({ message = 'Carregando experiencia...' }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(77,39,122,0.45),rgba(5,0,10,0.98)_58%)] px-6 text-mystic-gold">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.12),transparent_42%)]" />
      <div className="relative z-10 flex flex-col items-center gap-5 text-center">
        <Motion.img
          src="/mapa-astral.png"
          alt="Carregando mapa astral"
          className="h-28 w-28 object-contain drop-shadow-[0_0_28px_rgba(255,215,0,0.38)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
        />
        <div>
          <p className="font-display text-3xl text-mystic-goldSoft">Astria</p>
          <p className="mt-2 text-sm tracking-[0.18em] text-amber-100/70 uppercase">{message}</p>
        </div>
      </div>
    </div>
  )
}