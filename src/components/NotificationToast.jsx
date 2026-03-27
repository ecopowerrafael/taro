import { useEffect, useRef, useState } from 'react'

export function NotificationToast ({ notifications, onClose }) {
  const audioRef = useRef(null)
  const audioContextRef = useRef(null)
  const [displayedIds, setDisplayedIds] = useState(new Set())

  const playFallbackBeep = () => {
    try {
      if (!audioContextRef.current && 'AudioContext' in window) {
        audioContextRef.current = new window.AudioContext()
      }

      const audioContext = audioContextRef.current
      if (!audioContext) {
        return
      }

      const startAt = audioContext.currentTime
      const tones = [
        { frequency: 988, duration: 0.12, delay: 0 },
        { frequency: 1174, duration: 0.14, delay: 0.16 },
      ]

      tones.forEach(({ frequency, duration, delay }) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.type = 'square'
        oscillator.frequency.setValueAtTime(frequency, startAt + delay)
        gainNode.gain.setValueAtTime(0.001, startAt + delay)
        gainNode.gain.exponentialRampToValueAtTime(0.12, startAt + delay + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + delay + duration)
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.start(startAt + delay)
        oscillator.stop(startAt + delay + duration)
      })
    } catch (error) {
      console.warn('Não foi possível tocar beep alternativo:', error)
    }
  }

  // Reproduz som quando há notificação nova
  useEffect(() => {
    const newNotifications = notifications.filter(
      (n) => !displayedIds.has(n.id)
    )

    if (newNotifications.length > 0) {
      setDisplayedIds((prev) => new Set([...prev, ...newNotifications.map(n => n.id)]))

      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((error) => {
          console.warn('Não foi possível tocar áudio de notificação:', error)
          playFallbackBeep()
        })
      } else {
        playFallbackBeep()
      }

      if ('vibrate' in navigator) {
        navigator.vibrate([500, 150, 500])
      }
    }
  }, [notifications, displayedIds])

  if (notifications.length === 0) {
    return null
  }

  const notification = notifications[0] // Mostra apenas a primeira da fila

  return (
    <>
      <audio
        ref={audioRef}
        src="/ringtone.mp3"
        preload="auto"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto animate-in fade-in duration-300">
          <div className="relative bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-2xl p-6 max-w-sm mx-4 border border-purple-400 overflow-hidden">
            {/* Fundo animado */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
            </div>

            {/* Conteúdo */}
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-20 animate-pulse">
                    {notification.icon === 'phone' && (
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.472 1.45 1.685 2.682 3.146 3.354l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 4 14.18 4 9.5S7.82 2 12.5 2h2a1 1 0 011 1v2.153z" />
                      </svg>
                    )}
                    {notification.icon === 'message' && (
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">
                    {notification.title}
                  </h3>
                  <p className="mt-1 text-sm text-purple-100 line-clamp-2">
                    {notification.message}
                  </p>

                  {/* Meta info */}
                  {notification.contactName && (
                    <p className="mt-3 text-xs font-medium text-purple-200 uppercase tracking-wide">
                      De: {notification.contactName}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onClose(notification.id)}
                  className="flex-shrink-0 text-purple-200 hover:text-white transition-colors"
                >
                  <span className="sr-only">Fechar</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Ações */}
              <div className="mt-4 flex gap-2">
                {notification.actions && notification.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.onClick?.()
                      onClose(notification.id)
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      action.primary
                        ? 'bg-white text-purple-600 hover:bg-purple-50 font-bold'
                        : 'bg-purple-500 text-white hover:bg-purple-400'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Auto-close progress */}
              {notification.autoCloseMs && (
                <div className="mt-3 h-1 bg-purple-400 bg-opacity-30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full animate-pulse"
                    style={{
                      animation: `shrink ${notification.autoCloseMs}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  )
}
