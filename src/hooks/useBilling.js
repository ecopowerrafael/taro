import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useBilling({ balanceMinutes, onConsume, onInsufficientBalance, testMode = false }) {
  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const consumedRef = useRef(false)

  const pricePerMinute = Number(activeSession?.pricePerMinute ?? 0)
  const consumedMinutes = Math.floor(elapsedSeconds / 60)
  const consumedValue = consumedMinutes * pricePerMinute
  const remainingMinutes = Math.max(0, balanceMinutes - consumedValue)

  const hasSufficientBalance = balanceMinutes > 0

  const stopSession = useCallback(() => {
    setIsConnected(false)
    setActiveSession((session) => {
      if (session && !consumedRef.current && elapsedSeconds > 0) {
        onConsume(consumedValue)
        consumedRef.current = true
      }
      return null
    })
    setElapsedSeconds(0)
  }, [consumedValue, elapsedSeconds, onConsume])

  const startSession = useCallback(
    ({ consultantId, consultantName, pricePerMinute: minutePrice }) => {
      // Garantir que minutePrice é sempre um número válido
      const validPrice = Number.isFinite(Number(minutePrice)) ? Number(minutePrice) : 0

      if (!hasSufficientBalance) {
        onInsufficientBalance?.()
        return false
      }

      consumedRef.current = false
      setElapsedSeconds(0)
      setActiveSession({
        consultantId,
        consultantName,
        pricePerMinute: validPrice,
      })
      setIsConnected(true)
      return true
    },
    [hasSufficientBalance, onInsufficientBalance],
  )

  useEffect(() => {
    if (!isConnected || !activeSession) {
      return undefined
    }

    // Simplificar atualização para teste: 1s em modo normal, 10s em modo teste
    const intervalMs = testMode ? 10000 : 1000

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, intervalMs)

    return () => {
      window.clearInterval(interval)
    }
  }, [activeSession, isConnected, testMode])

  useEffect(() => {
    if (isConnected && remainingMinutes <= 0) {
      onInsufficientBalance?.()
      const timeout = window.setTimeout(() => {
        stopSession()
      }, 0)

      return () => window.clearTimeout(timeout)
    }
    return undefined
  }, [isConnected, remainingMinutes, onInsufficientBalance, stopSession])

  const formattedElapsed = useMemo(() => {
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
    const seconds = String(elapsedSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [elapsedSeconds])

  return {
    activeSession,
    isConnected,
    elapsedSeconds,
    formattedElapsed,
    consumedMinutes,
    consumedValue,
    remainingMinutes,
    startSession,
    stopSession,
  }
}
