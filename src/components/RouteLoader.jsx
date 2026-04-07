import { motion as Motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function RouteLoader({ message = 'Carregando experiencia...' }) {
  const [isStuck, setIsStuck] = useState(false)

  // Se a página fica carregando por mais de 10 segundos, mostra aviso
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStuck(true)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

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
          
          {isStuck && (
            <div className="mt-6 rounded-lg border border-amber-400/50 bg-amber-500/10 px-4 py-3">
              <p className="text-xs text-amber-200">
                ⚠️ Levando mais tempo que o esperado. Tentando novamente...
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs font-bold text-amber-300 underline transition hover:text-amber-200"
              >
                Recarregar página
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}