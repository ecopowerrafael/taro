import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'
import { Loader2, Video, PhoneOff, Clock3, Wallet, XCircle } from 'lucide-react'
import { usePlatformContext } from '../context/platform-context'
import { io } from 'socket.io-client'
import DailyIframe from '@daily-co/daily-js'

export function VideoRoomPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { token, billing, setSystemNotice } = usePlatformContext()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCallActive, setIsCallActive] = useState(false)
  const [callStartedAt, setCallStartedAt] = useState(null)
  const [localElapsedSeconds, setLocalElapsedSeconds] = useState(0)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [endModal, setEndModal] = useState(null)
  const callFrameRef = useRef(null)
  const containerRef = useRef(null)
  const socketRef = useRef(null)
  const otherUserLeftRef = useRef(false)

  const formatElapsed = (seconds) => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    const secs = String(seconds % 60).padStart(2, '0')
    return `${minutes}:${secs}`
  }

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/video-sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setSession(data)
      } catch (err) {
        setError(err.message || 'Erro ao carregar a sala.')
      } finally {
        setLoading(false)
      }
    }
    
    if (token) {
      fetchSession()
    }
  }, [sessionId, token])

  // Setup Socket.io para sincronizar encerramento de chamada
  useEffect(() => {
    socketRef.current = io()
    
    socketRef.current.on('other_user_left_call', () => {
      otherUserLeftRef.current = true
      setSystemNotice('O outro participante saiu da chamada.')
      // Dar um tempo para o outro lado receber o evento antes de navegar
      setTimeout(() => {
        handleLeaveCall()
      }, 500)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Entrar na sala de chamada após conexão socket.io
  useEffect(() => {
    if (isCallActive && socketRef.current && sessionId) {
      socketRef.current.emit('join_call_room', { sessionId })
    }
  }, [isCallActive, sessionId])

  useEffect(() => {
    if (!callStartedAt || !isCallActive) {
      setLocalElapsedSeconds(0)
      return undefined
    }

    const interval = window.setInterval(() => {
      setLocalElapsedSeconds(Math.floor((Date.now() - callStartedAt) / 1000))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [callStartedAt, isCallActive])

  // Polling to check if the other person joined (simplified approach for waiting room)
  useEffect(() => {
    if (!session || isCallActive) return
    
    // Se o consultor for quem estiver na tela, ele NÃO faz polling pra entrar sozinho,
    // ele que clica no botão "Iniciar Atendimento" e muda o status.
    if (session.isConsultant) return

    const interval = setInterval(async () => {
      // In a real prod environment we'd use WebSockets. Here we poll status every 10s
      try {
        const res = await fetch(`/api/video-sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.status === 'active' && !isCallActive) {
          // Both are ready! O consultor já iniciou!
          setIsCallActive(true) // Libera a div do iframe
          setCallStartedAt(Date.now())
          setTimeout(() => {
            joinCall(data)
          }, 100)
        }
      } catch (e) {
        // ignore
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [session, isCallActive, sessionId, token])

  const joinCall = async (sessionData) => {
    console.log('[VideoRoomPage] joinCall chamado com sessionData.isConsultant:', sessionData.isConsultant)
    
    if (!containerRef.current) return
    
    // Marcar sessão como ativa no DB se ainda não estiver
    if (sessionData.status !== 'active') {
      await fetch(`/api/video-sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'active' })
      })
    }

    const callFrame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: false, // Nós gerenciamos o botão de sair
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '12px'
      }
    })
    
    callFrameRef.current = callFrame
    
    // Iniciar faturamento se for o cliente
    if (!sessionData.isConsultant) {
      billing.startSession({
        consultantId: sessionData.consultantId,
        consultantName: sessionData.consultantName,
        pricePerMinute: sessionData.pricePerMinute,
        isConsultantMode: false
      })
    }

    callFrame.on('left-meeting', () => {
      handleLeaveCall()
    })

    try {
      await callFrame.join({
        url: sessionData.roomUrl,
        token: sessionData.dailyToken // Usado se a sala for privada
      })
      setIsCallActive(true)
      setCallStartedAt((prev) => prev ?? Date.now())
    } catch (e) {
      console.error('Erro ao entrar na sala do Daily', e)
      setSystemNotice('Erro ao conectar na sala de vídeo.')
    }
  }

  const handleStartByConsultant = async () => {
    setIsCallActive(true)
    
    try {
      // Refetch session para garantir dados atualizados, especialmente pricePerMinute
      const res = await fetch(`/api/video-sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const freshSession = await res.json()
      
      console.log('[VideoRoomPage] Consultor iniciando. freshSession:', freshSession)
      
      if (freshSession) {
        const price = Number(freshSession.pricePerMinute) || 0
        console.log('[VideoRoomPage] Iniciando billing com pricePerMinute:', price)
        
        // Iniciar faturamento com dados frescos
        const started = billing.startSession({
          consultantId: freshSession.consultantId,
          consultantName: freshSession.consultantName,
          pricePerMinute: price,
          isConsultantMode: true
        })
        
        console.log('[VideoRoomPage] billing.startSession retornou:', started)
        
        setTimeout(() => {
          joinCall(freshSession)
        }, 100)
      }
    } catch (err) {
      console.error('Erro ao iniciar atendimento:', err)
      setSystemNotice('Erro ao iniciar atendimento.')
      setIsCallActive(false)
    }
  }

  const handleLeaveCall = async () => {
    console.log('[VideoRoomPage] handleLeaveCall chamado')
    
    if (callFrameRef.current) {
      await callFrameRef.current.leave()
      callFrameRef.current.destroy()
      callFrameRef.current = null
    }
    
    // Calcular duração e ganho do consultor
    const durationSeconds = callStartedAt ? Math.floor((Date.now() - callStartedAt) / 1000) : 0
    const durationMinutes = Math.max(0, Math.floor(durationSeconds / 60))
    const consultantEarnings = session?.isConsultant 
      ? durationMinutes * (session.pricePerMinute || 0)
      : 0

    console.log('[VideoRoomPage] Chamada finalizada. durationSeconds:', durationSeconds, 'billing.isConnected:', billing.isConnected)

    // Para faturamento (cliente ou consultor)
    console.log('[VideoRoomPage] Chamando billing.stopSession()')
    billing.stopSession()

    // Salvar sessão com duração e earnings
    try {
      await fetch(`/api/video-sessions/${sessionId}/finish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          status: 'finished',
          durationSeconds,
          consultantEarnings
        })
      })
    } catch (err) {
      console.error('Erro ao finalizar sessão:', err)
    }

    // Emitir evento para o outro participante também sair
    if (socketRef.current && !otherUserLeftRef.current) {
      socketRef.current.emit('user_leaving_call', { sessionId })
    }

    navigate(session?.isConsultant ? '/area-consultor' : '/consultores')
    setSystemNotice('Chamada encerrada com sucesso.')
  }

  const handleCancelWaiting = async () => {
    setShowCancelConfirm(false)
    try {
      await fetch(`/api/video-sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled' })
      })
    } catch {
      setSystemNotice('Não foi possível cancelar a chamada no momento.')
    }
    navigate('/consultores')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave()
        callFrameRef.current.destroy()
      }
      if (isCallActive) {
        billing.stopSession()
      }
    }
  }, [isCallActive, billing])

  if (loading) {
    return (
      <PageShell title="Sala de Consulta" subtitle="Carregando...">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-mystic-gold" size={48} />
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell title="Sala de Consulta" subtitle="Acesso negado">
        <GlassCard className="text-center">
          <p className="text-red-400">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-mystic-goldSoft underline">
            Voltar ao Início
          </button>
        </GlassCard>
      </PageShell>
    )
  }

  return (
    <PageShell title={`Consulta com ${session.consultantName}`} subtitle="Sessão de Vídeo Privada">
      <div className="mx-auto w-full max-w-4xl">
        <div 
          className={`relative overflow-hidden rounded-2xl border border-mystic-gold/30 bg-black/50 shadow-[0_0_30px_rgba(197,160,89,0.15)] ${isCallActive ? 'h-[70vh]' : 'h-auto p-8 text-center'}`}
        >
          {isCallActive && (
            <div className="absolute left-4 top-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-mystic-gold/30 bg-black/60 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-3 text-xs text-amber-50">
                <span className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/20 bg-black/40 px-3 py-2">
                  <Clock3 size={16} className="text-mystic-goldSoft" />
                  Tempo: {formatElapsed(localElapsedSeconds)}
                </span>
                {session.isConsultant ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/20 bg-black/40 px-3 py-2">
                    <Wallet size={16} className="text-mystic-goldSoft" />
                    Total (provisório): R$ {Number(billing.consumedValue ?? 0).toFixed(2)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/20 bg-black/40 px-3 py-2">
                    <Wallet size={16} className="text-mystic-goldSoft" />
                    Minutos restantes: {Number(billing.remainingMinutes ?? 0).toFixed(2)}
                  </span>
                )}
              </div>
              <button
                onClick={handleLeaveCall}
                className="flex items-center gap-2 rounded-lg bg-red-600/90 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-500"
              >
                <PhoneOff size={16} />
                Encerrar
              </button>
            </div>
          )}

          {/* Waiting Room */}
          {!isCallActive && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-6 rounded-full bg-mystic-gold/10 p-6 text-mystic-gold">
                <Video size={48} className="animate-pulse" />
              </div>
              <h2 className="mb-2 font-display text-3xl text-mystic-goldSoft">
                {session.isConsultant ? 'Sala Pronta' : 'Aguardando Consultor'}
              </h2>
              <p className="max-w-md text-amber-100/70">
                {session.isConsultant 
                  ? 'O cliente está esperando. Clique no botão abaixo para iniciar a videochamada.'
                  : 'Sua sala já foi criada e o consultor foi notificado por e-mail e painel. Aguarde que estamos chamando o Consultor para lhe atender.'}
              </p>
              
              {session.isConsultant && (
                <button
                  onClick={handleStartByConsultant}
                  className="mt-8 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-3 font-bold text-black transition hover:brightness-110"
                >
                  Iniciar Atendimento
                </button>
              )}

              {!session.isConsultant && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="mt-4 rounded-lg border border-red-400/50 bg-red-600/20 px-6 py-3 text-sm font-bold text-red-200 transition hover:bg-red-600/30"
                >
                  Cancelar Chamada
                </button>
              )}
            </div>
          )}

          {/* Daily.co Iframe Container */}
          <div ref={containerRef} className={`h-full w-full min-h-[400px] ${isCallActive ? 'block' : 'hidden'}`} />
          
          {isCallActive && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <button
                onClick={handleLeaveCall}
                className="flex items-center gap-2 rounded-full bg-red-600/90 px-6 py-3 font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-red-500"
              >
                <PhoneOff size={20} />
                Encerrar Chamada
              </button>
            </div>
          )}
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-center text-amber-400">
              <XCircle size={48} />
            </div>
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">
              Cancelar chamada?
            </h3>
            <p className="mb-6 text-center text-amber-100/80">
              O consultor pode estar se preparando para te atender melhor. Tem certeza que deseja cancelar?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCancelWaiting}
                className="w-full rounded-lg bg-red-600/90 py-3 font-bold text-white transition hover:bg-red-500"
              >
                Sim, cancelar
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {endModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-center text-amber-400">
              <XCircle size={48} />
            </div>
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">
              {endModal.title}
            </h3>
            <p className="mb-6 text-center text-amber-100/80">
              {endModal.message}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/consultores')}
                className="w-full rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 py-3 font-bold text-black transition hover:brightness-110"
              >
                {endModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}