import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Play, Trash2, Download } from 'lucide-react'

export function AudioRecorder({ onAudioRecorded, maxDurationSeconds = 120 }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const timerIntervalRef = useRef(null)
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
    }
  }, [])

  const startRecording = async () => {
    try {
      setError('')
      setElapsedSeconds(0)
      audioChunksRef.current = []
      setRecordedBlob(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
        setRecordedBlob(blob)
        if (onAudioRecorded) {
          onAudioRecorded(blob, elapsedSeconds)
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)

      // Timer
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1
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
    audioChunksRef.current = []
    setError('')
  }

  const playRecording = () => {
    if (recordedBlob && audioElementRef.current) {
      const url = URL.createObjectURL(recordedBlob)
      audioElementRef.current.src = url
      audioElementRef.current.play()
    }
  }

  const downloadRecording = () => {
    if (!recordedBlob) return
    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audio-${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
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
            ✓ Áudio gravado com sucesso • {formatTime(elapsedSeconds)}
          </p>

          <audio
            ref={audioElementRef}
            className="mb-3 w-full rounded-lg"
            controls
            controlsList="nodownload"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={playRecording}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/30"
            >
              <Play size={14} />
              Reproduzir
            </button>
            <button
              onClick={downloadRecording}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-400/50 bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/30"
            >
              <Download size={14} />
              Baixar
            </button>
            <button
              onClick={resetRecording}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/30"
            >
              <Trash2 size={14} />
              Deletar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
