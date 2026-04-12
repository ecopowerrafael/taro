
import { useMemo, useState } from 'react'
import { CheckCircle2, Copy, CreditCard, Loader2, QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { usePlatformContext } from '../../context/platform-context'
import { generatePixPayload } from '../../utils/pix'
import { GlassCard } from '../GlassCard'
import { NumerologyStripeCheckoutForm } from './NumerologyStripeCheckoutForm'
import { SacredInput } from './SacredInput'
import styled, { keyframes } from 'styled-components'

const NUMEROLOGY_PRICE = 49.9
const NUMEROLOGY_TITLE = 'Leitura Numerológica Completa'

export function NumerologyPurchaseModal({ onClose, onSuccess, nomeCompleto, dataNascimento }) {
  const { profile, isAuthenticated, mpCredentials, createNumerologyPixOrder, token } = usePlatformContext()
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [copied, setCopied] = useState(false)
  const [pixSubmitting, setPixSubmitting] = useState(false)
  const [pixFeedback, setPixFeedback] = useState('')
  const [stripeSuccess, setStripeSuccess] = useState('')

  const pixPayload = useMemo(() => {
    if (!mpCredentials?.pixKey) {
      return null
    }
    try {
      return generatePixPayload({
        key: mpCredentials.pixKey,
        name: mpCredentials.pixReceiverName || 'Astria Tarot',
        city: mpCredentials.pixReceiverCity || 'SAO PAULO',
        amount: NUMEROLOGY_PRICE,
        description: NUMEROLOGY_TITLE,
      })
    } catch (error) {
      console.error('[NumerologyPurchaseModal] Erro ao gerar payload PIX:', error)
      return null
    }
  }, [mpCredentials])

  const handleCopyPix = async () => {
    if (!pixPayload) return
    await navigator.clipboard.writeText(pixPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handlePixSubmit = async () => {
    setPixSubmitting(true)
    setPixFeedback('')
    const result = await createNumerologyPixOrder({ nomeCompleto, dataNascimento, token })
    setPixSubmitting(false)
    setPixFeedback(result?.message || 'Pedido PIX registrado.')
    if (result?.ok) onSuccess?.()
  }


  // Glassmorphism, SVG, animações e botão styled-components
  // --- Styled Components ---
  const PortalBg = styled.div`
    position: fixed;
    inset: 0;
    z-index: 130;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: rgba(10, 2, 25, 0.82);
    backdrop-filter: blur(15px);
    overflow-y: auto;
  `
  const ModalContainer = styled.div`
    width: 100%;
    max-width: 540px;
    max-height: calc(100vh - 2rem);
    position: relative;
    border-radius: 2.2rem;
    background: rgba(25, 10, 40, 0.7);
    border: 1px solid;
    border-image: linear-gradient(90deg, #ffe066 0%, #bfa14a 100%);
    border-image-slice: 1;
    box-shadow: 0 0 32px 0 #a259ff44, 0 0 0 2px #a259ff22;
    overflow: hidden;
    will-change: transform;
  `
  const auraPulse = keyframes`
    0% { box-shadow: 0 0 32px 0 #a259ff44, 0 0 0 2px #a259ff22; }
    50% { box-shadow: 0 0 48px 8px #a259ff77, 0 0 0 2px #ffe06633; }
    100% { box-shadow: 0 0 32px 0 #a259ff44, 0 0 0 2px #a259ff22; }
  `
  const Aura = styled.div`
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    border-radius: 2.2rem;
    animation: ${auraPulse} 3.5s infinite;
  `
  const fadeInExpand = keyframes`
    0% { opacity: 0; transform: scale(0.7); }
    60% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  `
  const AnimatedContent = styled.div`
    position: relative;
    z-index: 2;
    animation: ${fadeInExpand} 0.85s cubic-bezier(0.22,1,0.36,1);
  `
  // SVG Flor da Vida
  const rotateBg = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  `
  const SacredBg = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    opacity: 0.05;
    pointer-events: none;
    width: 420px;
    height: 420px;
    animation: ${rotateBg} 120s linear infinite;
  `
  // Botão dourado com shine
  const GoldenButton = styled.button`
    position: relative;
    width: 100%;
    border: none;
    border-radius: 1.2rem;
    background: linear-gradient(45deg, #ffe066 0%, #ffd700 40%, #bfa14a 100%);
    color: #2d1a00;
    font-family: 'EB Garamond', serif;
    font-weight: 700;
    font-size: 1.18rem;
    padding: 0.95rem 0;
    margin-top: 0.7rem;
    box-shadow: 0 2px 16px 0 #ffe06633;
    cursor: pointer;
    overflow: hidden;
    transition: box-shadow 0.2s, filter 0.2s;
    outline: none;
    &:hover {
      filter: brightness(1.08);
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .shine {
      position: absolute;
      top: 0;
      left: -60%;
      width: 60%;
      height: 100%;
      background: linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.01) 100%);
      transform: skewX(-18deg);
      pointer-events: none;
      transition: left 0.5s cubic-bezier(0.4,0,0.2,1);
    }
    &:hover .shine {
      left: 110%;
      transition: left 0.5s cubic-bezier(0.4,0,0.2,1);
    }
  `

  // --- Render ---
  return (
    <PortalBg>
      <ModalContainer>
        <Aura />
        <SacredBg>
          {/* SVG Flor da Vida, stroke 0.5px */}
          <svg width="420" height="420" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#ffe066" strokeWidth="0.5">
              {[...Array(7)].map((_, i) => (
                <circle key={i} cx="210" cy="210" r={30 + i * 30} />
              ))}
              {/* Flor da Vida básica */}
              {[...Array(6)].map((_, i) => (
                <circle key={i+10} cx={210 + 90 * Math.cos((i * Math.PI) / 3)} cy={210 + 90 * Math.sin((i * Math.PI) / 3)} r={90} />
              ))}
              <circle cx="210" cy="210" r="90" />
            </g>
          </svg>
        </SacredBg>
        <AnimatedContent>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid #ffe06655',
                color: '#ffe066',
                borderRadius: 10,
                padding: '7px 16px',
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <X size={16} /> Fechar
            </button>
          </div>
          <GlassCard
            title="Portal de Frequências Vibracionais"
            subtitle="Sincronize sua identidade com a matemática do destino."
          >
            <div style={{ margin: '18px 0 0 0' }}>
              <SacredInput
                label="Nome completo"
                icon="user"
                value={nomeCompleto}
                readOnly
                style={{ marginBottom: 18 }}
              />
              <SacredInput
                label="Data de nascimento"
                icon="calendar"
                value={dataNascimento}
                readOnly
              />
            </div>
            <div style={{ margin: '30px 0 0 0', textAlign: 'center' }}>
              <p style={{ color: '#ffe066', fontSize: 18, fontFamily: 'EB Garamond, serif', marginBottom: 6 }}>
                Você está contratando <span style={{ fontWeight: 600 }}>{NUMEROLOGY_TITLE}</span>.
              </p>
              <p style={{ color: '#ffe066', fontSize: 16, marginBottom: 8 }}>
                Valor de <span style={{ fontFamily: 'EB Garamond, serif', fontSize: 22 }}>R$ {NUMEROLOGY_PRICE.toFixed(2)}</span>
              </p>
              <p style={{ color: '#ffe066cc', fontSize: 14, marginBottom: 8 }}>
                O material será enviado para <span style={{ fontWeight: 600 }}>{profile?.email || 'seu e-mail cadastrado'}</span>.
              </p>
              <p style={{ color: '#ffe06699', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 0 }}>
                Como você prefere pagar?
              </p>
            </div>
            {!isAuthenticated ? (
              <div style={{ margin: '22px 0 0 0', textAlign: 'center' }}>
                <p style={{ color: '#ffe066bb', fontSize: 15, marginBottom: 12 }}>Faça login ou crie uma conta para concluir o pedido da sua leitura numerológica.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <a href="/entrar" style={{ background: '#ffe066', color: '#2d1a00', borderRadius: 8, padding: '8px 22px', fontWeight: 600, textDecoration: 'none', fontSize: 15, marginRight: 4 }} onClick={onClose}>
                    Entrar
                  </a>
                  <a href="/cadastro" style={{ border: '1px solid #ffe06699', color: '#ffe066', borderRadius: 8, padding: '8px 22px', textDecoration: 'none', fontSize: 15 }} onClick={onClose}>
                    Criar conta
                  </a>
                </div>
              </div>
            ) : stripeSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '28px 0 18px 0', textAlign: 'center' }}>
                <div style={{ background: 'rgba(52, 211, 153, 0.18)', color: '#34d399', borderRadius: '50%', padding: 18 }}>
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <p style={{ color: '#ffe066', fontWeight: 600, fontSize: 20 }}>Pedido confirmado</p>
                  <p style={{ color: '#ffe066cc', fontSize: 15, marginTop: 8 }}>{stripeSuccess}</p>
                </div>
              </div>
            ) : (
              <div style={{ margin: '28px 0 0 0' }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 18, marginBottom: 18 }}>
                  <GoldenButton
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    style={paymentMethod === 'pix' ? { boxShadow: '0 0 0 2px #ffe06699, 0 2px 16px 0 #ffe06633', filter: 'brightness(1.08)' } : {}}
                  >
                    <QrCode size={18} style={{ marginRight: 6 }} /> PIX
                    <span className="shine" />
                  </GoldenButton>
                  <GoldenButton
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    style={paymentMethod === 'card' ? { boxShadow: '0 0 0 2px #ffe06699, 0 2px 16px 0 #ffe06633', filter: 'brightness(1.08)' } : {}}
                  >
                    <CreditCard size={18} style={{ marginRight: 6 }} /> Cartão de crédito
                    <span className="shine" />
                  </GoldenButton>
                </div>
                {paymentMethod === 'pix' && (
                  <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid #ffe06633', borderRadius: 18, padding: 18, marginTop: 8 }}>
                    <p style={{ color: '#ffe066cc', fontSize: 15, marginBottom: 10 }}>Escaneie o QR Code, conclua o PIX e depois registre o pedido para validação.</p>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {pixPayload ? (
                          <div style={{ background: '#fff', border: '3px solid #ffe066', borderRadius: 16, padding: 8 }}>
                            <QRCodeSVG value={pixPayload} size={180} />
                          </div>
                        ) : (
                          <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.18)', border: '1px dashed #ffe06655', borderRadius: 16, color: '#ffe06655', fontSize: 13, textAlign: 'center' }}>
                            PIX não configurado no admin.
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: 'rgba(0,0,0,0.13)', border: '1px solid #ffe06633', borderRadius: 12, padding: 10 }}>
                          <p style={{ color: '#ffe06699', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Copia e cola</p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <textarea
                              readOnly
                              value={pixPayload || 'Código indisponível'}
                              style={{ minHeight: 60, flex: 1, resize: 'none', borderRadius: 8, border: '1px solid #ffe06633', background: 'rgba(0,0,0,0.18)', color: '#ffe066', fontSize: 13, padding: 8, outline: 'none' }}
                            />
                            <button
                              onClick={handleCopyPix}
                              style={{ background: 'rgba(255,224,102,0.13)', border: '1px solid #ffe06655', color: '#ffe066', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', transition: 'background 0.2s' }}
                            >
                              <Copy size={16} /> {copied ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                        <GoldenButton
                          type="button"
                          onClick={handlePixSubmit}
                          disabled={pixSubmitting || !pixPayload}
                        >
                          {pixSubmitting ? <Loader2 className="animate-spin" style={{ width: 18, height: 18, marginRight: 8, verticalAlign: -3 }} /> : <CheckCircle2 style={{ width: 18, height: 18, marginRight: 8, verticalAlign: -3 }} />}
                          REVELAR MEU MAPA SAGRADO →
                          <span className="shine" />
                        </GoldenButton>
                        {pixFeedback && <div style={{ color: '#ffe066cc', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{pixFeedback}</div>}
                      </div>
                    </div>
                  </div>
                )}
                {paymentMethod === 'card' && (
                  <NumerologyStripeCheckoutForm
                    amount={NUMEROLOGY_PRICE}
                    onSuccess={() => {
                      setStripeSuccess('Pagamento confirmado! Pedido enviado ao admin.')
                      onSuccess?.()
                    }}
                    onError={() => setStripeSuccess('Erro ao processar pagamento.')}
                  />
                )}
              </div>
            )}
          </GlassCard>
        </AnimatedContent>
      </ModalContainer>
    </PortalBg>
  )
}
