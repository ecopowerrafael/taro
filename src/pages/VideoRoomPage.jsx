import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'
import { Loader2, Video, PhoneOff } from 'lucide-react'
import { usePlatformContext } from '../context/platform-context'
import DailyIframe from '@daily-co/daily-js'
import { io } from 'socket.io-client'
import { useTranslation } from 'react-i18next'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

const getRealtimeServerUrl = () => {
  if (!API_BASE_URL) {
    return window.location.origin
  }

  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return window.location.origin
  }
}

export function VideoRoomPage() {
  const { t } = useTranslation()
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { token, profile, billing, setSystemNotice } = usePlatformContext()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCallActive, setIsCallActive] = useState(false)
  const [canJoinCall, setCanJoinCall] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const callFrameRef = useRef(null)
  const containerRef = useRef(null)
  const socketRef = useRef(null)

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
        setError(err.message || t('video_room.errors.load_room', 'Erro ao carregar a sala.'))
      } finally {
        setLoading(false)
      }
    }
    
    if (token) {
      fetchSession()
    }
  }, [sessionId, token])

  useEffect(() => {
    if (session?.status === 'active') {
      setCanJoinCall(true)
    }
  }, [session?.status])

  // Polling to keep waiting room status in sync
  useEffect(() => {
    if (!session || isCallActive) return
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) return

        setSession((prev) => ({ ...(prev || {}), ...data }))
        if (data.status === 'active') {
          setCanJoinCall(true)
        }
      } catch (e) {
        // ignore
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [session, isCallActive, sessionId, token])

  useEffect(() => {
    if (!session || !profile?.id) {
      return
    }

    const role = session.isConsultant ? 'consultant' : 'customer'
    const socket = io(getRealtimeServerUrl(), {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })
    socketRef.current = socket

    const joinPresence = () => {
      socket.emit('join_session_presence', {
        sessionId,
        userId: profile.id,
        role,
      })
    }

    socket.on('connect', joinPresence)
    socket.on('reconnect', joinPresence)
    joinPresence()

    const leavePresence = () => {
      socket.emit('leave_session_presence', {
        sessionId,
        userId: profile.id,
      })
    }

    const handlePageHide = () => {
      leavePresence()
    }

    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      leavePresence()
      socket.off('connect', joinPresence)
      socket.off('reconnect', joinPresence)
      socket.disconnect()
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [session, sessionId, profile?.id])

  const requestMediaPermissions = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(t('video_room.errors.browser_media_unsupported', 'Seu navegador não suporta câmera/microfone nesta página.'))
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    stream.getTracks().forEach((track) => track.stop())
  }

  const joinCall = async (sessionData, { requestPermissionFirst = false } = {}) => {
    if (!containerRef.current) return
    if (callFrameRef.current) return
    
    // Marcar sessão como ativa no DB se ainda não estiver
    if (sessionData.status !== 'active') {
      const statusRes = await fetch(`/api/video-sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'active' })
      })
      if (!statusRes.ok) {
        const payload = await statusRes.json().catch(() => ({}))
        setSystemNotice(
          payload.message ||
            t('video_room.errors.start_call_failed', 'Não foi possível iniciar a chamada. Confirme que cliente e consultor estão online nesta página.'),
        )
        return
      }
      setSession((prev) => ({ ...(prev || {}), status: 'active' }))
      setCanJoinCall(true)
    }

    if (requestPermissionFirst) {
      try {
        await requestMediaPermissions()
      } catch (permissionError) {
        setSystemNotice(permissionError.message || t('video_room.errors.media_permission_denied', 'Permissões de câmera/microfone não concedidas.'))
        return
      }
    }

    setIsCallActive(true)
    const callFrame = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '12px'
      }
    })
    
    callFrameRef.current = callFrame
    
    callFrame.on('left-meeting', () => {
      handleLeaveCall()
    })

    try {
      await callFrame.join({
        url: sessionData.roomUrl,
        token: sessionData.dailyToken // Usado se a sala for privada
      })

      // Iniciar faturamento apenas depois que entrou com sucesso na chamada
      if (!sessionData.isConsultant) {
        billing.startSession({
          consultantId: sessionData.consultantId,
          consultantName: sessionData.consultantName,
          pricePerMinute: sessionData.pricePerMinute
        })
      }
    } catch (e) {
      console.error('Erro ao entrar na sala do Daily', e)
      if (callFrameRef.current) {
        callFrameRef.current.destroy()
        callFrameRef.current = null
      }
      setIsCallActive(false)
      setSystemNotice(t('video_room.errors.connect_video_room', 'Erro ao conectar na sala de vídeo.'))
    }
  }

  const handleStartByConsultant = async () => {
    if (!session || isJoining) return
    setIsJoining(true)
    try {
      await joinCall(session, { requestPermissionFirst: true })
    } finally {
      setIsJoining(false)
    }
  }

  const handleJoinAsCustomer = async () => {
    if (!session || isJoining) return
    setIsJoining(true)
    try {
      await joinCall(session, { requestPermissionFirst: true })
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveCall = async () => {
    if (callFrameRef.current) {
      await callFrameRef.current.leave()
      callFrameRef.current.destroy()
      callFrameRef.current = null
    }
    
    if (!session?.isConsultant) {
      billing.stopSession()
    }

    if (socketRef.current && profile?.id) {
      socketRef.current.emit('leave_session_presence', {
        sessionId,
        userId: profile.id,
      })
    }

    await fetch(`/api/video-sessions/${sessionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'finished' })
    })

    navigate(session?.isConsultant ? '/area-consultor' : '/consultores')
    setSystemNotice(t('video_room.notices.call_ended', 'Chamada encerrada com sucesso.'))
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave()
        callFrameRef.current.destroy()
      }
      if (isCallActive && !session?.isConsultant) {
        billing.stopSession()
      }
    }
  }, [isCallActive, session])

  if (loading) {
    return (
      <PageShell title={t('video_room.title', 'Sala de Consulta')} subtitle={t('common.loading', 'Carregando...')}>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-mystic-gold" size={48} />
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell title={t('video_room.title', 'Sala de Consulta')} subtitle={t('video_room.access_denied', 'Acesso negado')}>
        <GlassCard className="text-center">
          <p className="text-red-400">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-mystic-goldSoft underline">
            {t('video_room.back_home', 'Voltar ao Início')}
          </button>
        </GlassCard>
      </PageShell>
    )
  }

  return (
    <PageShell title={`${t('video_room.consultation_with', 'Consulta com')} ${session.consultantName}`} subtitle={t('video_room.private_session', 'Sessão de Vídeo Privada')}>
      <div className="mx-auto w-full max-w-4xl">
        <div 
          className={`relative overflow-hidden rounded-2xl border border-mystic-gold/30 bg-black/50 shadow-[0_0_30px_rgba(197,160,89,0.15)] ${isCallActive ? 'h-[70vh]' : 'h-auto p-8 text-center'}`}
        >
          {/* Waiting Room */}
          {!isCallActive && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-6 rounded-full bg-mystic-gold/10 p-6 text-mystic-gold">
                <Video size={48} className="animate-pulse" />
              </div>
              <h2 className="mb-2 font-display text-3xl text-mystic-goldSoft">
                {session.isConsultant ? t('video_room.ready_room', 'Sala Pronta') : t('video_room.waiting_consultant', 'Aguardando Consultor')}
              </h2>
              <p className="max-w-md text-amber-100/70">
                {session.isConsultant
                  ? t('video_room.messages.consultant_waiting', 'O cliente está esperando. Clique no botão abaixo para iniciar a videochamada.')
                  : canJoinCall
                    ? t('video_room.messages.consultant_available', 'Consultor disponível. Toque no botão abaixo para liberar câmera e microfone no Safari e entrar na chamada.')
                    : t('video_room.messages.room_created_wait', 'Sua sala já foi criada e o consultor foi notificado por e-mail e painel. Aguarde que estamos chamando o consultor para lhe atender.')}
              </p>
              
              {session.isConsultant && (
                <button
                  onClick={handleStartByConsultant}
                  disabled={isJoining}
                  className="mt-8 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-3 font-bold text-black transition hover:brightness-110"
                >
                  {isJoining ? t('video_room.actions.connecting', 'Conectando...') : t('video_room.actions.start_service', 'Iniciar Atendimento')}
                </button>
              )}

              {!session.isConsultant && canJoinCall && (
                <button
                  onClick={handleJoinAsCustomer}
                  disabled={isJoining}
                  className="mt-8 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-3 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isJoining ? t('video_room.actions.connecting', 'Conectando...') : t('video_room.actions.join_call', 'Entrar na Chamada')}
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
                {t('video_room.actions.end_call', 'Encerrar Chamada')}
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
