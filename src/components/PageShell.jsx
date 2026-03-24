import { Link, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { StarField } from './StarField'
import { usePlatformContext } from '../context/platform-context'

export function PageShell({ title, subtitle, children }) {
  const navigate = useNavigate()
  const { isAdmin, isConsultant, isAuthenticated, logout } = usePlatformContext()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const mainLinks = [
    { to: '/', label: 'Home' },
    { to: '/consultores', label: 'Consultores' },
  ]

  if (!isAuthenticated) {
    mainLinks.push({ to: '/cadastro', label: 'Cadastro' })
    mainLinks.push({ to: '/entrar', label: 'Entrar' })
  } else {
    mainLinks.push({ to: '/perfil', label: 'Perfil' })
    if (isConsultant || isAdmin) {
      mainLinks.push({ to: '/area-consultor', label: 'Consultor' })
    }
    if (isAdmin) {
      mainLinks.push({ to: '/admin', label: 'Admin' })
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-mystic-gradient px-4 py-8 pb-28 text-amber-50 md:px-8 md:pb-8">
      <StarField />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-xl2 border border-mystic-gold/40 bg-mystic-purple/55 px-6 py-5 shadow-glow backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/logoastria.png"
                alt="Astria"
                className="h-12 w-12 rounded-xl border border-mystic-gold/40 bg-black/30 object-contain p-1"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/60">Astria</p>
              <h1 className="font-display text-4xl text-mystic-goldSoft md:text-5xl">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-amber-100/80">{subtitle}</p>}
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2">
              {mainLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg border border-mystic-gold/35 px-3 py-1 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/10"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  title="Sair da conta"
                  className="flex items-center gap-1 rounded-lg border border-red-500/35 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              )}
            </nav>
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
