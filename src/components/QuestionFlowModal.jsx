import { useMemo, useState } from 'react'
import { Mic, Send, X } from 'lucide-react'

const createInitialEntries = (questionCount) =>
  Array.from({ length: questionCount }, () => ({
    type: 'text',
    text: '',
    file: null,
    durationSeconds: 0,
  }))

export function QuestionFlowModal({
  isOpen,
  consultant,
  questionCount,
  price,
  onClose,
  onConfirmSend,
}) {
  const [step, setStep] = useState(0)
  const [entries, setEntries] = useState(() => createInitialEntries(questionCount))
  const [audioError, setAudioError] = useState('')

  const isReviewStep = step === questionCount
  const currentEntry = entries[Math.min(step, questionCount - 1)]

  const resetModal = () => {
    setStep(0)
    setEntries(createInitialEntries(questionCount))
    setAudioError('')
  }

  const closeModal = () => {
    resetModal()
    onClose()
  }

  const setEntry = (index, updates) => {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry)))
  }

  const canGoNext = useMemo(() => {
    if (isReviewStep) {
      return true
    }
    if (!currentEntry) {
      return false
    }
    if (currentEntry.type === 'text') {
      return currentEntry.text.trim().length > 0
    }
    return Boolean(currentEntry.file) && currentEntry.durationSeconds > 0
  }, [currentEntry, isReviewStep])

  const handleAudioFile = (file) => {
    if (!file) {
      return
    }
    setAudioError('')
    const objectUrl = URL.createObjectURL(file)
    const audio = new Audio(objectUrl)
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      if (audio.duration > 120) {
        setAudioError('O áudio deve ter no máximo 2 minutos.')
        return
      }
      setEntry(step, {
        file,
        durationSeconds: audio.duration,
      })
    }
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      setAudioError('Não foi possível ler o áudio selecionado.')
    }
  }

  const goBack = () => {
    setAudioError('')
    setStep((prev) => Math.max(0, prev - 1))
  }

  const goNext = () => {
    if (!canGoNext) {
      return
    }
    setAudioError('')
    setStep((prev) => Math.min(questionCount, prev + 1))
  }

  const handleConfirm = () => {
    onConfirmSend(entries)
    closeModal()
  }

  if (!isOpen || !consultant) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-stardust-gold/50 bg-[#120a1f] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-ethereal-silver/65">Envio de Perguntas</p>
            <h3 className="font-text font-bold text-3xl text-stardust-gold">{consultant.name}</h3>
            <p className="text-sm text-ethereal-silver/80">
              Pacote de {questionCount} perguntas • Débito {price.toFixed(2)}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="rounded-lg border border-stardust-gold/40 p-2 text-ethereal-silver/80 transition hover:bg-stardust-gold/10"
          >
            <X size={16} />
          </button>
        </div>

        {!isReviewStep && (
          <div className="grid gap-4">
            <p className="text-sm text-ethereal-silver/85">
              Pergunta {step + 1} de {questionCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setEntry(step, { type: 'text', file: null, durationSeconds: 0 })}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  currentEntry.type === 'text'
                    ? 'border-stardust-gold/70 bg-stardust-gold/20 text-stardust-gold'
                    : 'border-stardust-gold/35 text-ethereal-silver/80 hover:bg-stardust-gold/10'
                }`}
              >
                Escrever
              </button>
              <button
                onClick={() => setEntry(step, { type: 'audio', text: '' })}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  currentEntry.type === 'audio'
                    ? 'border-stardust-gold/70 bg-stardust-gold/20 text-stardust-gold'
                    : 'border-stardust-gold/35 text-ethereal-silver/80 hover:bg-stardust-gold/10'
                }`}
              >
                <Mic size={14} />
                Áudio
              </button>
            </div>

            {currentEntry.type === 'text' ? (
              <textarea
                rows={5}
                value={currentEntry.text}
                onChange={(event) => setEntry(step, { text: event.target.value })}
                placeholder="Digite a sua pergunta..."
                className="rounded-xl border border-stardust-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-stardust-gold/60 focus:ring-2"
              />
            ) : (
              <div className="grid gap-2">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-stardust-gold/45 bg-stardust-gold/10 px-3 py-2 text-sm text-stardust-gold transition hover:bg-stardust-gold/20">
                  <Mic size={14} />
                  Selecionar áudio (até 2 minutos)
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(event) => handleAudioFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                {currentEntry.file && (
                  <p className="text-xs text-emerald-200">
                    {currentEntry.file.name} • {Math.round(currentEntry.durationSeconds)}s
                  </p>
                )}
                {audioError && <p className="text-xs text-red-300">{audioError}</p>}
              </div>
            )}
          </div>
        )}

        {isReviewStep && (
          <div className="grid gap-2 rounded-xl border border-stardust-gold/30 bg-black/30 p-3">
            <p className="text-sm text-stardust-gold">Confirme o envio para o consultor:</p>
            {entries.map((entry, index) => (
              <div key={`${entry.type}-${index}`} className="rounded-lg border border-stardust-gold/20 bg-black/30 p-2">
                <p className="text-xs text-ethereal-silver/75">Pergunta {index + 1}</p>
                {entry.type === 'text' ? (
                  <p className="text-sm text-ethereal-silver/90">{entry.text}</p>
                ) : (
                  <p className="text-sm text-ethereal-silver/90">
                    Áudio: {entry.file?.name ?? 'Sem arquivo'} ({Math.round(entry.durationSeconds)}s)
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="rounded-lg border border-stardust-gold/35 px-4 py-2 text-sm text-ethereal-silver/85 transition enabled:hover:bg-stardust-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Voltar
          </button>
          {!isReviewStep ? (
            <button
              onClick={goNext}
              disabled={!canGoNext}
              className="rounded-lg border border-stardust-gold/75 bg-gradient-to-r from-stardust-gold/90 to-amber-500/85 px-4 py-2 text-sm font-medium text-black transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Próxima
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 rounded-lg border border-stardust-gold/75 bg-gradient-to-r from-stardust-gold/90 to-amber-500/85 px-4 py-2 text-sm font-medium text-black transition hover:brightness-110"
            >
              <Send size={14} />
              Confirmar envio
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
