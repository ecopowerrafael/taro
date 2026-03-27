import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ArrowLeft, MessageCircle, Video, Users, Loader2 } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'

const statusStyles = {
  Online: 'border-emerald-400/70 bg-emerald-500/15 text-emerald-300',
  Ocupado: 'border-amber-400/70 bg-amber-500/10 text-amber-300',
  Offline: 'border-zinc-400/70 bg-zinc-500/10 text-zinc-300',
}

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
  const [consultant, setConsultant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <PageShell title="Perfil do Consultor" subtitle="Conheça o especialista antes de iniciar sua consulta.">
      {/* Botão voltar */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm text-amber-100/70 transition hover:text-mystic-goldSoft"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Card principal */}
      <GlassCard>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Foto */}
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

          {/* Info principal */}
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

            {/* Estatísticas */}
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

            {/* Preços */}
            <div className="mt-4 flex flex-wrap gap-3">
              {Number(consultant.pricePerMinute) > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-mystic-gold/30 bg-black/30 px-3 py-1.5 text-xs text-amber-100/80">
                  <Video size={13} /> R$ {Number(consultant.pricePerMinute).toFixed(2)}/min (vídeo)
                </span>
              )}
              {Number(consultant.priceThreeQuestions) > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-mystic-gold/30 bg-black/30 px-3 py-1.5 text-xs text-amber-100/80">
                  <MessageCircle size={13} /> R$ {Number(consultant.priceThreeQuestions).toFixed(2)} (3 perguntas)
                </span>
              )}
              {Number(consultant.priceFiveQuestions) > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-mystic-gold/30 bg-black/30 px-3 py-1.5 text-xs text-amber-100/80">
                  <MessageCircle size={13} /> R$ {Number(consultant.priceFiveQuestions).toFixed(2)} (5 perguntas)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Descrição completa */}
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

      {/* Avaliações */}
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
    </PageShell>
  )
}
