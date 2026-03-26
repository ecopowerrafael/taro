import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useBilling({ balanceMinutes, onConsume, onInsufficientBalance, testMode = false }) {
  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const consumedRef = useRef(false)

  const pricePerMinute = Number(activeSession?.pricePerMinute ?? 1) // Default 1 real/min se não especificado
  const consumedMinutes = Math.floor(elapsedSeconds / 60)
  const consumedValue = consumedMinutes * pricePerMinute
  const remainingMinutes = Math.max(0, balanceMinutes - consumedValue)

  const hasSufficientBalance = balanceMinutes > 0

  const stopSession = useCallback(() => {
    console.log('[useBilling] stopSession chamado')
    setIsConnected(false)
    setActiveSession((session) => {
      if (session && !consumedRef.current) {
        setElapsedSeconds((currentSeconds) => {
          const finalMinutes = Math.floor(currentSeconds / 60)
          const finalPrice = Number(session.pricePerMinute ?? 1)
          const finalValue = finalMinutes * finalPrice
          
          console.log('[useBilling] stopSession calculando: currentSeconds=', currentSeconds, 'finalMinutes=', finalMinutes, 'finalPrice=', finalPrice, 'finalValue=', finalValue)
          
          if (finalValue > 0) {
            console.log('[useBilling] Chamando onConsume com:', finalValue)
            onConsume(finalValue)
            consumedRef.current = true
          }
          return currentSeconds
        })
      }
      return null
    })
    setElapsedSeconds(0)
  }, [onConsume])

  const startSession = useCallback(
    ({ consultantId, consultantName, pricePerMinute: minutePrice, isConsultantMode = false }) => {
      // Garantir que minutePrice é sempre um número válido
      const validPrice = Number.isFinite(Number(minutePrice)) ? Number(minutePrice) : 0

      console.log('[useBilling] startSession chamado. minutePrice:', minutePrice, 'validPrice:', validPrice, 'isConsultantMode:', isConsultantMode, 'hasSufficientBalance:', hasSufficientBalance, 'balanceMinutes:', balanceMinutes)

      // Consultores não têm restrição de saldo - eles estão acumulando ganhos
      if (!isConsultantMode && !hasSufficientBalance) {
        console.log('[useBilling] Saldo insuficiente!')
        onInsufficientBalance?.()
        return false
      }

      console.log('[useBilling] Iniciando sessão com pricePerMinute:', validPrice)

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

    console.log('[useBilling] Iniciando intervalo. activeSession:', activeSession, 'pricePerMinute:', activeSession.pricePerMinute)

    // Simplificar atualização para teste: 1s em modo normal, 10s em modo teste
    const intervalMs = testMode ? 10000 : 1000

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1
        console.log(`[useBilling] elapsedSeconds: ${prev} -> ${next}`)
        return next
      })
    }, intervalMs)

    return () => {
      console.log('[useBilling] Limpando intervalo')
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
