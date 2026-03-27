import { useEffect, useState, useMemo } from 'react'
import { WalletCards, QrCode, CreditCard, Copy, CheckCircle2, Loader2, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { QRCodeSVG } from 'qrcode.react'
import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'
import { RechargeStripeForm } from '../components/RechargeStripeForm'
import { usePlatformContext } from '../context/platform-context'

// Manual BRCode (PIX) Generator to avoid Node.js buffer issues
function generatePixPayload({ key, name, city, amount, description }) {
  const pad = (v) => v.toString().length.toString().padStart(2, '0')
  
  // No JavaScript, a ordem de iteração de objetos com chaves numéricas não é garantida 
  // da forma que escrevemos. Vamos usar um array de objetos para forçar a ordem EXATA.
  const sections = [
    { id: '00', value: '01' }, // Payload Format Indicator
    { id: '01', value: '11' }, // Point of Initiation Method
    { 
      id: '26', 
      value: [
        { id: '00', value: 'br.gov.bcb.pix' },
        { id: '01', value: key.replace(/\s/g, '') },
        { id: '02', value: (description || 'Recarga Astria').substring(0, 25) }
      ] 
    },
    { id: '52', value: '0000' }, // Merchant Category Code
    { id: '53', value: '986' }, // Transaction Currency (BRL)
    { id: '54', value: amount.toFixed(2) }, // Transaction Amount
    { id: '58', value: 'BR' }, // Country Code
    { id: '59', value: name.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() }, // Merchant Name
    { id: '60', value: city.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() }, // Merchant City
    { 
      id: '62', 
      value: [
        { id: '05', value: '***' } // Reference Label
      ]
    }
  ]

  let payload = ''
  
  const build = (id, value) => {
    if (Array.isArray(value)) {
      let sub = ''
      value.forEach((item) => {
        sub += item.id + pad(item.value) + item.value
      })
      return id + pad(sub) + sub
    }
    return id + pad(value) + value
  }

  sections.forEach((item) => {
    payload += build(item.id, item.value)
  })

  payload += '6304' // CRC ID and length

  // Note: Standard PIX uses CRC16 CCITT-FALSE (0x1021). 
  function crc16ccitt(data) {
    let crc = 0xFFFF
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021
        } else {
          crc = crc << 1
        }
      }
    }
    const hex = (crc & 0xFFFF).toString(16).toUpperCase()
    return hex.padStart(4, '0')
  }

  // Ensure '000201' is at the very beginning of the string manually if needed, 
  // but our section builder already handles it if '00' is the first key.
  return payload + crc16ccitt(payload)
}

export function RecarregarPage() {
  const { minutePackages, rechargePackage, paymentResult, minutesBalance, mpCredentials, requestRecharge, stripeCredentials } = usePlatformContext()
  const [paymentMethod, setPaymentMethod] = useState(null) // 'pix' | 'card'
  const [selectedPack, setSelectedPack] = useState(null)
  const [copied, setCopied] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [stripeSuccess, setStripeSuccess] = useState(false)
  const [cardModalOpen, setCardModalOpen] = useState(false)

  // Gerar Pix Copia e Cola dinâmico baseado no pacote
  const pixData = useMemo(() => {
    if (!selectedPack || !mpCredentials?.pixKey) return null
    
    try {
      const amount = selectedPack.promoPrice ?? selectedPack.price
      return generatePixPayload({
        key: mpCredentials.pixKey,
        name: mpCredentials.pixReceiverName || 'Astria Tarot',
        city: mpCredentials.pixReceiverCity || 'SAO PAULO',
        amount: amount,
        description: `Recarga Astria ${selectedPack.minutes}min`,
      })
    } catch (e) {
      console.error('Erro ao gerar PIX:', e)
      return null
    }
  }, [selectedPack, mpCredentials])

  useEffect(() => {
    if (paymentResult?.status !== 'approved' && !stripeSuccess) {
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
  }, [paymentResult?.status, stripeSuccess])

  const handleCopyPix = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePixRequest = async () => {
    if (!selectedPack) return
    setRequesting(true)
    const amount = selectedPack.promoPrice ?? selectedPack.price
    const ok = await requestRecharge(amount, selectedPack.minutes, 'pix')
    setRequesting(false)
    if (ok) {
      const msg = encodeURIComponent(`Olá, realizei uma recarga no app no valor de R$ ${amount.toFixed(2).replace('.', ',')} e gostaria de enviar o comprovante para creditar em minha conta.`)
      window.open(`https://wa.me/551152864205?text=${msg}`, '_blank')
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

      {!selectedPack ? (
        <GlassCard title="Escolha um Pacote" subtitle="Selecione o valor desejado para recarga.">
          <div className="grid gap-4 md:grid-cols-3">
            {minutePackages.map((pack) => {
              const finalPrice = pack.promoPrice ?? pack.price
              return (
                <article
                  key={pack.id}
                  className={`rounded-xl border p-4 cursor-pointer transition hover:scale-[1.02] ${
                    pack.isFeatured
                      ? 'border-mystic-gold/70 bg-gradient-to-br from-mystic-gold/10 to-black/30'
                      : 'border-mystic-gold/35 bg-black/30'
                  }`}
                  onClick={() => setSelectedPack(pack)}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg text-amber-50">R$ {finalPrice.toFixed(2)}</p>
                    </div>
                    {pack.isFeatured && (
                      <span className="rounded-full border border-mystic-gold/70 bg-mystic-gold/20 px-2 py-1 text-[10px] uppercase tracking-wide text-mystic-goldSoft">
                        Mais escolhido
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-mystic-gold/10 py-2 text-xs text-mystic-goldSoft">
                      <WalletCards size={14} />
                      Selecionar este pacote
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-6">
          <div className="flex justify-start">
            <button 
              onClick={() => {
                setSelectedPack(null)
                setPaymentMethod(null)
              }}
              className="text-sm text-mystic-goldSoft underline transition hover:text-mystic-gold"
            >
              ← Voltar para pacotes
            </button>
          </div>

          <GlassCard 
            title={`Pacote R$ ${(selectedPack.promoPrice ?? selectedPack.price).toFixed(2)}`} 
            subtitle="Escolha o método de pagamento para este pacote."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`flex flex-col items-center gap-4 rounded-xl border p-6 transition ${
                  paymentMethod === 'pix' ? 'border-mystic-gold bg-mystic-gold/10' : 'border-mystic-gold/30 bg-black/30 hover:bg-black/50'
                }`}
              >
                <div className="rounded-full bg-mystic-gold/10 p-3 text-mystic-gold">
                  <QrCode size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-display text-lg text-mystic-goldSoft">Pagar com Pix</h3>
                  <p className="text-[10px] text-amber-100/60 uppercase">Manual / QR Code</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setPaymentMethod('card')
                  setCardModalOpen(true)
                }}
                className={`flex flex-col items-center gap-4 rounded-xl border p-6 transition ${
                  paymentMethod === 'card' ? 'border-mystic-gold bg-mystic-gold/10' : 'border-mystic-gold/30 bg-black/30 hover:bg-black/50'
                }`}
              >
                <div className="rounded-full bg-mystic-gold/10 p-3 text-mystic-gold">
                  <CreditCard size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-display text-lg text-mystic-goldSoft">Cartão de Crédito</h3>
                </div>
              </button>
            </div>
          </GlassCard>

          {paymentMethod === 'pix' && (
            <GlassCard title="Pagamento via Pix" subtitle="Escaneie o QR Code ou use o código Copia e Cola.">
              <div className="flex flex-col items-center gap-6">
                {pixData ? (
                  <div className="rounded-xl border-4 border-white bg-white p-2">
                    <QRCodeSVG value={pixData} size={200} />
                  </div>
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-dashed border-mystic-gold/30 bg-black/20 text-center text-xs text-amber-100/40">
                    Erro ao gerar QR Code. Verifique as configurações no admin.
                  </div>
                )}
                
                <div className="w-full max-w-sm space-y-3">
                  <p className="text-center text-sm text-amber-100/70 font-medium">Código Copia e Cola</p>
                  <div className="relative">
                    <input
                      readOnly
                      value={pixData || 'Código não disponível'}
                      className="w-full rounded-lg border border-mystic-gold/35 bg-black/35 py-3 pl-4 pr-12 text-xs text-amber-50 outline-none"
                    />
                    <button
                      onClick={handleCopyPix}
                      disabled={!pixData}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-mystic-gold transition hover:bg-mystic-gold/10 disabled:opacity-30"
                    >
                      {copied ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-sm">
                  <button
                    onClick={handlePixRequest}
                    disabled={requesting || !pixData}
                    className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-50"
                  >
                    {requesting ? <Loader2 className="animate-spin" size={20} /> : 'Já realizei o pagamento'}
                  </button>
                  <p className="text-center text-[10px] text-amber-100/50">
                    O saldo será liberado após a confirmação manual do administrador.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

        </div>
      )}

      {cardModalOpen && selectedPack && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => {
                  setCardModalOpen(false)
                  setStripeSuccess(false)
                  setPaymentMethod(null)
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/35 bg-black/40 px-3 py-2 text-sm text-amber-100/80 transition hover:bg-black/60"
              >
                <X size={16} />
                Fechar
              </button>
            </div>

            {stripeSuccess ? (
              <GlassCard title="Pagamento Confirmado" subtitle="Seu pagamento foi processado com sucesso!">
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="rounded-full bg-emerald-500/20 p-4 text-emerald-400">
                    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="mb-2 text-lg font-semibold text-mystic-goldSoft">Pagamento Recebido!</p>
                    <p className="mb-4 text-sm text-amber-100/70">
                      Seus créditos foram processados e a confirmação do Stripe foi concluída.
                    </p>
                    <p className="text-xs text-amber-100/50">Você já pode voltar e conferir o saldo atualizado.</p>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <RechargeStripeForm
                packageData={selectedPack}
                onSuccess={() => {
                  setStripeSuccess(true)
                  setTimeout(() => {
                    setCardModalOpen(false)
                    setSelectedPack(null)
                    setPaymentMethod(null)
                    setStripeSuccess(false)
                  }, 3000)
                }}
                onError={(error) => {
                  console.error('Erro no Stripe:', error)
                }}
              />
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
