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
  const { token, billing, setSystemNotice, profile, updateProfile } = usePlatformContext()
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
  const callAlreadyEndedRef = useRef(false) // Prevenir múltiplas chamadas a handleLeaveCall
  const savedElapsedSecondsRef = useRef(0) // Salvar elapsedSeconds quando outra pessoa sai
  const joinInProgressRef = useRef(false) // Prevenir chamadas simultâneas de joinCall

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
        console.log('[VideoRoomPage] fetchSession - roomUrl:', data.roomUrl)
        console.log('[VideoRoomPage] fetchSession - dailyToken:', data.dailyToken ? `${data.dailyToken.substring(0, 20)}...` : 'UNDEFINED')
        console.log('[VideoRoomPage] fetchSession - isConsultant:', data.isConsultant)
        console.log('[VideoRoomPage] fetchSession - pricePerMinute:', data.pricePerMinute)
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

  // ✅ AUTO-JOIN para Consultor - ingressar automaticamente na sala
  useEffect(() => {
    if (session && session.isConsultant && !isCallActive && !joinInProgressRef.current) {
      console.log('[VideoRoomPage] Auto-iniciando para consultor')
      handleStartByConsultant()
    }
  }, [session?.isConsultant, isCallActive])

  // Setup Socket.io para sincronizar encerramento de chamada
  useEffect(() => {
    socketRef.current = io()
    
    socketRef.current.on('other_user_left_call', () => {
      console.log('[VideoRoomPage] Socket.io: other_user_left_call disparado')
      otherUserLeftRef.current = true
      // **CRITICAL**: Salvar elapsedSeconds IMEDIATAMENTE antes de qualquer coisa poder resetá-lo
      savedElapsedSecondsRef.current = billing.elapsedSeconds
      console.log('[VideoRoomPage] Socket.io: Salvando elapsedSeconds em ref:', savedElapsedSecondsRef.current)
      setSystemNotice('O outro participante saiu da chamada.')
      // Dar um tempo para o outro lado receber o evento antes de navegar
      setTimeout(() => {
        console.log('[VideoRoomPage] Socket.io: Chamando handleLeaveCall após delay')
        handleLeaveCall()
      }, 500)
    })

    return () => {
      console.log('[VideoRoomPage] Desconectando socket.io')
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
      if (joinInProgressRef.current) return // Guard contra chamadas simultâneas
      
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
    
    // Guard contra chamadas simultâneas
    if (joinInProgressRef.current) {
      console.warn('[VideoRoomPage] ⚠️  joinCall já em progresso, ignorando chamada duplicada')
      return
    }
    joinInProgressRef.current = true
    
    // Reset flag SEMPRE para nova entrada
    callAlreadyEndedRef.current = false
    
    if (!containerRef.current) {
      joinInProgressRef.current = false
      return
    }

    // 🔴 DESTRUIR FRAME ANTERIOR ANTES DE CRIAR NOVO (evita Duplicate DailyIframe error)
    if (callFrameRef.current) {
      console.log('[VideoRoomPage] 🗑️  Destruindo callFrame anterior')
      try {
        await callFrameRef.current.leave().catch(() => {})
        callFrameRef.current.destroy()
      } catch (e) {
        console.warn('[VideoRoomPage] Erro ao destruir frame anterior:', e.message)
      }
      callFrameRef.current = null
      // Limpar o container para evitar conflitos
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      // Dar tempo ao DOM atualizar
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Marcar sessão como ativa no DB se ainda não estiver
    if (sessionData.status !== 'active') {
      await fetch(`/api/video-sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'active' })
      })
    }

    const callFrame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: false,
      showFullscreenButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '12px'
      },
      userName: profile?.name || sessionData.consultantName || 'Usuário',
      enable_prejoin_ui: false  // ✅ Pular tela de Hair Check - permite auto-join direto
    })
    
    callFrameRef.current = callFrame
    
    // ADICIONAR LISTENERS ANTES DE JOIN (crucial!)
    callFrame.on('joined-meeting', () => {
      console.log('[VideoRoomPage] ✓ joined-meeting event disparado - entrou na sala com sucesso')
    })
    
    callFrame.on('left-meeting', () => {
      console.log('[VideoRoomPage] Daily.io left-meeting event disparado. isCallActive:', isCallActive)
      console.log('[VideoRoomPage] left-meeting reason: user or system disconnect')
      const participants = callFrame?.participants?.() || {}
      console.log('[VideoRoomPage] Participants at left-meeting time:', Object.keys(participants).length)
      // Só chamar handleLeaveCall se realmente estamos em uma chamada
      if (isCallActive && !callAlreadyEndedRef.current) {
        console.log('[VideoRoomPage] Chamando handleLeaveCall do left-meeting event')
        handleLeaveCall()
      } else {
        console.log('[VideoRoomPage] Ignorando left-meeting: isCallActive=', isCallActive, 'callAlreadyEnded=', callAlreadyEndedRef.current)
      }
    })
    
    callFrame.on('error', (e) => {
      console.error('[VideoRoomPage] ✗ Daily.co error event:', e)
      console.error('[VideoRoomPage] Error details:', {
        type: e?.type,
        message: e?.message,
        reason: e?.reason,
        full: JSON.stringify(e)
      })
    })
    
    callFrame.on('meeting-state-updated', (event) => {
      console.log('[VideoRoomPage] meeting-state-updated:', {
        status: event?.data?.status,
        callState: event?.data?.callState,
        participants: event?.data?.participants?.length
      })
    })
    
    // Listeners para participantes - ADICIONAR ANTES DE JOIN
    callFrame.on('participant-joined', (event) => {
      console.log('[VideoRoomPage] ✓ participant-joined event:', {
        id: event.participant.session_id,
        name: event.participant.user_name,
        isLocal: event.participant.local
      })
    })
    
    callFrame.on('participant-updated', (event) => {
      console.log('[VideoRoomPage] participant-updated (cam/mic toggle):', {
        id: event.participant.session_id,
        name: event.participant.user_name,
        camera: event.participant.video ? 'on' : 'off',
        mic: event.participant.audio ? 'on' : 'off'
      })
    })
    
    callFrame.on('participant-left', (event) => {
      console.log('[VideoRoomPage] participant-left event:', {
        id: event.participant.session_id,
        name: event.participant.user_name
      })
    })
    
    callFrame.on('participants-updated', (event) => {
      const participants = event.participants || {}
      console.log('[VideoRoomPage] ★ participants-updated event: ' + Object.keys(participants).length + ' total')
      Object.entries(participants).forEach(([id, p]) => {
        console.log(`  - [${id.substring(0, 8)}] ${p.user_name || 'unknown'} (local: ${p.local}, video: ${p.video}, audio: ${p.audio})`)
      })
    })
    
    callFrame.on('app-message', (event) => {
      console.log('[VideoRoomPage] app-message:', event)
    })
    
    callFrame.on('active-speaker-change', (event) => {
      console.log('[VideoRoomPage] active-speaker-change:', event.activeSpeaker?.user_name)
    })
    
    callFrame.on('recording-started', () => {
      console.log('[VideoRoomPage] recording-started')
    })
    
    callFrame.on('recording-stopped', () => {
      console.log('[VideoRoomPage] recording-stopped')
    })
    
    callFrame.on('access-state-updated', (event) => {
      console.log('[VideoRoomPage] access-state-updated:', event)
    })
    
    callFrame.on('network-quality-change', (event) => {
      console.log('[VideoRoomPage] network-quality-change:', event)
    })

    try {
      console.log('[VideoRoomPage] ═══════════════════════════════════════')
      console.log('[VideoRoomPage] Iniciando entrada na room Daily.co')
      console.log('[VideoRoomPage] Room URL:', sessionData.roomUrl)
      console.log('[VideoRoomPage] Token válido:', !!sessionData.dailyToken)
      console.log('[VideoRoomPage] Is Consultant (owner):', sessionData.isConsultant)
      console.log('[VideoRoomPage] ═══════════════════════════════════════')
      
      // Criar Promise que resolve quando estiver conectado (verificar estado + eventos)
      const joinPromise = new Promise((resolve, reject) => {
        let joined = false
        let pollInterval = null
        
        // Listener para sucesso via evento
        const onJoined = () => {
          if (!joined) {
            joined = true
            console.log('[VideoRoomPage] ✓ Evento joined-meeting disparado')
            clearInterval(pollInterval)
            cleanup()
            resolve({ success: true, via: 'event' })
          }
        }
        
        // Listener para erro
        const onJoinError = (error) => {
          if (!joined) {
            joined = true
            console.log('[VideoRoomPage] ✗ Erro no join:', error)
            clearInterval(pollInterval)
            cleanup()
            reject(error)
          }
        }
        
        // Listener para capturar TODOS os eventos (debugging)
        const onAnyEvent = (event) => {
          if (event.action && event.action !== 'noop' && !event.action.includes('stats')) {
            console.log('[VideoRoomPage] Event disparado:', event.action)
          }
        }
        
        // Polling: verificar estado checando se há participantes na room
        const pollJoined = () => {
          try {
            const participants = callFrame.participants()
            const participantCount = Object.keys(participants || {}).length
            console.log('[VideoRoomPage] Poll state: participants count =', participantCount)
            if (participantCount > 0 && !joined) {
              joined = true
              console.log('[VideoRoomPage] ✓ Polling detectou: conectado (hay participants na room)')
              clearInterval(pollInterval)
              cleanup()
              resolve({ success: true, via: 'polling' })
            }
          } catch (err) {
            console.error('[VideoRoomPage] Erro ao checar participants:', err)
          }
        }
        
        const cleanup = () => {
          callFrame.off('joined-meeting', onJoined)
          callFrame.off('error', onJoinError)
          callFrame.off('*', onAnyEvent)
        }
        
        callFrame.on('joined-meeting', onJoined)
        callFrame.on('error', onJoinError)
        callFrame.on('*', onAnyEvent) // Capturar todos os eventos para diagnosticar
        
        // Iniciar polling a cada 500ms
        pollInterval = setInterval(pollJoined, 500)
        
        // Chamar join
        console.log('[VideoRoomPage] 🔄 Chamando callFrame.join()...')
        callFrame.join({
          url: sessionData.roomUrl,
          token: sessionData.dailyToken
        }).catch(reject)
      })
      
      console.log('[VideoRoomPage] 🔄 Join promise criada, aguardando resultado...')
      
      const joinResult = await Promise.race([
        joinPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Join timeout after 90s')), 90000)
        )
      ])
      
      console.log('[VideoRoomPage] ✓ Join bem-sucedido')
      console.log('[VideoRoomPage] Join result:', joinResult)
      
      // ✅ APENAS AGORA que o join foi bem-sucedido, iniciar o billing
      console.log('[VideoRoomPage] Iniciando billing após join bem-sucedido. isConsultant:', sessionData.isConsultant)
      billing.startSession({
        consultantId: sessionData.consultantId,
        consultantName: sessionData.consultantName,
        pricePerMinute: sessionData.pricePerMinute,
        isConsultantMode: sessionData.isConsultant
      })
      
      // Esperar um momento para que os eventos sejam disparados
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const participants = callFrame.participants()
      console.log('[VideoRoomPage] ★ Participants após 1s:', {
        count: Object.keys(participants).length,
        localOnly: Object.keys(participants).length === 1,
        list: Object.entries(participants).map(([id, p]) => ({
          id: id.substring(0, 8),
          name: p.user_name,
          local: p.local
        }))
      })
      
      // Tentar chamar getStats
      try {
        const stats = callFrame.getStats()
        console.log('[VideoRoomPage] Network stats:', {
          qualityLevel: stats?.videoReceiveStats?.quality,
          bandwidth: stats?.stats?.bandwidth
        })
      } catch (e) {
        console.warn('[VideoRoomPage] getStats indisponível:', e.message)
      }
      
      // Obter meeting info
      try {
        const meetingInfo = callFrame.meetingState()
        console.log('[VideoRoomPage] Meeting state:', {
          status: meetingInfo?.status,
          participants: meetingInfo?.participants?.length
        })
      } catch (e) {
        console.warn('[VideoRoomPage] meetingState indisponível:', e.message)
      }
      
      setIsCallActive(true)
      setCallStartedAt((prev) => prev ?? Date.now())
    } catch (e) {
      console.error('[VideoRoomPage] ✗✗✗ ERRO ao entrar na sala')
      console.error('[VideoRoomPage] Erro type:', typeof e)
      console.error('[VideoRoomPage] Erro name:', e?.name)
      console.error('[VideoRoomPage] Erro message:', e?.message)
      console.error('[VideoRoomPage] Erro toString:', e?.toString())
      console.error('[VideoRoomPage] Erro stack:', e?.stack)
      
      // Se for erro de permissão, informar
      if (e?.message?.includes('token')) {
        console.error('[VideoRoomPage] ⚠️  PROBLEMA COM TOKEN - verificar geração no backend')
        setSystemNotice('Erro: Token inválido ou expirado. Tente novamente.')
      } else if (e?.message?.includes('room')) {
        console.error('[VideoRoomPage] ⚠️  PROBLEMA COM ROOM - verificar se room foi criada corretamente')
        setSystemNotice('Erro: Sala não encontrada ou inválida.')
      } else if (e?.message?.includes('timeout')) {
        console.error('[VideoRoomPage] ⚠️  TIMEOUT ao conectar - servidor Daily.co pode estar lento')
        setSystemNotice('Timeout ao conectar à sala. Verifique sua conexão e tente novamente.')
      } else {
        setSystemNotice('Erro ao conectar: ' + (e?.message || 'Erro desconhecido'))
      }
      
      // ❌ Se o join falhou, resetar isCallActive
      setIsCallActive(false)
      callAlreadyEndedRef.current = false
    } finally {
      // Sempre resetar o guard, independente de sucesso ou erro
      joinInProgressRef.current = false
    }
  }

  const handleStartByConsultant = async () => {
    callAlreadyEndedRef.current = false // Reset para nova sessão
    setIsCallActive(true)
    
    try {
      // Refetch session para garantir dados atualizados, especialmente pricePerMinute
      const res = await fetch(`/api/video-sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const freshSession = await res.json()
      
      console.log('[VideoRoomPage] Consultor iniciando. freshSession:', freshSession)
      console.log('[VideoRoomPage] Consultor - roomUrl:', freshSession.roomUrl)
      console.log('[VideoRoomPage] Consultor - dailyToken:', freshSession.dailyToken ? `${freshSession.dailyToken.substring(0, 20)}...` : 'UNDEFINED')
      
      if (freshSession) {
        // Chamando joinCall, que agora cuida de iniciar o billing APÓS conexão bem-sucedida
        joinCall(freshSession)
      }
    } catch (err) {
      console.error('Erro ao iniciar atendimento:', err)
      setSystemNotice('Erro ao iniciar atendimento.')
      setIsCallActive(false)
      callAlreadyEndedRef.current = false
    }
  }

  const handleLeaveCall = async () => {
    console.log('[VideoRoomPage] handleLeaveCall chamado. callAlreadyEnded:', callAlreadyEndedRef.current)
    
    if (callAlreadyEndedRef.current) {
      console.log('[VideoRoomPage] handleLeaveCall já foi executado, ignorando chamada duplicada')
      return
    }
    
    callAlreadyEndedRef.current = true
    
    console.log('[VideoRoomPage] Estado atual:', { isCallActive, callStartedAt, sessionId, billingConnected: billing.isConnected, billingActive: !!billing.activeSession })
    
    if (callFrameRef.current) {
      console.log('[VideoRoomPage] Limpando Daily.io frame')
      try {
        await callFrameRef.current.leave()
      } catch (e) {
        console.error('[VideoRoomPage] Erro ao sair da room:', e)
      }
      if (callFrameRef.current) {
        callFrameRef.current.destroy()
      }
      callFrameRef.current = null
    } else {
      console.log('[VideoRoomPage] callFrameRef.current é null, pulando limpeza do Daily')
    }
    
    // Usar tempo real acumulado do billing (prioridade 1)
    // Se billing.elapsedSeconds for 0 mas tivermos callStartedAt válido, calcular diferença
    let durationSeconds = 0
    
    if (billing.elapsedSeconds > 0) {
      durationSeconds = billing.elapsedSeconds
      console.log('[VideoRoomPage] Usando billing.elapsedSeconds:', durationSeconds)
    } else if (savedElapsedSecondsRef.current > 0) {
      // Fallback 2: Usar o elapsedSeconds que foi salvo quando other_user_left_call foi disparado
      durationSeconds = savedElapsedSecondsRef.current
      console.log('[VideoRoomPage] Usando savedElapsedSecondsRef (capturado no socket.io event):', durationSeconds)
    } else if (callStartedAt) {
      durationSeconds = Math.floor((Date.now() - callStartedAt) / 1000)
      console.log('[VideoRoomPage] Usando wall clock (Date.now() - callStartedAt):', durationSeconds)
    } else {
      console.log('[VideoRoomPage] Nenhuma duração disponível (billing.elapsedSeconds=0, callStartedAt=null)')
    }
    
    // Calcular consumo total (para qualquer participante)
    const totalConsumption = (durationSeconds / 60) * (session?.pricePerMinute || 0)
    
    // Backend vai aplicar a comissão. Frontend apenas envia o valor total que o consultor "ganhou"
    const consultantEarnings = totalConsumption

    console.log('[VideoRoomPage] Chamada finalizada. durationSeconds:', durationSeconds, 'pricePerMinute:', session?.pricePerMinute, 'totalConsumption:', totalConsumption.toFixed(2), 'isConsultant:', session?.isConsultant, 'consultantEarnings:', consultantEarnings.toFixed(2))
    console.log('[VideoRoomPage] billing state antes de stopSession:', { isConnected: billing.isConnected, elapsedSeconds: billing.elapsedSeconds, consumedValue: billing.consumedValue })

    // Para faturamento (cliente ou consultor)
    console.log('[VideoRoomPage] Chamando billing.stopSession()')
    billing.stopSession('handleLeaveCall')
    
    console.log('[VideoRoomPage] billing state após stopSession:', { isConnected: billing.isConnected, elapsedSeconds: billing.elapsedSeconds })

    // Salvar sessão com duração e earnings
    try {
      const finishResponse = await fetch(`/api/video-sessions/${sessionId}/finish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          status: 'finished',
          durationSeconds,
          totalConsumption,
          consultantEarnings
        })
      })
      
      if (finishResponse.ok) {
        const finishData = await finishResponse.json()
        console.log('[VideoRoomPage] Sessão finalizada no backend. newUserBalance:', finishData.newUserBalance)
        
        // Atualizar saldo do usuário no contexto
        if (finishData.newUserBalance !== undefined) {
          console.log('[VideoRoomPage] Atualizando saldo do usuário para:', finishData.newUserBalance)
          updateProfile({ minutesBalance: finishData.newUserBalance })
        }
      }
    } catch (err) {
      console.error('[VideoRoomPage] Erro ao finalizar sessão:', err)
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
      // NÃO chamar billing.stopSession() aqui - deve ser explícito em handleLeaveCall
    }
  }, [])

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
                  ? 'Entrando na sala automaticamente...'
                  : 'Sua sala já foi criada e o consultor foi notificado por e-mail e painel. Aguarde que estamos chamando o Consultor para lhe atender.'}
              </p>
              
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