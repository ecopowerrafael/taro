import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Play, Trash2, Check } from 'lucide-react'

const AUDIO_MIME_CANDIDATES_DEFAULT = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
]

const AUDIO_MIME_CANDIDATES_SAFARI = [
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
]

const isSafariBrowser = () => {
  if (typeof navigator === 'undefined') {
    return false
  }
  const ua = navigator.userAgent || ''
  return /Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR|FxiOS|Firefox|Android/i.test(ua)
}

const resolveMimeCandidates = () =>
  isSafariBrowser() ? AUDIO_MIME_CANDIDATES_SAFARI : AUDIO_MIME_CANDIDATES_DEFAULT

const resolveRecorderMimeType = () => {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return ''
  }
  const candidates = resolveMimeCandidates()
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || ''
}

const resolveFallbackBlobType = (preferredMimeType, recorderMimeType) => {
  if (preferredMimeType) return preferredMimeType
  if (recorderMimeType) return recorderMimeType
  return isSafariBrowser() ? 'audio/mp4' : 'audio/webm'
}

const hasAudioData = (chunks) => Array.isArray(chunks) && chunks.some((item) => Number(item?.size) > 0)

const normalizeBlobType = (blobType, fallbackType) => {
  const normalized = String(blobType || '').toLowerCase()
  if (normalized.includes('mp4') || normalized.includes('aac')) return 'audio/mp4'
  if (normalized.includes('ogg')) return 'audio/ogg'
  if (normalized.includes('webm')) return 'audio/webm'
  return fallbackType
}

export function AudioRecorder({
  onAudioRecorded,
  onSave,
  maxDurationSeconds = 120,
  autoSaveOnStop = true,
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordedUrl, setRecordedUrl] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const elapsedSecondsRef = useRef(0)
  const recordingStartedAtRef = useRef(0)
  const audioElementRef = useRef(null)

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [recordedUrl])

  const startRecording = async () => {
    try {
      setError('')
      setElapsedSeconds(0)
      elapsedSecondsRef.current = 0
      recordingStartedAtRef.current = Date.now()
      audioChunksRef.current = []
      setRecordedBlob(null)
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
        setRecordedUrl('')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      if (typeof MediaRecorder === 'undefined') {
        throw new Error('Seu navegador não suporta gravação de áudio nesta página.')
      }

      const preferredMimeType = resolveRecorderMimeType()
      const mediaRecorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (!hasAudioData(audioChunksRef.current)) {
          setError('A gravação não gerou áudio válido. Tente novamente.')
          setRecordedBlob(null)
          setRecordedUrl('')
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
          }
          return
        }

        const fallbackMimeType = resolveFallbackBlobType(preferredMimeType, mediaRecorder.mimeType)
        const safeMimeType = normalizeBlobType(audioChunksRef.current[0]?.type, fallbackMimeType)
        const blob = new Blob(audioChunksRef.current, { type: safeMimeType })
        setRecordedBlob(blob)
        const safeElapsed = elapsedSecondsRef.current
        const byClock = Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
        const finalDuration = Math.max(1, safeElapsed || byClock || 0)
        setElapsedSeconds(finalDuration)
        const previewUrl = URL.createObjectURL(blob)
        setRecordedUrl(previewUrl)
        if (onAudioRecorded && autoSaveOnStop) {
          onAudioRecorded(blob, finalDuration)
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setIsPaused(false)

      // Timer
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1
          elapsedSecondsRef.current = next
          if (next >= maxDurationSeconds) {
            // Auto-stop quando atingir limite
            mediaRecorder.stop()
            setIsRecording(false)
            clearInterval(timerIntervalRef.current)
            return next
          }
          return next
        })
      }, 1000)
    } catch (err) {
      setError(`Erro ao acessar microfone: ${err.message}`)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1
          elapsedSecondsRef.current = next
          if (next >= maxDurationSeconds) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            clearInterval(timerIntervalRef.current)
            return next
          }
          return next
        })
      }, 1000)
    }
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    setElapsedSeconds(0)
    elapsedSecondsRef.current = 0
    recordingStartedAtRef.current = 0
    audioChunksRef.current = []
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
      setRecordedUrl('')
    }
    setError('')
  }

  const saveRecording = () => {
    if (!recordedBlob) {
      setError('Nenhum áudio gravado para salvar.')
      return
    }
    if (!autoSaveOnStop && onAudioRecorded) {
      onAudioRecorded(recordedBlob, elapsedSeconds)
    }
    if (onSave) onSave(recordedBlob, elapsedSeconds)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isTimeExpired = elapsedSeconds >= maxDurationSeconds

  return (
    <div className="grid gap-3">
      {error && (
        <p className="rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Gravador */}
      {!recordedBlob ? (
        <div className="rounded-lg border border-stardust-gold/45 bg-black/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic size={16} className="text-stardust-gold" />
              <span className="text-sm font-medium text-stardust-gold">Gravando</span>
            </div>
            <div className={`font-mono text-lg font-bold ${
              isTimeExpired ? 'text-red-400' : 'text-stardust-gold'
            }`}>
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          <div className="mb-3 h-1 overflow-hidden rounded-full bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-stardust-gold to-amber-500 transition-all duration-100"
              style={{ width: `${(elapsedSeconds / maxDurationSeconds) * 100}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-stardust-gold/90 to-amber-500/85 px-4 py-2 text-sm font-medium text-black transition hover:brightness-110"
              >
                <Mic size={14} />
                Iniciar
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                  >
                    <Play size={14} />
                    Continuar
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                  >
                    ⏸ Pausar
                  </button>
                )}

                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                >
                  <Square size={14} />
                  Parar
                </button>
              </>
            )}
          </div>

          {isTimeExpired && (
            <p className="mt-3 text-xs text-red-400">
              ⚠️ Tempo máximo de {maxDurationSeconds}s atingido. Gravação encerrada automaticamente.
            </p>
          )}
        </div>
      ) : (
        /* Reprodutor de áudio gravado */
        <div className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 p-4">
          <p className="mb-3 text-sm text-emerald-100">
            ✓ Áudio gravado • {formatTime(elapsedSeconds)}
          </p>

          <audio
            ref={audioElementRef}
            src={recordedUrl}
            className="mb-3 w-full rounded-lg"
            controls
            controlsList="nodownload"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={saveRecording}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-stardust-gold/90 to-amber-500/85 px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
            >
              <Check size={14} />
              Salvar e continuar
            </button>
            <button
              onClick={resetRecording}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/30"
            >
              <Trash2 size={14} />
              Regravar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
