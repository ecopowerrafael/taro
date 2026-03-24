import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'
import { Loader2, Video, PhoneOff } from 'lucide-react'
import { usePlatformContext } from '../context/platform-context'
import DailyIframe from '@daily-co/daily-js'

export function VideoRoomPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { token, billing, setSystemNotice } = usePlatformContext()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCallActive, setIsCallActive] = useState(false)
  const callFrameRef = useRef(null)
  const containerRef = useRef(null)

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

  // Polling to check if the other person joined (simplified approach for waiting room)
  useEffect(() => {
    if (!session || isCallActive) return
    
    const interval = setInterval(async () => {
      // In a real prod environment we'd use WebSockets. Here we poll status every 5s
      try {
        const res = await fetch(`/api/video-sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.status === 'active' && !isCallActive) {
          // Both are ready!
          joinCall(data)
        }
      } catch (e) {
        // ignore
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [session, isCallActive, sessionId, token])

  const joinCall = async (sessionData) => {
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
        pricePerMinute: sessionData.pricePerMinute
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
    } catch (e) {
      console.error('Erro ao entrar na sala do Daily', e)
      setSystemNotice('Erro ao conectar na sala de vídeo.')
    }
  }

  const handleStartByConsultant = () => {
    // Para o container ser renderizado e a div ficar "block" primeiro,
    // precisamos ativar isCallActive ANTES de chamar o joinCall, 
    // ou usar um setTimeout para o React ter tempo de montar a DOM
    setIsCallActive(true)
    setTimeout(() => {
      if (session) {
        joinCall(session)
      }
    }, 100)
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

    await fetch(`/api/video-sessions/${sessionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'finished' })
    })

    navigate(session?.isConsultant ? '/area-consultor' : '/consultores')
    setSystemNotice('Chamada encerrada com sucesso.')
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
    </PageShell>
  )
}