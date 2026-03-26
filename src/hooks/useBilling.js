import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useBilling({ balanceMinutes, onConsume, onInsufficientBalance, testMode = false }) {
  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const consumedRef = useRef(false)

  const pricePerMinute = Number(activeSession?.pricePerMinute ?? 0)
  const consumedMinutes = Math.floor(elapsedSeconds / 60)
  // Charge by fraction of minute, not just complete minutes (e.g., 30s at R$10/min = R$5)
  const consumedValue = Math.max(0, Math.floor((elapsedSeconds * pricePerMinute) / 60 * 100) / 100)
  const remainingMinutes = Math.max(0, balanceMinutes - consumedValue)

  const hasSufficientBalance = balanceMinutes > 0

  const stopSession = useCallback(() => {
    setIsConnected(false)
    const finalValue = Math.max(0, Math.floor((elapsedSeconds * pricePerMinute) / 60 * 100) / 100)
    setActiveSession((session) => {
      if (session && !consumedRef.current && finalValue > 0) {
        onConsume(finalValue)
        consumedRef.current = true
      }
      return null
    })
    setElapsedSeconds(0)
  }, [pricePerMinute, elapsedSeconds, onConsume])

  const startSession = useCallback(
    ({ consultantId, consultantName, pricePerMinute: minutePrice, isConsultantMode = false }) => {
      // Garantir que minutePrice é sempre um número válido
      const validPrice = Number.isFinite(Number(minutePrice)) ? Number(minutePrice) : 0

      // Consultores não têm restrição de saldo - eles estão acumulando ganhos
      if (!isConsultantMode && !hasSufficientBalance) {
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
