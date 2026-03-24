import { useEffect, useState, useMemo } from 'react'
import { WalletCards, QrCode, CreditCard, Copy, CheckCircle2, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { QRCodeSVG } from 'qrcode.react'
import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

// Manual BRCode (PIX) Generator to avoid Node.js buffer issues
function generatePixPayload({ key, name, city, amount, description }) {
  const pad = (v) => v.toString().length.toString().padStart(2, '0')
  
  const sections = {
    '00': '01', // Payload Format Indicator
    '26': { // Merchant Account Information
      '00': 'br.gov.bcb.pix',
      '01': key.replace(/\s/g, ''),
      '02': description || 'Recarga Astria'
    },
    '52': '0000', // Merchant Category Code
    '53': '986', // Transaction Currency (BRL)
    '54': amount.toFixed(2), // Transaction Amount
    '58': 'BR', // Country Code
    '59': name.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, ''), // Merchant Name
    '60': city.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, ''), // Merchant City
    '62': { // Additional Data Field Template
      '05': 'ASTRIA' // Reference Label
    }
  }

  let payload = ''
  
  const build = (id, value) => {
    if (typeof value === 'object') {
      let sub = ''
      Object.entries(value).forEach(([subId, subVal]) => {
        sub += subId + pad(subVal) + subVal
      })
      return id + pad(sub) + sub
    }
    return id + pad(value) + value
  }

  Object.entries(sections).forEach(([id, val]) => {
    payload += build(id, val)
  })

  payload += '6304' // CRC ID and length

  // Simple CRC16 CCITT (Kermit) calculation
  function crc16(str) {
    let crc = 0xFFFF
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i)
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x0001) !== 0) {
          crc = (crc >> 1) ^ 0x8408
        } else {
          crc >>= 1
        }
      }
    }
    return ((crc ^ 0xFFFF) & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
  }

  // Note: Standard PIX uses CRC16 CCITT-FALSE (0x1021). 
  // Let's use a standard implementation or just skip CRC if not strictly needed for display (though it is for payment).
  // Actually, PIX REQUIRES a valid CRC16.
  
  function crc16ccitt(data) {
    let crc = 0xFFFF
    const poly = 0x1021
    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8)
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ poly) & 0xFFFF
        } else {
          crc = (crc << 1) & 0xFFFF
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0')
  }

  return payload + crc16ccitt(payload)
}

export function RecarregarPage() {
  const { minutePackages, rechargePackage, paymentResult, minutesBalance, mpCredentials, requestRecharge } = usePlatformContext()
  const [paymentMethod, setPaymentMethod] = useState(null) // 'pix' | 'card'
  const [selectedPack, setSelectedPack] = useState(null)
  const [copied, setCopied] = useState(false)
  const [requesting, setRequesting] = useState(false)

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
      alert('Solicitação enviada! Após o pagamento, seu saldo será liberado pelo administrador.')
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
                      <p className="font-display text-3xl text-mystic-goldSoft">{pack.minutes} min</p>
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
            title={`Pacote ${selectedPack.minutes} min - R$ ${(selectedPack.promoPrice ?? selectedPack.price).toFixed(2)}`} 
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
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center gap-4 rounded-xl border p-6 transition ${
                  paymentMethod === 'card' ? 'border-mystic-gold bg-mystic-gold/10' : 'border-mystic-gold/30 bg-black/30 hover:bg-black/50'
                }`}
              >
                <div className="rounded-full bg-mystic-gold/10 p-3 text-mystic-gold">
                  <CreditCard size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-display text-lg text-mystic-goldSoft">Cartão de Crédito</h3>
                  <p className="text-[10px] text-amber-100/60 uppercase">Mercado Pago</p>
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

          {paymentMethod === 'card' && (
            <div className="flex flex-col items-center py-8">
              <button
                onClick={() => rechargePackage(selectedPack)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-mystic-gold/70 bg-gradient-to-r from-mystic-gold/90 to-amber-500/85 px-12 py-4 font-bold text-black transition hover:brightness-110"
              >
                <WalletCards size={20} />
                Pagar R$ {(selectedPack.promoPrice ?? selectedPack.price).toFixed(2)} com Mercado Pago
              </button>
              <p className="mt-4 text-xs text-amber-100/60">Você será redirecionado para o ambiente seguro do Mercado Pago.</p>
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
