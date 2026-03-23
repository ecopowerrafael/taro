import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useBilling({ balanceMinutes, onConsume, onInsufficientBalance }) {
  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const consumedRef = useRef(false)

  const pricePerMinute = activeSession?.pricePerMinute ?? 0
  const consumedMinutes = elapsedSeconds / 60
  const consumedValue = consumedMinutes * pricePerMinute
  const remainingMinutes = Math.max(0, balanceMinutes - consumedMinutes)

  const hasSufficientBalance = balanceMinutes > 0

  const stopSession = useCallback(() => {
    setIsConnected(false)
    setActiveSession((session) => {
      if (session && !consumedRef.current && elapsedSeconds > 0) {
        onConsume(consumedMinutes)
        consumedRef.current = true
      }
      return null
    })
    setElapsedSeconds(0)
  }, [consumedMinutes, elapsedSeconds, onConsume])

  const startSession = useCallback(
    ({ consultantId, consultantName, pricePerMinute: minutePrice }) => {
      if (!hasSufficientBalance) {
        onInsufficientBalance?.()
        return false
      }

      consumedRef.current = false
      setElapsedSeconds(0)
      setActiveSession({
        consultantId,
        consultantName,
        pricePerMinute: minutePrice,
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

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [activeSession, isConnected])

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
