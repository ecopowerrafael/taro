import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'

const terms = [
  'O uso da plataforma pressupõe concordância com regras de conduta e respeito entre usuários e consultores.',
  'As consultas são para orientação espiritual e não substituem atendimento médico, jurídico ou financeiro.',
  'Cobranças são realizadas por minuto efetivamente utilizado durante chamadas ativas.',
  'É proibido compartilhar, gravar ou divulgar conteúdo de consultas sem autorização explícita das partes.',
]

export function TermosPage() {
  return (
    <PageShell title="Termos de Uso" subtitle="Condições gerais para utilização da plataforma.">
      <GlassCard>
        <div className="grid gap-3">
          {terms.map((item) => (
            <p key={item} className="rounded-lg border border-mystic-gold/20 bg-black/25 p-4 text-sm text-amber-100/80">
              {item}
            </p>
          ))}
        </div>
      </GlassCard>
    </PageShell>
  )
}
