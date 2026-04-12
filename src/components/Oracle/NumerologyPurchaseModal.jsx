import { useMemo, useState } from 'react'
import { CheckCircle2, Copy, CreditCard, Loader2, QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { usePlatformContext } from '../../context/platform-context'
import { generatePixPayload } from '../../utils/pix'
import { GlassCard } from '../GlassCard'
import { NumerologyStripeCheckoutForm } from './NumerologyStripeCheckoutForm'

const NUMEROLOGY_PRICE = 49.9
const NUMEROLOGY_TITLE = 'Leitura Numerológica Completa'

export function NumerologyPurchaseModal({ onClose, onSuccess, nomeCompleto, dataNascimento }) {
  const { profile, isAuthenticated, mpCredentials, createNumerologyPixOrder } = usePlatformContext()
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [copied, setCopied] = useState(false)
  const [pixSubmitting, setPixSubmitting] = useState(false)
  const [pixFeedback, setPixFeedback] = useState('')
  const [stripeSuccess, setStripeSuccess] = useState('')

  const pixPayload = useMemo(() => {
    if (!mpCredentials?.pixKey) {
      return null
    }
    try {
      return generatePixPayload({
        key: mpCredentials.pixKey,
        name: mpCredentials.pixReceiverName || 'Astria Tarot',
        city: mpCredentials.pixReceiverCity || 'SAO PAULO',
        amount: NUMEROLOGY_PRICE,
        description: NUMEROLOGY_TITLE,
      })
    } catch (error) {
      console.error('[NumerologyPurchaseModal] Erro ao gerar payload PIX:', error)
      return null
    }
  }, [mpCredentials])

  const handleCopyPix = async () => {
    if (!pixPayload) return
    await navigator.clipboard.writeText(pixPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handlePixSubmit = async () => {
    setPixSubmitting(true)
    setPixFeedback('')
    const result = await createNumerologyPixOrder({ nomeCompleto, dataNascimento })
    setPixSubmitting(false)
    setPixFeedback(result?.message || 'Pedido PIX registrado.')
    if (result?.ok) onSuccess?.()
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="mb-3 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/35 bg-black/45 px-3 py-2 text-sm text-amber-100/85 transition hover:bg-black/60"
          >
            <X size={16} />
            Fechar
          </button>
        </div>
        <div className="grid gap-4">
          <GlassCard title="Solicitar leitura numerológica" subtitle="Receba por e-mail um PDF com sua análise numerológica completa.">
            <div className="grid gap-5">
              <div className="rounded-2xl border border-mystic-gold/25 bg-black/25 p-5 text-center md:p-6">
                <p className="text-lg leading-relaxed text-amber-50">
                  Você está contratando <span className="font-semibold text-mystic-goldSoft">{NUMEROLOGY_TITLE}</span>.
                </p>
                <p className="mt-3 text-base text-amber-100/85">
                  Valor de <span className="font-display text-2xl text-mystic-goldSoft">R$ {NUMEROLOGY_PRICE.toFixed(2)}</span>
                </p>
                <p className="mt-4 text-sm text-amber-100/75">
                  O material será enviado para <span className="font-semibold text-mystic-goldSoft">{profile?.email || 'seu e-mail cadastrado'}</span>.
                </p>
                <p className="mt-4 text-sm uppercase tracking-[0.18em] text-amber-100/60">Como você prefere pagar?</p>
              </div>

              {!isAuthenticated ? (
                <div className="grid gap-4">
                  <p className="text-sm text-amber-100/75">Faça login ou crie uma conta para concluir o pedido da sua leitura numerológica.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a href="/entrar" className="rounded-lg bg-mystic-gold px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110" onClick={onClose}>
                      Entrar
                    </a>
                    <a href="/cadastro" className="rounded-lg border border-mystic-gold/45 px-4 py-2 text-sm text-mystic-goldSoft transition hover:bg-mystic-gold/10" onClick={onClose}>
                      Criar conta
                    </a>
                  </div>
                </div>
              ) : stripeSuccess ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="rounded-full bg-emerald-500/20 p-4 text-emerald-400">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-mystic-goldSoft">Pedido confirmado</p>
                    <p className="mt-2 text-sm text-amber-100/70">{stripeSuccess}</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] transition ${
                        paymentMethod === 'pix'
                          ? 'border-mystic-gold bg-mystic-gold text-black'
                          : 'border-mystic-gold/35 bg-black/25 text-mystic-goldSoft hover:bg-mystic-gold/10'
                      }`}
                    >
                      <QrCode size={18} />
                      PIX
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] transition ${
                        paymentMethod === 'card'
                          ? 'border-mystic-gold bg-mystic-gold text-black'
                          : 'border-mystic-gold/35 bg-black/25 text-mystic-goldSoft hover:bg-mystic-gold/10'
                      }`}
                    >
                      <CreditCard size={18} />
                      Cartão de crédito
                    </button>
                  </div>

                  {paymentMethod === 'pix' ? (
                    <div className="grid gap-4 rounded-2xl border border-mystic-gold/20 bg-black/20 p-4">
                      <p className="text-sm text-amber-100/70">Escaneie o QR Code, conclua o PIX e depois registre o pedido para validação.</p>
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
                                className="rounded-lg border border-mystic-gold/40 bg-mystic-gold/10 px-3 py-2 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/20"
                              >
                                <Copy size={16} />
                                {copied ? 'Copiado!' : 'Copiar'}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={handlePixSubmit}
                            disabled={pixSubmitting || !pixPayload}
                            className="w-full rounded-xl bg-mystic-gold text-black font-bold py-3 mt-2 disabled:opacity-60"
                          >
                            {pixSubmitting ? <Loader2 className="animate-spin inline w-4 h-4 mr-2" /> : <CheckCircle2 className="inline w-4 h-4 mr-2" />}
                            Já paguei no PIX
                          </button>
                          {pixFeedback && <div className="text-xs text-center text-amber-100/80 mt-2">{pixFeedback}</div>}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {paymentMethod === 'card' && (
                    <NumerologyStripeCheckoutForm
                      amount={NUMEROLOGY_PRICE}
                      onSuccess={() => {
                        setStripeSuccess('Pagamento confirmado! Pedido enviado ao admin.')
                        onSuccess?.()
                      }}
                      onError={() => setStripeSuccess('Erro ao processar pagamento.')}
                    />
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
