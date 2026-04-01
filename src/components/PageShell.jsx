import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { StarField } from './StarField'
import { usePlatformContext } from '../context/platform-context'
import { buildHeaderLinks } from '../utils/navigation'

export function PageShell({ title, subtitle, children }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAdmin, isConsultant, isAuthenticated, logout } = usePlatformContext()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const mainLinks = buildHeaderLinks({ isAuthenticated, isConsultant, isAdmin })

  return (
    <main className="relative min-h-screen overflow-hidden bg-mystic-gradient px-4 py-8 pb-28 text-amber-50 md:px-8 md:pb-8">
      {/* <StarField /> */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="relative z-[96] rounded-xl2 border border-mystic-gold/40 bg-mystic-purple/55 px-6 py-5 shadow-glow backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex-shrink-0 transition hover:scale-105">
                <img
                  src="/logoastria.png"
                  alt="Astria"
                  className="h-24 w-24 rounded-2xl border-2 border-mystic-gold/60 bg-black/50 object-contain p-2 shadow-[0_0_15px_rgba(197,160,89,0.3)] brightness-110 drop-shadow-md"
                />
              </Link>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100/60">Astria</p>
                <h1 className="font-display text-4xl text-mystic-goldSoft md:text-5xl">{title}</h1>
                {subtitle && <p className="mt-2 text-sm text-amber-100/80">{subtitle}</p>}
              </div>
            </div>
            <nav className="hidden md:flex flex-wrap items-center gap-2">
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
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-mystic-gold/35 p-2 text-mystic-goldSoft transition hover:bg-mystic-gold/10 md:hidden"
              onClick={() => setMobileMenuOpen((current) => !current)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
        <div
          className={`fixed inset-0 z-[95] bg-mystic-black/95 px-6 py-24 backdrop-blur-xl transition-all duration-300 md:hidden ${mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
            {mainLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="font-display text-2xl text-mystic-goldSoft transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/35 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut size={16} />
                Sair
              </button>
            )}
          </div>
        </div>
        {children}
      </div>
    </main>
  )
}
