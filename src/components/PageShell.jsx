import { Link } from 'react-router-dom'
import { StarField } from './StarField'

const mainLinks = [
  { to: '/', label: 'Home' },
  { to: '/cadastro', label: 'Cadastro' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/consultores', label: 'Consultores' },
  { to: '/admin', label: 'Admin' },
]

export function PageShell({ title, subtitle, children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-mystic-gradient px-4 py-8 pb-28 text-amber-50 md:px-8 md:pb-8">
      <StarField />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-xl2 border border-mystic-gold/40 bg-mystic-purple/55 px-6 py-5 shadow-glow backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-100/60">Taro Mediúnico</p>
              <h1 className="font-display text-4xl text-mystic-goldSoft md:text-5xl">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-amber-100/80">{subtitle}</p>}
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
            </nav>
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
