import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Star } from 'lucide-react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { PageShell } from '../components/PageShell'
import { ReviewModal } from '../components/ReviewModal'
import { usePlatformContext } from '../context/platform-context'
import { useTranslation } from 'react-i18next'

export function RespostasPage() {
  const { t } = useTranslation()
  const { profile, authLoading, isAuthenticated, questionRequests, refreshQuestionRequests, token } = usePlatformContext()
  const [expandedAnswerId, setExpandedAnswerId] = useState(null)
  const [reviewModal, setReviewModal] = useState({ isOpen: false, consultantId: '', consultantName: '', referenceId: '' })
  const [reviewedIds, setReviewedIds] = useState(new Set())
  const [seenIds, setSeenIds] = useState(new Set())

  const seenStorageKey = useMemo(
    () => `astria_answers_seen_${profile?.id || profile?.email || 'anon'}`,
    [profile?.id, profile?.email]
  )

  useEffect(() => {
    if (!seenStorageKey) return
    try {
      const raw = localStorage.getItem(seenStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setSeenIds(new Set(parsed))
      }
    } catch {
      // Ignora storage inválido
    }
  }, [seenStorageKey])

  useEffect(() => {
    if (!refreshQuestionRequests) return
    void refreshQuestionRequests()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshQuestionRequests()
      }
    }
    window.addEventListener('focus', handleVisibility)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', handleVisibility)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refreshQuestionRequests])

  const persistSeen = (nextSet) => {
    setSeenIds(nextSet)
    try {
      localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(nextSet)))
    } catch {
      // Storage indisponível
    }
  }

  const markAsSeen = (answerId) => {
    if (!answerId || seenIds.has(answerId)) return
    const next = new Set(seenIds)
    next.add(answerId)
    persistSeen(next)
  }

  if (authLoading) {
    return (
      <PageShell title={t('common.loading', 'Carregando...')} subtitle="">
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-mystic-gold border-t-transparent" />
        </div>
      </PageShell>
    )
  }

  if (!isAuthenticated || !profile) return null

  const myEmail = String(profile.email || '').trim().toLowerCase()
  const toTime = (value) => {
    if (!value) return 0
    const date = new Date(value)
    const time = date.getTime()
    return Number.isFinite(time) ? time : 0
  }
  const formatDate = (value) => {
    const time = toTime(value)
    if (!time) return '—'
    return new Date(time).toLocaleDateString('pt-BR')
  }
  const myAnswers = questionRequests
    .filter(
      (request) =>
        String(request.customerEmail || '').trim().toLowerCase() === myEmail &&
        request.status === 'answered',
    )
    .sort((a, b) => toTime(b.answeredAt) - toTime(a.answeredAt))

  return (
    <div className="relative min-h-screen overflow-hidden bg-mystic-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(46,2,73,0.65),transparent)]" />
      </div>

      <PageShell title={t('answers.page_title', 'Respostas')} subtitle={t('answers.page_subtitle', 'Todas as respostas das suas perguntas em um só lugar.')}>
        <div className="mx-auto max-w-lg px-4 pb-36 pt-2">
          {myAnswers.length === 0 ? (
            <div className="rounded-2xl border border-stardust-gold/20 bg-[rgba(10,0,20,0.5)] px-5 py-6 text-center text-sm text-ethereal-silver/60">
              {t('answers.empty', 'Você ainda não recebeu respostas.')}
            </div>
          ) : (
            <div className="grid gap-3">
              {myAnswers.map((answer) => (
                <article
                  key={answer.id}
                  className="overflow-hidden rounded-2xl border border-stardust-gold/25 bg-[rgba(10,0,20,0.65)] backdrop-blur-md"
                >
                  <button
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                    onClick={() => {
                      const willExpand = expandedAnswerId !== answer.id
                      setExpandedAnswerId(willExpand ? answer.id : null)
                      if (willExpand) markAsSeen(answer.id)
                    }}
                  >
                    <div>
                      <p className="font-semibold text-mystic-goldSoft">{answer.consultantName}</p>
                      <p className="mt-0.5 text-[10px] text-ethereal-silver/40">
                        {formatDate(answer.answeredAt)} · {answer.questionCount} pergunta(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!seenIds.has(answer.id) && (
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      )}
                      <ChevronDown
                        size={18}
                        className={`text-stardust-gold transition-transform ${expandedAnswerId === answer.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedAnswerId === answer.id && (
                      <Motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 border-t border-stardust-gold/15 px-4 py-4">
                          {Array.isArray(answer.entries) && answer.entries.length > 0 && (
                            <div className="rounded-xl bg-black/40 p-3 space-y-2">
                              <p className="mb-1 text-[11px] font-semibold tracking-widest uppercase text-stardust-gold/60">{t('answers.labels.your_questions', 'Suas perguntas')}</p>
                              {answer.entries.map((entry, idx) => (
                                <p key={entry.id || idx} className="border-b border-stardust-gold/10 pb-2 text-xs text-amber-100/80 last:border-0">
                                  <span className="font-bold text-stardust-gold">P{idx + 1}.</span>{' '}
                                  {entry.question || entry.text || '—'}
                                </p>
                              ))}
                            </div>
                          )}
                          <div className="rounded-xl bg-black/40 p-3">
                            <p className="mb-2 text-[11px] font-semibold tracking-widest uppercase text-stardust-gold/60">{t('answers.labels.answer', 'Resposta')}</p>
                            {Array.isArray(answer.entries) && answer.entries.length > 0 ? (
                              <div className="space-y-2">
                                {answer.entries.map((entry, idx) => (
                                  <div key={entry.id || idx} className="rounded-lg border border-stardust-gold/20 bg-black/30 p-2">
                                    <p className="mb-1 text-[11px] text-ethereal-silver/70">{t('answers.labels.answer', 'Resposta')} {idx + 1}</p>
                                    {entry.answerType === 'audio' && entry.answerAudioDataUrl ? (
                                      <audio controls src={entry.answerAudioDataUrl} className="w-full" controlsList="nodownload" />
                                    ) : (
                                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-amber-50">
                                        {entry.answer || '—'}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-xs leading-relaxed text-amber-50">{answer.answerSummary}</p>
                            )}
                          </div>
                          {!reviewedIds.has(answer.id) && (
                            <div className="flex justify-end">
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    isOpen: true,
                                    consultantId: answer.consultantId,
                                    consultantName: answer.consultantName,
                                    referenceId: answer.id,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl border border-stardust-gold/40 bg-black/30 px-3 py-1.5 text-xs text-stardust-gold transition hover:bg-stardust-gold/10"
                              >
                                <Star size={12} /> {t('answers.actions.review_consultant', 'Avaliar consultor')}
                              </button>
                            </div>
                          )}
                          {reviewedIds.has(answer.id) && (
                            <p className="text-right text-xs text-emerald-400/80">✓ {t('answers.status.reviewed', 'Avaliado')}</p>
                          )}
                        </div>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </article>
              ))}
            </div>
          )}
        </div>
      </PageShell>

      <ReviewModal
        isOpen={reviewModal.isOpen}
        consultantName={reviewModal.consultantName}
        consultantId={reviewModal.consultantId}
        referenceId={reviewModal.referenceId}
        sessionType="question"
        token={token}
        onClose={() => setReviewModal((r) => ({ ...r, isOpen: false }))}
        onSubmitted={() => {
          setReviewedIds((prev) => new Set([...prev, reviewModal.referenceId]))
        }}
      />
    </div>
  )
}
