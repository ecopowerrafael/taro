import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { AlertCircle, Wallet } from 'lucide-react'
import { usePlatformContext } from '../context/platform-context'
import { GlassCard } from './GlassCard'

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

function SpellStripeInnerForm({ spell, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const { createSpellStripePaymentIntent, confirmSpellStripeOrder } = usePlatformContext()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements) {
      setErrorMessage('Stripe não carregou corretamente.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const intentResult = await createSpellStripePaymentIntent({ spellId: spell.id })
      if (!intentResult?.ok || !intentResult.clientSecret) {
        throw new Error(intentResult?.message || 'Erro ao iniciar pagamento com cartão.')
      }

      const cardElement = elements.getElement(CardNumberElement)
      if (!cardElement) {
        throw new Error('Campo de cartão não disponível.')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(intentResult.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        throw new Error(error.message || 'Erro ao processar pagamento.')
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error('Pagamento ainda não foi aprovado pela Stripe.')
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
      const confirmation = await confirmSpellStripeOrder({ paymentIntentId: paymentIntent.id })
      if (!confirmation?.ok) {
        throw new Error(confirmation?.message || 'Erro ao confirmar pagamento.')
      }

      onSuccess?.(confirmation)
    } catch (error) {
      const message = error.message || 'Erro ao pagar com cartão.'
      setErrorMessage(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-3 rounded-2xl border border-mystic-gold/25 bg-gradient-to-b from-black/40 to-black/20 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">Número do cartão</span>
          <div className="rounded-xl border border-mystic-gold/30 bg-black/35 px-4 py-4 transition focus-within:border-mystic-gold/70 focus-within:bg-black/50">
            <CardNumberElement options={stripeElementOptions} />
          </div>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">Validade</span>
            <div className="rounded-xl border border-mystic-gold/30 bg-black/35 px-4 py-4 transition focus-within:border-mystic-gold/70 focus-within:bg-black/50">
              <CardExpiryElement options={stripeElementOptions} />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">CVC</span>
            <div className="rounded-xl border border-mystic-gold/30 bg-black/35 px-4 py-4 transition focus-within:border-mystic-gold/70 focus-within:bg-black/50">
              <CardCvcElement options={stripeElementOptions} />
            </div>
          </label>
        </div>
      </div>

      {errorMessage && (
        <div className="flex gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
          <p className="text-sm text-red-200">{errorMessage}</p>
        </div>
      )}

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
            Pagar R$ {Number(spell.price).toFixed(2)}
          </span>
        )}
      </button>
    </form>
  )
}

export function SpellStripeCheckoutForm({ spell, onSuccess, onError }) {
  const { stripeCredentials } = usePlatformContext()
  const publicKey = stripeCredentials?.publicKey?.trim()
  const stripePromise = useMemo(() => (publicKey ? loadStripe(publicKey) : null), [publicKey])

  const options = useMemo(() => ({
    locale: 'pt-BR',
  }), [])

  if (!publicKey) {
    return (
      <GlassCard title="Cartão indisponível" subtitle="Configure a chave pública da Stripe no admin para liberar o checkout com cartão.">
        <p className="text-sm text-amber-100/75">A forma de pagamento por cartão depende das credenciais Stripe configuradas no painel administrativo.</p>
      </GlassCard>
    )
  }

  if (!stripePromise) {
    return null
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <GlassCard title="Pagamento com cartão" subtitle={`Compra segura da magia ${spell.title}.`}>
        <SpellStripeInnerForm spell={spell} onSuccess={onSuccess} onError={onError} />
      </GlassCard>
    </Elements>
  )
}