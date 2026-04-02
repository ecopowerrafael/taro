import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { SacredGeometry } from '../components/SacredGeometry'
import { SpellPurchaseModal } from '../components/SpellPurchaseModal'
import { usePlatformContext } from '../context/platform-context'

export function MagiaProdutoPage() {
  const { spellId } = useParams()
  const { spells } = usePlatformContext()
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false)

  const spell = useMemo(
    () => spells.find((entry) => String(entry.id) === String(spellId)) ?? null,
    [spellId, spells],
  )

  if (spells.length > 0 && !spell) {
    return <Navigate to="/magias" replace />
  }

  if (!spell) {
    return (
      <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato selection:bg-mystic-gold/30 selection:text-mystic-gold">
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
        <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
        <SacredGeometry />
        <PageShell title="Magias" subtitle="Carregando detalhes do ritual.">
          <section className="rounded-3xl border border-mystic-gold/20 bg-black/25 p-10 text-center text-amber-100/75">
            Carregando ritual...
          </section>
        </PageShell>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato selection:bg-mystic-gold/30 selection:text-mystic-gold">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
      <SacredGeometry />

      <PageShell title={spell.title} subtitle="Detalhes completos do ritual e do mentor responsável.">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6">
            <Link
              to="/magias"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-amber-100/65 transition hover:text-mystic-goldSoft"
            >
              <ArrowLeft size={16} />
              Voltar para magias
            </Link>

            <div className="overflow-hidden rounded-[2rem] border border-mystic-gold/20 bg-black/30 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
              {spell.imageUrl ? (
                <img src={spell.imageUrl} alt={spell.title} className="h-[320px] w-full object-cover md:h-[420px]" />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-ethereal-silver/45 md:h-[420px]">Imagem não informada</div>
              )}
            </div>

            <div className="rounded-[2rem] border border-mystic-gold/15 bg-black/25 p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-mystic-gold/20 bg-mystic-gold/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-mystic-goldSoft/85">
                <Sparkles size={14} />
                Ritual Personalizado
              </div>

              <h1 className="mt-5 font-playfair text-4xl leading-tight text-white md:text-5xl">{spell.title}</h1>

              {spell.shortDescription ? (
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-amber-100/80">{spell.shortDescription}</p>
              ) : null}

              <div className="mt-8 grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
                <div className="flex justify-center md:justify-start">
                  {spell.consultantPhoto ? (
                    <img
                      src={spell.consultantPhoto}
                      alt={`Foto de ${spell.consultantName}`}
                      className="h-28 w-28 rounded-full border-2 border-mystic-gold/70 object-cover shadow-[0_0_25px_rgba(197,160,89,0.28)]"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-mystic-gold/40 bg-black/40 text-3xl text-mystic-goldSoft">
                      {spell.consultantName?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                  )}
                </div>

                <div className="text-center md:text-left">
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-100/55">Mentor responsável</p>
                  <h2 className="mt-2 font-display text-3xl text-mystic-goldSoft">{spell.consultantName}</h2>
                  {spell.consultantTagline ? (
                    <p className="mt-2 text-base italic text-amber-100/75">{spell.consultantTagline}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 border-t border-mystic-gold/15 pt-8">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-100/55">Descrição completa</p>
                <p className="mt-4 whitespace-pre-line text-base leading-8 text-amber-100/82">{spell.description}</p>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-[2rem] border border-mystic-gold/20 bg-[linear-gradient(180deg,rgba(197,160,89,0.09),rgba(0,0,0,0.18))] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] md:p-8 lg:sticky lg:top-28">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-100/55">Investimento do ritual</p>
            <p className="mt-3 font-playfair text-4xl text-mystic-goldSoft">R$ {Number(spell.price).toFixed(2)}</p>
            <p className="mt-3 text-sm leading-relaxed text-amber-100/72">
              Você escolhe PIX ou cartão de crédito no próximo passo, com confirmação vinculada à sua conta.
            </p>

            <button
              onClick={() => setIsPurchaseOpen(true)}
              className="group mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-mystic-gold/65 bg-[linear-gradient(135deg,#f6df91_0%,#c79a37_52%,#f8e8ae_100%)] px-6 py-4 text-sm font-bold uppercase tracking-[0.24em] text-black shadow-[0_18px_40px_rgba(197,160,89,0.28)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Ativar Ritual
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </button>

            <div className="mt-8 rounded-2xl border border-mystic-gold/15 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-100/55">Fluxo</p>
              <div className="mt-4 grid gap-4 text-sm text-amber-100/78">
                <p>1. Escolha a forma de pagamento e confirme o pedido.</p>
                <p>2. O mentor entra em contato se precisar alinhar informações adicionais.</p>
                <p>3. O ritual é conduzido conforme a intenção e a demanda solicitada.</p>
              </div>
            </div>
          </aside>
        </section>
      </PageShell>

      {isPurchaseOpen ? <SpellPurchaseModal spell={spell} onClose={() => setIsPurchaseOpen(false)} /> : null}
    </div>
  )
}