import React, { useState, useMemo } from 'react'
import { GlassCard } from '../GlassCard'
import { QrCode, CreditCard, CheckCircle2, Loader2 } from 'lucide-react'
import { usePlatformContext } from '../../context/platform-context'
import { generatePixPayload } from '../../utils/pix'
import { NumerologyStripeCheckoutForm } from './NumerologyStripeCheckoutForm'

const NUMEROLOGY_TITLE = 'Leitura Numerológica Completa'
const NUMEROLOGY_PRICE = 49.9

export function NumerologyPurchaseModal({ onClose, onSuccess }) {
  const { profile, mpCredentials, stripeCredentials, createNumerologyPixOrder, createNumerologyStripePaymentIntent } = usePlatformContext()
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [pixSubmitting, setPixSubmitting] = useState(false)
  const [pixFeedback, setPixFeedback] = useState('')
  const [stripeSuccess, setStripeSuccess] = useState('')

  // PIX
  const pixPayload = useMemo(() => {
    if (!mpCredentials?.pixKey) return null
    try {
      return generatePixPayload({
        key: mpCredentials.pixKey,
        name: mpCredentials.pixReceiverName || 'Astria Tarot',
        city: mpCredentials.pixReceiverCity || 'SAO PAULO',
        amount: NUMEROLOGY_PRICE,
        description: NUMEROLOGY_TITLE,
      })
    } catch (e) {
      return null
    }
  }, [mpCredentials])

  const handlePixSubmit = async () => {
    setPixSubmitting(true)
    setPixFeedback('')
    const result = await createNumerologyPixOrder()
    if (result?.ok) {
      setPixFeedback('Pedido enviado! Aguarde validação do pagamento.')
      onSuccess?.()
    } else {
      setPixFeedback(result?.message || 'Erro ao registrar pedido.')
    }
    setPixSubmitting(false)
  }

  // STRIPE

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-md mx-auto">
        <GlassCard title="Desbloquear Mapa Numerológico" subtitle="Pagamento seguro e instantâneo.">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`flex-1 rounded-full border px-4 py-2 font-bold uppercase text-xs ${paymentMethod === 'pix' ? 'bg-mystic-gold text-black border-mystic-gold' : 'bg-black/20 text-mystic-gold border-mystic-gold/40'}`}
              >
                <QrCode className="inline mr-2 w-4 h-4" /> PIX
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 rounded-full border px-4 py-2 font-bold uppercase text-xs ${paymentMethod === 'card' ? 'bg-mystic-gold text-black border-mystic-gold' : 'bg-black/20 text-mystic-gold border-mystic-gold/40'}`}
              >
                <CreditCard className="inline mr-2 w-4 h-4" /> Cartão
              </button>
            </div>

            {paymentMethod === 'pix' && (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white text-black rounded-lg p-3 text-xs font-bold tracking-widest select-all break-all">
                  {pixPayload || 'Chave PIX não configurada.'}
                </div>
                <button
                  onClick={handlePixSubmit}
                  disabled={pixSubmitting}
                  className="w-full rounded-xl bg-mystic-gold text-black font-bold py-3 mt-2 disabled:opacity-60"
                >
                  {pixSubmitting ? <Loader2 className="animate-spin inline w-4 h-4 mr-2" /> : <CheckCircle2 className="inline w-4 h-4 mr-2" />}
                  Já paguei no PIX
                </button>
                {pixFeedback && <p className="text-sm text-amber-100/80 mt-2">{pixFeedback}</p>}
              </div>
            )}

            {paymentMethod === 'card' && (
              <NumerologyStripeCheckoutForm
                amount={49.9}
                onSuccess={() => {
                  setStripeSuccess('Pagamento confirmado! Pedido enviado ao admin.')
                  onSuccess?.()
                }}
                onError={() => setStripeSuccess('Erro ao processar pagamento.')}
              />
            )}

            {!paymentMethod && (
              <div className="text-center text-amber-100/60 text-xs">Escolha uma forma de pagamento para desbloquear seu mapa completo.</div>
            )}
          </div>
          <button onClick={onClose} className="absolute top-2 right-2 text-mystic-gold hover:text-white text-xl">×</button>
        </GlassCard>
      </div>
    </div>
  )
}
