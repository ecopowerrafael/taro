import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function EntrarPage() {
  const navigate = useNavigate()
  const { login, setSystemNotice } = usePlatformContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result.ok) {
      setSystemNotice('Bem-vindo de volta!')
      navigate('/perfil')
    } else {
      setSystemNotice(result.message || 'Erro ao entrar. Verifique suas credenciais.')
    }
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
          <label className="grid gap-2 text-sm text-amber-100/80">
            Senha
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-mystic-gold/80 bg-gradient-to-r from-mystic-gold/90 to-amber-500/85 px-4 py-2 font-medium text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Entrando...
              </>
            ) : (
              'Entrar na Conta'
            )}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/cadastro"
            className="inline-flex items-center justify-center rounded-lg border border-mystic-gold/60 px-4 py-2 text-sm text-mystic-goldSoft transition hover:bg-mystic-gold/10"
          >
            Ainda não tem conta? Criar agora
          </Link>
          <Link
            to="/seja-consultor"
            className="inline-flex items-center justify-center rounded-lg border border-mystic-gold/30 px-4 py-2 text-xs text-amber-100/60 transition hover:bg-white/5"
          >
            Trabalhe conosco: Seja um consultor
          </Link>
        </div>
      </GlassCard>
    </PageShell>
  )
}
