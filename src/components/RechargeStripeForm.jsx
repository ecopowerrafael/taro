import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { usePlatformContext } from '../context/platform-context'
import { GlassCard } from './GlassCard'
import { Wallet, AlertCircle } from 'lucide-react'

const stripeElementOptions = {
  style: {
    base: {
      fontSize: '15px',
      color: '#fef3c7',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      letterSpacing: '0.02em',
      '::placeholder': {
        color: '#a8a29e',
      },
    },
    invalid: {
      color: '#f87171',
      iconColor: '#f87171',
    },
  },
}

// Componente interno que usa Stripe
function StripeCheckoutForm({ packageData, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const { profile, token } = usePlatformContext()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage('Stripe não carregou corretamente.')
      return
    }

    if (!token) {
      setErrorMessage('Sua sessão expirou. Faça login novamente para pagar com cartão.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      // 1. Criar Payment Intent no backend
      const intentResponse = await fetch('/api/recharges/stripe-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: packageData.promoPrice ?? packageData.price,
          minutes: packageData.minutes,
          packageId: packageData.id,
          customerEmail: profile?.email ?? 'guest@taro.com',
        }),
      })

      if (!intentResponse.ok) {
        const error = await intentResponse.json()
        throw new Error(error.error || error.message || 'Erro ao criar sessão de pagamento')
      }

      const { clientSecret } = await intentResponse.json()

      // 2. Confirmar pagamento com Stripe
      const cardElement = elements.getElement(CardNumberElement)

      if (!cardElement) {
        throw new Error('Campo de numero do cartao nao esta disponivel.')
      }

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
        // Confirmar no backend que o pagamento foi aprovado e creditar minutos
        try {
          const confirmResponse = await fetch(`/api/recharges/stripe-confirm/${paymentIntent.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          })

          if (confirmResponse.ok) {
            const confirmResult = await confirmResponse.json()
            onSuccess?.({
              amount: packageData.promoPrice ?? packageData.price,
              minutes: packageData.minutes,
              paymentIntentId: paymentIntent.id,
              ...confirmResult,
            })
          } else {
            const errorData = await confirmResponse.json()
            throw new Error(errorData.message || 'Erro ao confirmar pagamento')
          }
        } catch (confirmError) {
          console.error('[StripeCheckoutForm] Erro ao confirmar:', confirmError)
          setErrorMessage(confirmError.message || 'Erro ao confirmar pagamento')
          onError?.(confirmError.message)
        }
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
      <div className="grid gap-3 rounded-2xl border border-mystic-gold/25 bg-gradient-to-b from-black/40 to-black/20 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-mystic-goldSoft uppercase">Cartao</p>
          <p className="mt-1 text-xs text-ethereal-silver/70">Preencha os dados abaixo em campos separados para uma leitura mais clara.</p>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">Numero do cartao</span>
          <div className="rounded-xl border border-mystic-gold/30 bg-black/35 px-4 py-4 transition focus-within:border-mystic-gold/70 focus-within:bg-black/50 focus-within:shadow-[0_0_0_1px_rgba(212,175,55,0.22)]">
            <CardNumberElement options={stripeElementOptions} />
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">Validade</span>
          <div className="rounded-xl border border-mystic-gold/30 bg-black/35 px-4 py-4 transition focus-within:border-mystic-gold/70 focus-within:bg-black/50 focus-within:shadow-[0_0_0_1px_rgba(212,175,55,0.22)]">
            <CardExpiryElement options={stripeElementOptions} />
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">CVC</span>
          <div className="rounded-xl border border-mystic-gold/30 bg-black/35 px-4 py-4 transition focus-within:border-mystic-gold/70 focus-within:bg-black/50 focus-within:shadow-[0_0_0_1px_rgba(212,175,55,0.22)]">
            <CardCvcElement options={stripeElementOptions} />
          </div>
        </label>
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
