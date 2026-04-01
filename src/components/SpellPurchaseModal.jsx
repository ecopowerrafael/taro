import { useMemo, useState } from 'react'
import { CheckCircle2, Copy, CreditCard, Loader2, QrCode, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { usePlatformContext } from '../context/platform-context'
import { generatePixPayload } from '../utils/pix'
import { GlassCard } from './GlassCard'
import { SpellStripeCheckoutForm } from './SpellStripeCheckoutForm'

export function SpellPurchaseModal({ spell, onClose }) {
  const { profile, isAuthenticated, mpCredentials, createSpellPixOrder } = usePlatformContext()
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [copied, setCopied] = useState(false)
  const [pixSubmitting, setPixSubmitting] = useState(false)
  const [pixFeedback, setPixFeedback] = useState('')
  const [stripeSuccess, setStripeSuccess] = useState('')

  const pixPayload = useMemo(() => {
    if (!spell || !mpCredentials?.pixKey) {
      return null
    }

    try {
      return generatePixPayload({
        key: mpCredentials.pixKey,
        name: mpCredentials.pixReceiverName || 'Astria Tarot',
        city: mpCredentials.pixReceiverCity || 'SAO PAULO',
        amount: spell.price,
        description: `Magia ${spell.title}`,
      })
    } catch (error) {
      console.error('[SpellPurchaseModal] Erro ao gerar payload PIX:', error)
      return null
    }
  }, [spell, mpCredentials])

  const handleCopyPix = async () => {
    if (!pixPayload) {
      return
    }
    await navigator.clipboard.writeText(pixPayload)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const handlePixSubmit = async () => {
    setPixSubmitting(true)
    setPixFeedback('')
    const result = await createSpellPixOrder({ spellId: spell.id })
    setPixSubmitting(false)
    setPixFeedback(result?.message || 'Pedido PIX registrado.')
  }

  if (!spell) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl">
        <div className="mb-3 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/35 bg-black/45 px-3 py-2 text-sm text-amber-100/85 transition hover:bg-black/60"
          >
            <X size={16} />
            Fechar
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <GlassCard title={spell.title} subtitle={`Feita por ${spell.consultantName}`}>
            <div className="grid gap-4">
              <div className="overflow-hidden rounded-2xl border border-mystic-gold/25 bg-black/30">
                {spell.imageUrl ? (
                  <img src={spell.imageUrl} alt={spell.title} className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 items-center justify-center text-sm text-ethereal-silver/45">Sem imagem</div>
                )}
              </div>
              <p className="text-sm leading-relaxed text-ethereal-silver/80">{spell.description}</p>
              <div className="rounded-2xl border border-mystic-gold/25 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/55">Investimento</p>
                <p className="mt-1 font-display text-4xl text-mystic-goldSoft">R$ {Number(spell.price).toFixed(2)}</p>
                <p className="mt-2 text-xs text-amber-100/60">A liberação do repasse ao consultor acontece quando o pagamento é confirmado.</p>
              </div>
            </div>
          </GlassCard>

          {!isAuthenticated ? (
            <GlassCard title="Entrar para comprar" subtitle="A compra da magia fica vinculada à sua conta para validação do pagamento.">
              <div className="grid gap-4">
                <p className="text-sm text-amber-100/75">Faça login ou crie uma conta para concluir o pedido da magia {spell.title}.</p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/entrar" className="rounded-lg bg-mystic-gold px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110" onClick={onClose}>
                    Entrar
                  </Link>
                  <Link to="/cadastro" className="rounded-lg border border-mystic-gold/45 px-4 py-2 text-sm text-mystic-goldSoft transition hover:bg-mystic-gold/10" onClick={onClose}>
                    Criar conta
                  </Link>
                </div>
              </div>
            </GlassCard>
          ) : stripeSuccess ? (
            <GlassCard title="Pagamento confirmado" subtitle="Seu pedido foi registrado com sucesso.">
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="rounded-full bg-emerald-500/20 p-4 text-emerald-400">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-mystic-goldSoft">Compra aprovada</p>
                  <p className="mt-2 text-sm text-amber-100/70">{stripeSuccess}</p>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-4">
              <GlassCard title="Escolha o pagamento" subtitle={`Olá, ${profile?.name || 'cliente'}. Selecione PIX ou cartão para finalizar.`}>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition ${
                      paymentMethod === 'pix'
                        ? 'border-mystic-gold bg-mystic-gold/10'
                        : 'border-mystic-gold/25 bg-black/25 hover:bg-black/35'
                    }`}
                  >
                    <QrCode size={28} className="text-mystic-goldSoft" />
                    <div className="text-center">
                      <p className="font-display text-lg text-mystic-goldSoft">PIX</p>
                      <p className="text-[11px] text-amber-100/60">QR Code e aprovação manual</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition ${
                      paymentMethod === 'card'
                        ? 'border-mystic-gold bg-mystic-gold/10'
                        : 'border-mystic-gold/25 bg-black/25 hover:bg-black/35'
                    }`}
                  >
                    <CreditCard size={28} className="text-mystic-goldSoft" />
                    <div className="text-center">
                      <p className="font-display text-lg text-mystic-goldSoft">Cartão</p>
                      <p className="text-[11px] text-amber-100/60">Confirmação automática com Stripe</p>
                    </div>
                  </button>
                </div>
              </GlassCard>

              {paymentMethod === 'pix' ? (
                <GlassCard title="Pagamento via PIX" subtitle="Escaneie o QR Code, pague e registre seu pedido para validação.">
                  <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-start">
                    <div className="flex justify-center">
                      {pixPayload ? (
                        <div className="rounded-xl border-4 border-white bg-white p-2">
                          <QRCodeSVG value={pixPayload} size={200} />
                        </div>
                      ) : (
                        <div className="flex h-[216px] w-[216px] items-center justify-center rounded-xl border border-dashed border-mystic-gold/30 bg-black/20 text-center text-xs text-amber-100/40">
                          PIX não configurado no admin.
                        </div>
                      )}
                    </div>
                    <div className="grid gap-4">
                      <div className="rounded-xl border border-mystic-gold/25 bg-black/25 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-amber-100/55">Copia e cola</p>
                        <div className="mt-3 flex gap-2">
                          <textarea
                            readOnly
                            value={pixPayload || 'Código indisponível'}
                            className="min-h-24 flex-1 resize-none rounded-lg border border-mystic-gold/25 bg-black/40 p-3 text-xs text-amber-50 outline-none"
                          />
                          <button
                            onClick={handleCopyPix}
                            disabled={!pixPayload}
                            className="self-start rounded-lg border border-mystic-gold/35 px-3 py-2 text-mystic-goldSoft transition hover:bg-mystic-gold/10 disabled:opacity-30"
                          >
                            {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handlePixSubmit}
                        disabled={pixSubmitting || !pixPayload}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-mystic-gold/55 bg-mystic-gold/90 px-4 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pixSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {pixSubmitting ? 'Registrando pedido...' : 'Já paguei no PIX'}
                      </button>

                      {pixFeedback && <p className="text-sm text-amber-100/80">{pixFeedback}</p>}
                    </div>
                  </div>
                </GlassCard>
              ) : (
                <SpellStripeCheckoutForm
                  spell={spell}
                  onSuccess={(result) => setStripeSuccess(result?.message || 'Pagamento confirmado e pedido registrado.')}
                  onError={() => {}}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}