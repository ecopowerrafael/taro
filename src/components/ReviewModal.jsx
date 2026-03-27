import { useState } from 'react'
import { Star, X, Loader2 } from 'lucide-react'

export function ReviewModal({ isOpen, consultantName, consultantId, referenceId, sessionType, token, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Selecione uma nota de 1 a 5 estrelas.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/consultants/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ consultantId, referenceId, sessionType, rating, comment: comment.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Erro ao enviar avaliação.')
        return
      }
      onSubmitted?.()
      onClose()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/95 p-6 shadow-[0_0_40px_rgba(197,160,89,0.25)]">
        {/* Cabeçalho */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-mystic-goldSoft">Avaliar Consultor</h3>
            <p className="mt-0.5 text-sm text-amber-100/70">
              Como foi sua experiência com <strong className="text-amber-50">{consultantName}</strong>?
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-mystic-gold/25 p-1.5 text-amber-100/60 transition hover:text-amber-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Estrelas */}
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={36}
                  className={
                    star <= (hovered || rating)
                      ? 'fill-stardust-gold text-stardust-gold'
                      : 'text-zinc-600'
                  }
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-amber-100/60">
            {rating === 0 && 'Toque nas estrelas para avaliar'}
            {rating === 1 && 'Muito ruim'}
            {rating === 2 && 'Ruim'}
            {rating === 3 && 'Regular'}
            {rating === 4 && 'Bom'}
            {rating === 5 && 'Excelente!'}
          </p>
        </div>

        {/* Comentário */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Deixe um comentário (opcional)..."
          maxLength={500}
          rows={3}
          className="w-full resize-none rounded-lg border border-mystic-gold/30 bg-black/40 p-3 text-sm text-amber-50 placeholder-amber-100/40 outline-none focus:ring-1 focus:ring-mystic-gold/50"
        />
        <p className="mb-4 text-right text-xs text-amber-100/40">{comment.length}/500</p>

        {error && (
          <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-center text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Botões */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 py-3 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-mystic-gold/25 bg-black/30 py-2.5 text-sm font-medium text-amber-100/80 transition hover:bg-black/50"
          >
            Pular por agora
          </button>
        </div>
      </div>
    </div>
  )
}
