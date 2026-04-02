import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { StarField } from './StarField'
import { usePlatformContext } from '../context/platform-context'
import { buildHeaderLinks } from '../utils/navigation'

export function PageShell({ title, subtitle, children, mobileMenuFooter = null }) {
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
          className={`fixed inset-0 z-[110] bg-mystic-black/95 px-6 py-24 backdrop-blur-xl transition-all duration-300 md:hidden ${mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <div className="mx-auto max-w-md">
            <div className="rounded-[28px] border border-mystic-gold/25 bg-[linear-gradient(180deg,rgba(33,18,54,0.96),rgba(10,7,18,0.94))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45),0_0_30px_rgba(197,160,89,0.12)]">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-mystic-gold/15 pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-amber-100/50">Navegação</p>
                  <p className="mt-1 font-display text-2xl text-mystic-goldSoft">Menu</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-mystic-gold/30 bg-black/25 px-3 py-2 text-sm text-mystic-goldSoft transition hover:bg-mystic-gold/10"
                >
                  <X size={16} />
                  Fechar
                </button>
              </div>

              <div className="grid gap-3">
                {mainLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-2xl border border-mystic-gold/15 bg-white/5 px-4 py-3 text-left font-display text-xl text-mystic-goldSoft transition hover:border-mystic-gold/40 hover:bg-mystic-gold/10 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {mobileMenuFooter ? (
            <div className="absolute bottom-6 right-6 z-[111]">
              {mobileMenuFooter}
            </div>
          ) : null}
        </div>
        {children}
      </div>
    </main>
  )
}
