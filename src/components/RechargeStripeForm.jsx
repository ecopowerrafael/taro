import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { usePlatformContext } from '../context/platform-context'
import { GlassCard } from './GlassCard'
import { Wallet, AlertCircle } from 'lucide-react'

// Componente interno que usa Stripe
function StripeCheckoutForm({ packageData, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const { profile } = usePlatformContext()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage('Stripe não carregou corretamente.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      // 1. Criar Payment Intent no backend
      const intentResponse = await fetch('/api/recharges/stripe-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round((packageData.promoPrice ?? packageData.price) * 100), // em centavos
          minutes: packageData.minutes,
          packageId: packageData.id,
          customerEmail: profile?.email ?? 'guest@taro.com',
        }),
      })

      if (!intentResponse.ok) {
        const error = await intentResponse.json()
        throw new Error(error.message || 'Erro ao criar sessão de pagamento')
      }

      const { clientSecret } = await intentResponse.json()

      // 2. Confirmar pagamento com Stripe
      const cardElement = elements.getElement(CardElement)
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: profile?.email ?? 'guest@taro.com',
          },
        },
      })

      if (error) {
        setErrorMessage(error.message || 'Erro ao processar pagamento')
        onError?.(error.message)
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess?.({
          amount: packageData.promoPrice ?? packageData.price,
          minutes: packageData.minutes,
          paymentIntentId: paymentIntent.id,
        })
      }
    } catch (error) {
      console.error('[StripeCheckoutForm] Error:', error)
      setErrorMessage(error.message || 'Erro ao processar pagamento')
      onError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-mystic-gold/30 bg-black/30 p-4">
        <label className="block text-sm font-semibold text-amber-100 mb-3">Dados do Cartão</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '14px',
                color: '#fef3c7',
                '::placeholder': {
                  color: '#d1d5db',
                },
                fontFamily: 'sans-serif',
              },
              invalid: {
                color: '#ef4444',
              },
            },
          }}
          className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-3"
        />
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 flex gap-2">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{errorMessage}</p>
        </div>
      )}

      <div className="rounded-lg border border-mystic-gold/30 bg-black/30 p-3">
        <p className="text-xs text-ethereal-silver/70">
          Você receberá <span className="font-semibold text-mystic-goldSoft">{packageData.minutes} minutos</span> por{' '}
          <span className="font-semibold text-emerald-400">
            R$ {(packageData.promoPrice ?? packageData.price).toFixed(2)}
          </span>
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="relative w-full rounded-lg border border-emerald-400/60 bg-emerald-500/15 px-4 py-3 font-semibold text-emerald-200 transition enabled:hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-r-transparent" />
            Processando...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Wallet size={16} />
            Pagar com Cartão
          </span>
        )}
      </button>
    </form>
  )
}

// Componente que exportar para usar
export function RechargeStripeForm({ packageData, onSuccess, onError }) {
  const { stripeCredentials } = usePlatformContext()
  const [stripePromise, setStripePromise] = useState(null)

  useEffect(() => {
    if (stripeCredentials?.publicKey) {
      setStripePromise(loadStripe(stripeCredentials.publicKey))
    }
  }, [stripeCredentials?.publicKey])

  if (!stripePromise) {
    return (
      <GlassCard>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <p className="text-sm text-amber-100/70">Stripe não está configurado. Contate o suporte.</p>
        </div>
      </GlassCard>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <GlassCard title="Pagar com Cartão de Crédito" subtitle="Stripe">
        <StripeCheckoutForm packageData={packageData} onSuccess={onSuccess} onError={onError} />
      </GlassCard>
    </Elements>
  )
}
