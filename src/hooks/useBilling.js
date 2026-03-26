import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useBilling({ balanceMinutes, onConsume, onInsufficientBalance, testMode = false }) {
  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const consumedRef = useRef(false)
  const stopCalledRef = useRef(false) // Prevenir múltiplas chamadas

  const pricePerMinute = Number(activeSession?.pricePerMinute ?? 1) // Default 1 real/min se não especificado
  const consumedMinutes = Math.floor(elapsedSeconds / 60)
  const consumedValue = consumedMinutes * pricePerMinute
  const remainingMinutes = Math.max(0, balanceMinutes - consumedValue)

  const hasSufficientBalance = balanceMinutes > 0

  const stopSession = useCallback((reason = 'unknown') => {
    console.log('[useBilling] stopSession chamado. reason:', reason, 'stopCalledRef.current:', stopCalledRef.current)
    console.trace('[useBilling] stopSession stack trace')
    
    // Prevent calling stop multiple times
    if (stopCalledRef.current) {
      console.log('[useBilling] stopSession já foi chamado, ignorando chamada duplicada. reason:', reason)
      return
    }

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
    stopCalledRef.current = true
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

  const intervalRef = useRef(null)
  const activeSessionRef = useRef(activeSession)

  // Manter ref em sync com state
  useEffect(() => {
    activeSessionRef.current = activeSession
  }, [activeSession])

  useEffect(() => {
    if (!isConnected || !activeSession) {
      console.log('[useBilling] Intervalo effect: isConnected=', isConnected, 'activeSession=', activeSession)
      if (intervalRef.current) {
        console.log('[useBilling] Limpando intervalo anterior')
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return undefined
    }

    console.log('[useBilling] Iniciando intervalo. activeSession:', activeSession, 'pricePerMinute:', activeSession.pricePerMinute)

    // Simplificar atualização para teste: 1s em modo normal, 10s em modo teste
    const intervalMs = testMode ? 10000 : 1000
    let callCount = 0

    intervalRef.current = window.setInterval(() => {
      callCount++
      console.log(`[useBilling] Intervalo callback #${callCount} disparado (intervalMs=${intervalMs})`)
      setElapsedSeconds((prev) => {
        const next = prev + 1
        console.log(`[useBilling] elapsedSeconds: ${prev} -> ${next}`)
        return next
      })
    }, intervalMs)

    console.log(`[useBilling] Intervalo criado com ID:`, intervalRef.current, 'intervalo:', intervalMs, 'ms')

    return () => {
      console.log('[useBilling] Cleanup: Limpando intervalo ID:', intervalRef.current, 'foi disparado', callCount, 'vezes')
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isConnected, testMode])

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
