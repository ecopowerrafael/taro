import { useMemo, useState } from 'react'
import { CheckCircle2, Copy, CreditCard, Loader2, QrCode, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { usePlatformContext } from '../context/platform-context'
import { generatePixPayload } from '../utils/pix'
import { GlassCard } from './GlassCard'
import { SpellStripeCheckoutForm } from './SpellStripeCheckoutForm'
import { getTranslatedField } from '../utils/i18nHelper'
import { useTranslation } from 'react-i18next'

export function SpellPurchaseModal({ spell, onClose }) {
  const { t } = useTranslation()
  const { profile, isAuthenticated, mpCredentials, createSpellPixOrder } = usePlatformContext()
  const [paymentMethod, setPaymentMethod] = useState(null)
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
        description: `Magia ${getTranslatedField(spell, 'title')}`,
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
    setPixFeedback(result?.message || t('spell_purchase.pix_order_registered', 'Pedido PIX registrado.'))
  }

  if (!spell) {
    return null
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
            {t('common.close', 'Fechar')}
          </button>
        </div>

        <div className="grid gap-4">
          <GlassCard title={t('spell_purchase.title', 'Finalizar contratação')} subtitle={t('spell_purchase.subtitle', 'Confira os dados antes de escolher a forma de pagamento.')}>
            <div className="grid gap-5">
              <div className="rounded-2xl border border-mystic-gold/25 bg-black/25 p-5 text-center md:p-6">
                <p className="text-lg leading-relaxed text-amber-50">
                  {t('spell_purchase.hiring_text_prefix', 'Você está contratando')} <span className="font-semibold text-mystic-goldSoft">{getTranslatedField(spell, 'title')}</span>, {t('spell_purchase.hiring_text_with', 'com o')}{' '}
                  <span className="font-semibold text-mystic-goldSoft">{spell.consultantName}</span>.
                </p>
                <p className="mt-3 text-base text-amber-100/85">
                  {t('spell_purchase.price_prefix', 'O valor é de')} <span className="font-display text-2xl text-mystic-goldSoft">R$ {Number(spell.price).toFixed(2)}</span>
                </p>
                <p className="mt-4 text-sm uppercase tracking-[0.18em] text-amber-100/60">{t('spell_purchase.payment_question', 'Como vc prefere pagar?')}</p>
              </div>

              {!isAuthenticated ? (
                <div className="grid gap-4">
                  <p className="text-sm text-amber-100/75">{t('spell_purchase.login_required_prefix', 'Faça login ou crie uma conta para concluir o pedido da magia')} {getTranslatedField(spell, 'title')}.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/entrar" className="rounded-lg bg-mystic-gold px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110" onClick={onClose}>
                      {t('nav.login', 'Entrar')}
                    </Link>
                    <Link to="/cadastro" className="rounded-lg border border-mystic-gold/45 px-4 py-2 text-sm text-mystic-goldSoft transition hover:bg-mystic-gold/10" onClick={onClose}>
                      {t('spell_purchase.create_account', 'Criar conta')}
                    </Link>
                  </div>
                </div>
              ) : stripeSuccess ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="rounded-full bg-emerald-500/20 p-4 text-emerald-400">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-mystic-goldSoft">{t('spell_purchase.purchase_approved', 'Compra aprovada')}</p>
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
                      {t('spell_purchase.credit_card', 'Cartão de crédito')}
                    </button>
                  </div>

                  {paymentMethod === 'pix' ? (
                    <div className="grid gap-4 rounded-2xl border border-mystic-gold/20 bg-black/20 p-4">
                      <p className="text-sm text-amber-100/70">{t('spell_purchase.pix_instructions', 'Escaneie o QR Code, conclua o PIX e depois registre o pedido para validação.')}</p>
                      <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-start">
                        <div className="flex justify-center">
                          {pixPayload ? (
                            <div className="rounded-xl border-4 border-white bg-white p-2">
                              <QRCodeSVG value={pixPayload} size={200} />
                            </div>
                          ) : (
                            <div className="flex h-[216px] w-[216px] items-center justify-center rounded-xl border border-dashed border-mystic-gold/30 bg-black/20 text-center text-xs text-amber-100/40">
                              {t('spell_purchase.pix_not_configured', 'PIX não configurado no admin.')}
                            </div>
                          )}
                        </div>
                        <div className="grid gap-4">
                          <div className="rounded-xl border border-mystic-gold/25 bg-black/25 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-amber-100/55">{t('spell_purchase.copy_paste', 'Copia e cola')}</p>
                            <div className="mt-3 flex gap-2">
                              <textarea
                                readOnly
                                value={pixPayload || t('spell_purchase.code_unavailable', 'Código indisponível')}
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
                            {pixSubmitting ? t('spell_purchase.registering_order', 'Registrando pedido...') : t('spell_purchase.already_paid_pix', 'Já paguei no PIX')}
                          </button>

                          {pixFeedback && <p className="text-sm text-amber-100/80">{pixFeedback}</p>}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {paymentMethod === 'card' ? (
                    <SpellStripeCheckoutForm
                      spell={spell}
                      onSuccess={(result) => setStripeSuccess(result?.message || t('spell_purchase.payment_confirmed', 'Pagamento confirmado e pedido registrado.'))}
                      onError={() => {}}
                    />
                  ) : null}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
