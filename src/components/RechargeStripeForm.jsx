import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  PaymentElement,
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

const stripeAppearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#d4af37',
    colorBackground: '#120717',
    colorText: '#fef3c7',
    colorDanger: '#f87171',
    borderRadius: '14px',
  },
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0)

async function createStripePaymentIntent({ packageData, profile, token }) {
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

  const payload = await intentResponse.json().catch(() => ({}))
  if (!intentResponse.ok) {
    throw new Error(payload.error || payload.message || 'Erro ao criar sessão de pagamento')
  }

  return payload
}

async function confirmStripeRecharge({ paymentIntentId, token, packageData, onSuccess }) {
  const maxRetries = 2
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[StripeCheckoutForm] Tentativa ${attempt}/${maxRetries} de confirmar pagamento...`)
      
      const confirmResponse = await fetch(`/api/recharges/stripe-confirm/${paymentIntentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}))
        lastError = errorData.message || 'Erro ao confirmar pagamento'
        
        // Se for erro 400 (not approved) e não for última tentativa, aguarda e tenta novamente
        if (confirmResponse.status === 400 && attempt < maxRetries) {
          console.log(`[StripeCheckoutForm] Pagamento ainda não foi aprovado, aguardando ${attempt * 800}ms...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 800))
          continue
        }
        
        throw new Error(lastError)
      }

      const confirmResult = await confirmResponse.json()
      console.log(`[StripeCheckoutForm] Confirmação bem-sucedida na tentativa ${attempt}`)
      
      onSuccess?.({
        amount: packageData.promoPrice ?? packageData.price,
        minutes: packageData.minutes,
        paymentIntentId,
        ...confirmResult,
      })
      
      return // Sucesso, sai da função
    } catch (error) {
      lastError = error
      if (attempt === maxRetries) {
        throw error // Última tentativa, relança o erro
      }
      console.warn(`[StripeCheckoutForm] Erro na tentativa ${attempt}:`, error.message)
    }
  }

  throw lastError
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
      const { clientSecret } = await createStripePaymentIntent({ packageData, profile, token })

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
        console.log('[StripeCheckoutForm] Pagamento aprovado na Stripe, aguardando 500ms antes de confirmar no servidor...')
        // Aguardar um pouco para dar tempo ao webhook processar
        await new Promise(resolve => setTimeout(resolve, 500))
        
        try {
          await confirmStripeRecharge({
            paymentIntentId: paymentIntent.id,
            token,
            packageData,
            onSuccess,
          })
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
          Você está carregando{' '}
          <span className="font-semibold text-emerald-400">
            {formatCurrency(packageData.promoPrice ?? packageData.price)}
          </span>{' '}
          em saldo para usar nas consultas.
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

function StripeWalletsCheckoutForm({ packageData, clientSecret, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const { token } = usePlatformContext()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage('Stripe não carregou corretamente.')
      return
    }

    if (!token) {
      setErrorMessage('Sua sessão expirou. Faça login novamente para continuar.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      })

      if (error) {
        throw new Error(error.message || 'Erro ao processar pagamento')
      }

      if (paymentIntent?.status === 'succeeded') {
        console.log('[StripeWalletsCheckoutForm] Pagamento aprovado na Stripe, aguardando 500ms antes de confirmar no servidor...')
        // Aguardar um pouco para dar tempo ao webhook processar
        await new Promise(resolve => setTimeout(resolve, 500))
        
        await confirmStripeRecharge({
          paymentIntentId: paymentIntent.id,
          token,
          packageData,
          onSuccess,
        })
      }
    } catch (error) {
      console.error('[StripeWalletsCheckoutForm] Error:', error)
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
          <p className="text-sm font-semibold tracking-[0.18em] text-mystic-goldSoft uppercase">Apple Pay, Google Pay e Link</p>
          <p className="mt-1 text-xs text-ethereal-silver/70">Os métodos exibidos dependem do seu navegador, dispositivo e disponibilidade da sua conta Stripe.</p>
        </div>

        <div className="rounded-xl border border-mystic-gold/30 bg-black/35 px-4 py-4 transition focus-within:border-mystic-gold/70 focus-within:bg-black/50 focus-within:shadow-[0_0_0_1px_rgba(212,175,55,0.22)]">
          <PaymentElement
            options={{
              layout: {
                type: 'accordion',
                defaultCollapsed: false,
              },
            }}
          />
        </div>
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
            Continuar com Apple Pay, Google Pay ou Link
          </span>
        )}
      </button>
    </form>
  )
}

// Componente que exportar para usar
export function RechargeStripeForm({ packageData, onSuccess, onError, variant = 'card' }) {
  const { stripeCredentials, profile, token } = usePlatformContext()
  const [stripePromise, setStripePromise] = useState(null)
  const [clientSecret, setClientSecret] = useState('')
  const [intentLoading, setIntentLoading] = useState(false)
  const [intentError, setIntentError] = useState('')

  useEffect(() => {
    if (stripeCredentials?.publicKey) {
      setStripePromise(loadStripe(stripeCredentials.publicKey))
    }
  }, [stripeCredentials?.publicKey])

  useEffect(() => {
    if (variant !== 'wallets') {
      return
    }

    if (!token || !packageData?.id) {
      setClientSecret('')
      return
    }

    let mounted = true

    const loadClientSecret = async () => {
      setIntentLoading(true)
      setIntentError('')
      try {
        const result = await createStripePaymentIntent({ packageData, profile, token })
        if (mounted) {
          setClientSecret(result.clientSecret || '')
        }
      } catch (error) {
        if (mounted) {
          setIntentError(error.message || 'Erro ao preparar pagamento')
        }
      } finally {
        if (mounted) {
          setIntentLoading(false)
        }
      }
    }

    void loadClientSecret()

    return () => {
      mounted = false
    }
  }, [variant, token, packageData, profile])

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

  if (variant === 'wallets') {
    if (intentLoading) {
      return (
        <GlassCard title="Apple Pay, Google Pay e Link" subtitle="Stripe">
          <div className="py-8 text-center text-sm text-amber-100/70">Preparando métodos rápidos de pagamento...</div>
        </GlassCard>
      )
    }

    if (intentError) {
      return (
        <GlassCard title="Apple Pay, Google Pay e Link" subtitle="Stripe">
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 flex gap-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{intentError}</p>
          </div>
        </GlassCard>
      )
    }

    if (!clientSecret) {
      return null
    }

    return (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance, locale: 'pt-BR' }}>
        <GlassCard title="Apple Pay, Google Pay e Link" subtitle="Stripe Express Checkout">
          <StripeWalletsCheckoutForm
            packageData={packageData}
            clientSecret={clientSecret}
            onSuccess={onSuccess}
            onError={onError}
          />
        </GlassCard>
      </Elements>
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
