import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function EntrarPage() {
  const { profile, setSystemNotice } = usePlatformContext()
  const [email, setEmail] = useState(profile?.email ?? '')

  const handleSubmit = (event) => {
    event.preventDefault()
    setSystemNotice(`Login mock realizado para ${email || 'usuário convidado'}.`)
  }

  return (
    <PageShell title="Entrar" subtitle="Acesse sua conta para continuar sua jornada espiritual.">
      <GlassCard title="Acesso do Cliente">
        <form onSubmit={handleSubmit} className="grid gap-4 md:max-w-md">
          <label className="grid gap-2 text-sm text-amber-100/80">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-mystic-gold/80 bg-gradient-to-r from-mystic-gold/90 to-amber-500/85 px-4 py-2 font-medium text-black transition hover:brightness-110"
          >
            Entrar na Conta
          </button>
        </form>
        <Link
          to="/cadastro"
          className="mt-4 inline-flex rounded-lg border border-mystic-gold/60 px-4 py-2 text-sm text-mystic-goldSoft transition hover:bg-mystic-gold/10"
        >
          Ainda não tem conta? Criar agora
        </Link>
      </GlassCard>
    </PageShell>
  )
}
