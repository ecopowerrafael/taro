import { useEffect } from 'react'
import { WalletCards } from 'lucide-react'
import confetti from 'canvas-confetti'
import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function RecarregarPage() {
  const { minutePackages, rechargePackage, paymentResult, minutesBalance } = usePlatformContext()

  useEffect(() => {
    if (paymentResult?.status !== 'approved') {
      return
    }

    confetti({
      particleCount: 160,
      spread: 85,
      gravity: 0.35,
      scalar: 0.95,
      ticks: 280,
      colors: ['#C5A059', '#FFFFFF'],
      origin: { y: 0.62 },
    })
  }, [paymentResult?.status])

  return (
    <PageShell title="Recarregar Saldo" subtitle="Escolha um pacote e conclua a compra via Mercado Pago.">
      <GlassCard
        title="Saldo atual"
        subtitle="Você pode comprar minutos conforme sua necessidade."
      >
        <p className="font-display text-4xl text-mystic-goldSoft">{minutesBalance.toFixed(2)} min</p>
      </GlassCard>

      <GlassCard
        title="Pacotes de Recarga"
        subtitle="Pagamento processado por Mercado Pago."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {minutePackages.map((pack) => {
            const finalPrice = pack.promoPrice ?? pack.price
            const hasDiscount = pack.promoPrice !== null

            return (
              <article
                key={pack.id}
                className={`rounded-xl border p-4 ${
                  pack.isFeatured
                    ? 'border-mystic-gold/70 bg-gradient-to-br from-mystic-gold/10 to-black/30'
                    : 'border-mystic-gold/35 bg-black/30'
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-3xl text-mystic-goldSoft">{pack.minutes} min</p>
                    {hasDiscount && (
                      <p className="text-xs text-amber-100/60 line-through">R$ {pack.price.toFixed(2)}</p>
                    )}
                    <p className="text-lg text-amber-50">R$ {finalPrice.toFixed(2)}</p>
                  </div>
                  {pack.isFeatured && (
                    <span className="rounded-full border border-mystic-gold/70 bg-mystic-gold/20 px-2 py-1 text-[10px] uppercase tracking-wide text-mystic-goldSoft">
                      Mais escolhido
                    </span>
                  )}
                </div>

                <button
                  onClick={() => rechargePackage(pack)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-mystic-gold/70 bg-gradient-to-r from-mystic-gold/90 to-amber-500/85 px-4 py-2 text-sm font-medium text-black transition hover:brightness-110"
                >
                  <WalletCards size={16} />
                  Comprar com Mercado Pago
                </button>
              </article>
            )
          })}
        </div>
        {paymentResult && (
          <div className="mt-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            Pagamento {paymentResult.status}: {paymentResult.preferenceId}
          </div>
        )}
      </GlassCard>
    </PageShell>
  )
}
