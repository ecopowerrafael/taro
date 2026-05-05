import { useEffect, useRef, useState } from 'react'
import { Sparkles, WalletCards } from 'lucide-react'
import { motion as Motion } from 'framer-motion'
import { GlassCard } from './GlassCard'
import { useTranslation } from 'react-i18next'

function useAnimatedNumber(target, duration = 700) {
  const [value, setValue] = useState(target)
  const previousRef = useRef(target)

  useEffect(() => {
    const start = previousRef.current
    const change = target - start
    if (change === 0) {
      return undefined
    }

    let animationFrame = 0
    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setValue(start + change * eased)

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step)
      } else {
        previousRef.current = target
      }
    }

    animationFrame = window.requestAnimationFrame(step)

    return () => {
      window.cancelAnimationFrame(animationFrame)
    }
  }, [duration, target])

  return value
}

export function ClientDashboard({ profile, minutesBalance, dailyHoroscope, onRecharge }) {
  const { t } = useTranslation()
  const animatedBalance = useAnimatedNumber(minutesBalance, 850)

  return (
    <GlassCard
      title={t('client_dashboard.title', 'Dashboard do Cliente')}
      subtitle={profile ? `${t('client_dashboard.welcome', 'Bem-vindo')}, ${profile.name}` : t('client_dashboard.subtitle_guest', 'Faça cadastro para personalizar sua experiência')}
      action={
        <button
          onClick={onRecharge}
          className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/60 bg-black/25 px-3 py-2 text-sm text-mystic-goldSoft transition hover:bg-black/40"
        >
          <WalletCards size={16} />
          {t('recharge.page_title', 'Recarregar Saldo')}
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">{t('client_dashboard.current_balance', 'Saldo atual')}</p>
          <Motion.p
            key={minutesBalance}
            initial={{ scale: 0.96, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="mt-2 font-display text-4xl text-mystic-goldSoft"
          >
            R$ {animatedBalance.toFixed(2)}
          </Motion.p>
        </article>
        <article className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
          <div className="mb-3 inline-flex items-center gap-2 text-sm text-mystic-goldSoft">
            <Sparkles size={16} />
            {t('client_dashboard.daily_horoscope', 'Horóscopo Diário')}
          </div>
          <p className="text-sm leading-relaxed text-amber-50/90">{dailyHoroscope}</p>
        </article>
      </div>
    </GlassCard>
  )
}
