import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, Star, ArrowLeft, MessageCircle, Video, Users, Loader2, Wallet } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'
import { QuestionFlowModal } from '../components/QuestionFlowModal'
import { SeoHead } from '../components/SeoHead'
import { usePlatformContext } from '../context/platform-context'
import { buildAbsoluteUrl } from '../data/siteConfig'

const statusStyles = {
  Online: 'border-emerald-400/70 bg-emerald-500/15 text-emerald-300',
  Ocupado: 'border-amber-400/70 bg-amber-500/10 text-amber-300',
  Offline: 'border-zinc-400/70 bg-zinc-500/10 text-zinc-300',
}

const isConsultantOnline = (consultant) => consultant?.status === 'Online'

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= value ? 'text-stardust-gold fill-stardust-gold' : 'text-zinc-600'}
        />
      ))}
    </div>
  )
}

export function ConsultorPerfilPage() {
  const { consultantId } = useParams()
  const navigate = useNavigate()
  const {
    profile,
    minutesBalance,
    submitQuestionConsultation,
    token,
    selectConsultant,
    systemNotice,
    setSystemNotice,
  } = usePlatformContext()
  const [consultant, setConsultant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [questionFlow, setQuestionFlow] = useState({
    isOpen: false,
    consultant: null,
    questionCount: 0,
    price: 0,
  })
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState({ isOpen: false, minRequired: 0 })
  const [confirmCallModal, setConfirmCallModal] = useState({ isOpen: false, consultant: null })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/consultants/${consultantId}/public`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Consultor não encontrado.')
        }
        const data = await res.json()
        setConsultant(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [consultantId])

  const buildConsultantStructuredData = () => {
    if (!consultant) {
      return null
    }

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: consultant.name,
        description: consultant.description || consultant.tagline || `Consultor espiritual online da Astria: ${consultant.name}.`,
        image: consultant.photo || buildAbsoluteUrl('/logoastria.png'),
        url: buildAbsoluteUrl(`/consultor/${consultant.id}`),
        knowsAbout: ['tarot online', 'consulta espiritual', 'astrologia', 'orientacao energetica'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `Consulta espiritual com ${consultant.name}`,
        description:
          consultant.description ||
          consultant.tagline ||
          `Agende uma consulta espiritual online com ${consultant.name} na Astria.`,
        provider: {
          '@type': 'Person',
          name: consultant.name,
        },
        areaServed: 'BR',
        offers: [
          Number(consultant.pricePerMinute) > 0
            ? {
                '@type': 'Offer',
                price: Number(consultant.pricePerMinute).toFixed(2),
                priceCurrency: 'BRL',
                availability: 'https://schema.org/InStock',
                url: buildAbsoluteUrl(`/consultor/${consultant.id}`),
              }
            : null,
        ].filter(Boolean),
      },
    ]
  }

  if (loading) {
    return (
      <PageShell title="Perfil do Consultor" subtitle="Carregando...">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-mystic-gold" size={48} />
        </div>
      </PageShell>
    )
  }

  if (error || !consultant) {
    return (
      <PageShell title="Perfil do Consultor" subtitle="">
        <GlassCard>
          <p className="text-center text-red-400">{error || 'Consultor não encontrado.'}</p>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-mystic-goldSoft underline"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
        </GlassCard>
      </PageShell>
    )
  }

  const totalConsultations = (consultant.baseConsultations ?? 0) + (consultant.realSessions ?? 0)
  const reviews = consultant.reviews ?? []

  const handleChooseService = (mode) => {
    if (mode === 'video') {
      if (!profile) {
        setSystemNotice('Faça login ou cadastre-se para iniciar a consulta.')
        return
      }

      if (!isConsultantOnline(consultant)) {
        setSystemNotice('Este consultor não está online no momento. Escolha um consultor online para iniciar a chamada ao vivo.')
        return
      }

      const minRequired = Number(consultant.pricePerMinute) * 5
      if (minutesBalance < minRequired) {
        setInsufficientBalanceModal({ isOpen: true, minRequired })
        return
      }

      setConfirmCallModal({ isOpen: true, consultant })
      return
    }

    if (!profile) {
      setSystemNotice('Faça login ou cadastre-se para enviar perguntas ao consultor.')
      return
    }

    const config =
      mode === '3-questions'
        ? { questionCount: 3, price: Number(consultant.priceThreeQuestions) }
        : { questionCount: 5, price: Number(consultant.priceFiveQuestions) }

    if (minutesBalance < config.price) {
      setSystemNotice('Saldo insuficiente para o pacote de perguntas selecionado.')
      return
    }

    selectConsultant(consultant)
    setQuestionFlow({
      isOpen: true,
      consultant,
      questionCount: config.questionCount,
      price: config.price,
    })
    setSystemNotice('')
  }

  const closeQuestionFlow = () => {
    setQuestionFlow({ isOpen: false, consultant: null, questionCount: 0, price: 0 })
  }

  const confirmSendQuestions = (entries) => {
    submitQuestionConsultation({
      consultant: questionFlow.consultant,
      questionCount: questionFlow.questionCount,
      price: questionFlow.price,
      entries,
    })
  }

  const handleStartVideoConsultation = async () => {
    if (!confirmCallModal.consultant) {
      return
    }

    if (!isConsultantOnline(confirmCallModal.consultant)) {
      setConfirmCallModal({ isOpen: false, consultant: null })
      setSystemNotice('Este consultor não está online no momento. Escolha um consultor online para iniciar a chamada ao vivo.')
      return
    }

    const selectedConsultantId = confirmCallModal.consultant.id
    setConfirmCallModal({ isOpen: false, consultant: null })
    setSystemNotice('Criando sala segura e notificando consultor...')

    try {
      if (!token) {
        setSystemNotice('Sessão expirada. Faça login para iniciar uma consulta de vídeo.')
        return
      }

      const cleanToken = token.replace(/^"|"$/g, '').trim()
      const response = await fetch('/api/video-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanToken}`,
        },
        body: JSON.stringify({ consultantId: selectedConsultantId }),
      })

      const data = await response.json()
      if (!response.ok) {
        setSystemNotice(data.message || 'Erro ao iniciar sessão de vídeo.')
        return
      }

      setSystemNotice('')
      navigate(`/sala/${data.sessionId}`)
    } catch (requestError) {
      console.error(requestError)
      setSystemNotice('Erro de conexão ao tentar iniciar a sala.')
    }
  }

  return (
    <PageShell title="Perfil do Consultor" subtitle="Conheça o especialista antes de iniciar sua consulta.">
      <SeoHead
        title={`${consultant.name} | Consultor espiritual online na Astria`}
        description={
          consultant.tagline ||
          consultant.description ||
          `Conheca ${consultant.name}, consultor espiritual online na Astria, e escolha a melhor forma de atendimento para sua consulta.`
        }
        keywords={[
          consultant.name,
          'consultor espiritual online',
          'tarot online',
          'consulta espiritual',
          consultant.tagline || 'orientacao espiritual',
        ]}
        path={`/consultor/${consultant.id}`}
        image={consultant.photo || '/logoastria.png'}
        structuredData={buildConsultantStructuredData()}
      />
      {systemNotice && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          <AlertTriangle size={16} />
          {systemNotice}
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm text-amber-100/70 transition hover:text-mystic-goldSoft"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <GlassCard>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex-shrink-0">
            {consultant.photo ? (
              <img
                src={consultant.photo}
                alt={`Foto de ${consultant.name}`}
                className="h-28 w-28 rounded-full border-2 border-mystic-gold/80 object-cover shadow-[0_0_20px_rgba(197,160,89,0.3)]"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-mystic-gold/40 bg-black/40 text-3xl text-mystic-goldSoft">
                {consultant.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl text-mystic-goldSoft">{consultant.name}</h1>
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  statusStyles[consultant.status] ?? statusStyles.Offline
                }`}
              >
                {consultant.status}
              </span>
            </div>

            {consultant.tagline && (
              <p className="mb-3 text-base text-amber-100/85 italic">"{consultant.tagline}"</p>
            )}

            <div className="flex flex-wrap gap-5 text-sm text-ethereal-silver/80">
              <span className="inline-flex items-center gap-1.5">
                <Users size={15} className="text-mystic-goldSoft" />
                <span>{totalConsultations} consultas realizadas</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <Star size={15} className="fill-stardust-gold text-stardust-gold" />
                <span className="font-semibold text-stardust-gold">
                  {consultant.ratingAverage?.toFixed(1) ?? '0.0'}
                </span>
                <span className="text-xs text-ethereal-silver/60">
                  ({reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''})
                </span>
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {Number(consultant.pricePerMinute) > 0 && (
                <button
                  type="button"
                  onClick={() => handleChooseService('video')}
                  disabled={!isConsultantOnline(consultant)}
                  className="group rounded-2xl border border-emerald-400/45 bg-emerald-500/10 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 enabled:hover:border-emerald-300/70 enabled:hover:bg-emerald-500/15"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/70">Vídeo ao vivo</p>
                      <p className="mt-1 text-xl font-semibold text-emerald-100">
                        R$ {Number(consultant.pricePerMinute).toFixed(2)}
                        <span className="ml-1 text-sm font-normal text-emerald-200/70">/ min</span>
                      </p>
                    </div>
                    <Video size={20} className="text-emerald-300 transition group-enabled:hover:scale-110" />
                  </div>
                  <p className="mt-3 text-sm text-emerald-100/80">
                    {isConsultantOnline(consultant)
                      ? 'Iniciar chamada de vídeo com este consultor.'
                      : 'Chamada ao vivo disponível apenas quando o consultor estiver online.'}
                  </p>
                </button>
              )}
              {Number(consultant.priceThreeQuestions) > 0 && (
                <button
                  type="button"
                  onClick={() => handleChooseService('3-questions')}
                  className="group rounded-2xl border border-mystic-gold/35 bg-black/30 p-4 text-left transition hover:border-mystic-gold/65 hover:bg-mystic-gold/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-mystic-goldSoft/75">Pacote de perguntas</p>
                      <p className="mt-1 text-xl font-semibold text-amber-50">R$ {Number(consultant.priceThreeQuestions).toFixed(2)}</p>
                    </div>
                    <MessageCircle size={20} className="text-mystic-goldSoft transition group-hover:scale-110" />
                  </div>
                  <p className="mt-3 text-sm text-amber-100/80">Enviar 3 perguntas para resposta detalhada.</p>
                </button>
              )}
              {Number(consultant.priceFiveQuestions) > 0 && (
                <button
                  type="button"
                  onClick={() => handleChooseService('5-questions')}
                  className="group rounded-2xl border border-mystic-gold/35 bg-black/30 p-4 text-left transition hover:border-mystic-gold/65 hover:bg-mystic-gold/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-mystic-goldSoft/75">Pacote estendido</p>
                      <p className="mt-1 text-xl font-semibold text-amber-50">R$ {Number(consultant.priceFiveQuestions).toFixed(2)}</p>
                    </div>
                    <MessageCircle size={20} className="text-mystic-goldSoft transition group-hover:scale-110" />
                  </div>
                  <p className="mt-3 text-sm text-amber-100/80">Enviar 5 perguntas e aprofundar a leitura.</p>
                </button>
              )}
            </div>
          </div>
        </div>

        {consultant.description && (
          <div className="mt-6 border-t border-mystic-gold/20 pt-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-mystic-goldSoft/70">
              Sobre
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-100/80">
              {consultant.description}
            </p>
          </div>
        )}
      </GlassCard>

      <GlassCard
        title="Avaliações dos Clientes"
        subtitle={
          reviews.length > 0
            ? `${reviews.length} avaliação${reviews.length !== 1 ? 'ões' : ''} recebida${reviews.length !== 1 ? 's' : ''}`
            : 'Ainda sem avaliações'
        }
      >
        {reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-ethereal-silver/60">
            Este consultor ainda não recebeu avaliações. Seja o primeiro!
          </p>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-xl border border-mystic-gold/25 bg-black/25 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-50">{review.userName}</span>
                    <span className="rounded-full border border-mystic-gold/20 bg-black/30 px-2 py-0.5 text-xs text-amber-100/60">
                      {review.sessionType === 'video' ? 'Vídeo' : 'Perguntas'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} />
                    <span className="text-xs text-ethereal-silver/60">
                      {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm leading-relaxed text-amber-100/75">{review.comment}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </GlassCard>

      <QuestionFlowModal
        key={`${questionFlow.consultant?.id ?? 'none'}-${questionFlow.questionCount}`}
        isOpen={questionFlow.isOpen}
        consultant={questionFlow.consultant}
        questionCount={questionFlow.questionCount}
        price={questionFlow.price}
        onClose={closeQuestionFlow}
        onConfirmSend={confirmSendQuestions}
      />

      {insufficientBalanceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-center text-amber-400">
              <Wallet size={48} />
            </div>
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">Saldo Insuficiente</h3>
            <p className="mb-6 text-center text-amber-100/80">
              Você precisa ter saldo para no mínimo 5 minutos (R$ {insufficientBalanceModal.minRequired.toFixed(2)}) para iniciar esta chamada de vídeo.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/recarregar')}
                className="w-full rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 py-3 font-bold text-black transition hover:brightness-110"
              >
                Fazer recarga
              </button>
              <button
                onClick={() => setInsufficientBalanceModal({ isOpen: false, minRequired: 0 })}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCallModal.isOpen && confirmCallModal.consultant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-center text-emerald-400">
              <Video size={48} />
            </div>
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">Confirmar Início da Consulta</h3>
            <p className="mb-6 text-center text-amber-100/80">
              Você está prestes a iniciar uma chamada de vídeo com <strong className="text-amber-50">{confirmCallModal.consultant.name}</strong>.<br />
              O valor é de R$ {Number(confirmCallModal.consultant.pricePerMinute).toFixed(2)} por minuto.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartVideoConsultation}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 py-3 font-bold text-black transition hover:brightness-110"
              >
                Confirmar início
              </button>
              <button
                onClick={() => setConfirmCallModal({ isOpen: false, consultant: null })}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
