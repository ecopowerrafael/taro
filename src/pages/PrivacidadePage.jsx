import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'

const privacyItems = [
  'Dados de cadastro são utilizados para personalização da experiência e gestão da conta.',
  'Sessões de vídeo não são compartilhadas com terceiros sem base legal ou consentimento.',
  'Informações financeiras de recarga seguem fluxo seguro do provedor de pagamento.',
  'O usuário pode solicitar revisão ou remoção de dados através dos canais oficiais da plataforma.',
]

export function PrivacidadePage() {
  return (
    <PageShell title="Política de Privacidade" subtitle="Diretrizes de proteção de dados da plataforma.">
      <GlassCard>
        <div className="grid gap-3">
          {privacyItems.map((item) => (
            <p key={item} className="rounded-lg border border-mystic-gold/20 bg-black/25 p-4 text-sm text-amber-100/80">
              {item}
            </p>
          ))}
        </div>
      </GlassCard>
    </PageShell>
  )
}
