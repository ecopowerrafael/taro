import { motion as Motion } from 'framer-motion'
import { IdCard, Moon, Sparkles, Star, LogIn } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { usePlatformContext } from '../context/platform-context'

export function MobileBottomNav() {
  const location = useLocation()
  const { isAuthenticated, isConsultant, isAdmin } = usePlatformContext()

  const mobileLinks = [
    { to: '/consultores', label: 'Consultores', icon: Moon },
  ]

  if (isAuthenticated) {
    mobileLinks.unshift({ to: '/perfil', label: 'Perfil', icon: Star })
    mobileLinks.push({ to: '/recarregar', label: 'Saldo', icon: Sparkles })
    if (isConsultant || isAdmin) {
      mobileLinks.push({ to: '/area-consultor', label: 'Painel', icon: IdCard })
    }
  } else {
    mobileLinks.unshift({ to: '/entrar', label: 'Entrar', icon: LogIn })
    mobileLinks.push({ to: '/cadastro', label: 'Cadastro', icon: Star })
  }

  return (
    <Motion.nav
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="fixed inset-x-2 bottom-2 z-[90] flex justify-around items-center rounded-2xl border border-stardust-gold/40 bg-[linear-gradient(180deg,rgba(26,11,46,0.88),rgba(5,5,5,0.92))] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.55),0_0_18px_rgba(197,160,89,0.2)] backdrop-blur-xl md:hidden"
    >
      {mobileLinks.map((link) => {
        const Icon = link.icon
        const isActive = location.pathname === link.to

        return (
          <Motion.div key={`${link.to}-${link.label}`} whileTap={{ scale: 0.96 }} className="flex-1">
            <Link
              to={link.to}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition ${
                isActive
                  ? 'text-stardust-gold'
                  : 'text-ethereal-silver/80 hover:bg-stardust-gold/10 hover:text-stardust-gold'
              }`}
            >
              {isActive && (
                <Motion.span
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-xl border border-stardust-gold/50 bg-stardust-gold/10"
                  transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                />
              )}
              <Icon size={16} className="relative z-10" />
              <span className="relative z-10 text-[11px] leading-tight">{link.label}</span>
            </Link>
          </Motion.div>
        )
      })}
    </Motion.nav>
  )
}
