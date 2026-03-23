import { Link, useNavigate } from 'react-router-dom'
import { ClientDashboard } from '../components/ClientDashboard'
import { GlassCard } from '../components/GlassCard'
import { ZodiacIcon } from '../components/ZodiacIcon'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function PerfilPage() {
  const { profile, sign, minutesBalance, dailyHoroscope } = usePlatformContext()
  const navigate = useNavigate()

  return (
    <PageShell title="Meu Perfil" subtitle="Acompanhe saldo, signo e resumo pessoal da sua conta.">
      <ClientDashboard
        profile={profile}
        minutesBalance={minutesBalance}
        dailyHoroscope={dailyHoroscope}
        onRecharge={() => navigate('/recarregar')}
      />
      <GlassCard title="Resumo de Cadastro" subtitle="Dados usados para personalizar seu atendimento.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Nome</p>
            <p className="mt-2 text-amber-50">{profile?.name ?? 'Não informado'}</p>
          </div>
          <div className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Email</p>
            <p className="mt-2 text-amber-50">{profile?.email ?? 'Não informado'}</p>
          </div>
          <div className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Nascimento</p>
            <p className="mt-2 text-amber-50">{profile?.birthDate ?? 'Não informado'}</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <ZodiacIcon sign={sign} className="h-12 w-12" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Signo</p>
              <p className="mt-1 text-amber-50">{sign ?? 'Não identificado'}</p>
            </div>
          </div>
        </div>
        {!profile && (
          <Link
            to="/cadastro"
            className="mt-4 inline-flex rounded-lg border border-mystic-gold/60 px-4 py-2 text-sm text-mystic-goldSoft transition hover:bg-mystic-gold/10"
          >
            Completar cadastro
          </Link>
        )}
      </GlassCard>
    </PageShell>
  )
}
