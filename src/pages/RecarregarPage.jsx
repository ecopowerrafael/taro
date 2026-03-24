import { useEffect, useState } from 'react'
import { WalletCards, QrCode, CreditCard, Copy, CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function RecarregarPage() {
  const { minutePackages, rechargePackage, paymentResult, minutesBalance, mpCredentials, systemNotice } = usePlatformContext()
  const [paymentMethod, setPaymentMethod] = useState(null) // 'pix' | 'card'
  const [copied, setCopied] = useState(false)

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

  const handleCopyPix = () => {
    if (mpCredentials?.pixCopyPaste) {
      navigator.clipboard.writeText(mpCredentials.pixCopyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <PageShell title="Recarregar Saldo" subtitle="Escolha como deseja adicionar créditos à sua conta.">
      <GlassCard
        title="Saldo atual"
        subtitle="Você pode adicionar Saldo conforme sua necessidade."
      >
        <p className="font-display text-4xl text-mystic-goldSoft">R$ {minutesBalance.toFixed(2)}</p>
      </GlassCard>

      {!paymentMethod ? (
        <GlassCard title="Escolha o Método de Pagamento" subtitle="Selecione como deseja pagar.">
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setPaymentMethod('pix')}
              className="flex flex-col items-center gap-4 rounded-xl border border-mystic-gold/30 bg-black/30 p-8 transition hover:border-mystic-gold/60 hover:bg-black/50"
            >
              <div className="rounded-full bg-mystic-gold/10 p-4 text-mystic-gold">
                <QrCode size={40} />
              </div>
              <div className="text-center">
                <h3 className="font-display text-xl text-mystic-goldSoft">Pix</h3>
                <p className="text-xs text-amber-100/60">Liberação instantânea</p>
              </div>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className="flex flex-col items-center gap-4 rounded-xl border border-mystic-gold/30 bg-black/30 p-8 transition hover:border-mystic-gold/60 hover:bg-black/50"
            >
              <div className="rounded-full bg-mystic-gold/10 p-4 text-mystic-gold">
                <CreditCard size={40} />
              </div>
              <div className="text-center">
                <h3 className="font-display text-xl text-mystic-goldSoft">Cartão de Crédito</h3>
                <p className="text-xs text-amber-100/60">Processado por Mercado Pago</p>
              </div>
            </button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-6">
          <div className="flex justify-start">
            <button 
              onClick={() => setPaymentMethod(null)}
              className="text-sm text-mystic-goldSoft underline transition hover:text-mystic-gold"
            >
              ← Voltar para escolha de método
            </button>
          </div>

          {paymentMethod === 'pix' && (
            <GlassCard title="Pagamento via Pix" subtitle="Escaneie o QR Code ou use o código Copia e Cola.">
              <div className="flex flex-col items-center gap-6">
                {mpCredentials?.pixQR ? (
                  <div className="rounded-xl border-4 border-white bg-white p-2">
                    <img src={mpCredentials.pixQR} alt="QR Code Pix" className="h-48 w-48" />
                  </div>
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-dashed border-mystic-gold/30 bg-black/20 text-center text-xs text-amber-100/40">
                    QR Code não configurado pelo administrador.
                  </div>
                )}
                
                <div className="w-full max-w-sm space-y-3">
                  <p className="text-center text-sm text-amber-100/70 font-medium">Código Copia e Cola</p>
                  <div className="relative">
                    <input
                      readOnly
                      value={mpCredentials?.pixCopyPaste || 'Código não disponível'}
                      className="w-full rounded-lg border border-mystic-gold/35 bg-black/35 py-3 pl-4 pr-12 text-xs text-amber-50 outline-none"
                    />
                    <button
                      onClick={handleCopyPix}
                      disabled={!mpCredentials?.pixCopyPaste}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-mystic-gold transition hover:bg-mystic-gold/10 disabled:opacity-30"
                    >
                      {copied ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-mystic-gold/20 bg-mystic-gold/5 p-4 text-center">
                  <p className="text-xs text-amber-100/80">
                    Após realizar o pagamento, envie o comprovante para nosso suporte para liberação imediata do saldo.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {paymentMethod === 'card' && (
            <GlassCard
              title="Pacotes de Recarga"
              subtitle="Pagamento processado por Mercado Pago."
            >
              <div className="grid gap-4 md:grid-cols-3">
                {minutePackages.map((pack) => {
                  const finalPrice = pack.promoPrice ?? pack.price

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
                          <p className="font-display text-3xl text-mystic-goldSoft">R$ {finalPrice.toFixed(2)}</p>
                          <p className="text-xs text-amber-100/60">Crédito em conta</p>
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
                        Comprar agora
                      </button>
                    </article>
                  )
                })}
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </PageShell>
  )
}
