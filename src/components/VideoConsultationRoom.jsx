import { useEffect, useRef, useState } from 'react'
import { Clock3, Video } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { TarotCard } from './TarotCard'

export function VideoConsultationRoom({
  roomUrl,
  selectedConsultant,
  billing,
  onConnect,
  onDisconnect,
}) {
  const callObjectRef = useRef(null)
  const [, setDailyError] = useState('')

  useEffect(() => {
    if (!billing.isConnected || !roomUrl) {
      return undefined
    }

    const connect = async () => {
      let DailyIframe
      try {
        const module = await import('@daily-co/daily-js')
        DailyIframe = module.default || module
      } catch (e) {
        console.error('Falha ao importar DailyIframe dinamicamente:', e)
        setDailyError('Não foi possível carregar serviço de vídeo Daily.co')
        onDisconnect()
        return
      }

      if (!DailyIframe || typeof DailyIframe.createCallObject !== 'function') {
        console.error('DailyIframe inválido após import dinâmico:', DailyIframe)
        setDailyError('SDK da chamada inválido')
        onDisconnect()
        return
      }

      const callObject = DailyIframe.createCallObject()
      callObjectRef.current = callObject
      await callObject.join({ url: roomUrl })
    }

    connect().catch(() => {
      onDisconnect()
    })

    return () => {
      const callObject = callObjectRef.current
      if (!callObject) {
        return
      }
      callObject.leave().finally(() => {
        callObject.destroy()
      })
      callObjectRef.current = null
    }
  }, [billing.isConnected, onDisconnect, roomUrl])

  const canConnect = selectedConsultant && !billing.isConnected
  const isLowBalanceDuringCall = billing.isConnected && billing.remainingMinutes < 3

  return (
    <GlassCard
      title="Motor de Chamada e Cobrança"
      subtitle="Integração base Daily.co com débito proporcional por minuto."
    >
      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="min-h-44 rounded-lg border border-mystic-gold/30 bg-black/35 p-4">
          <div className="mb-3 inline-flex items-center gap-2 text-sm text-mystic-goldSoft">
            <Video size={16} />
            Sala de Vídeo Daily.co
          </div>
          <p className="text-sm text-amber-100/75">
            {selectedConsultant
              ? `Consultor selecionado: ${selectedConsultant.name}`
              : 'Selecione um consultor no marketplace para iniciar a chamada.'}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={onConnect}
              disabled={!canConnect}
              className="rounded-lg border border-mystic-gold/60 px-4 py-2 text-sm text-amber-50 transition enabled:hover:bg-mystic-gold/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Conectar
            </button>
            <button
              onClick={onDisconnect}
              disabled={!billing.isConnected}
              className="rounded-lg border border-red-400/50 px-4 py-2 text-sm text-red-300 transition enabled:hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Desconectar
            </button>
          </div>
        </div>
        <div
          className={`rounded-lg border bg-black/35 p-4 transition ${
            isLowBalanceDuringCall
              ? 'border-red-400/80 shadow-[0_0_0_1px_rgba(248,113,113,0.65),0_0_22px_rgba(248,113,113,0.4)] animate-neon-red-pulse'
              : 'border-mystic-gold/30'
          }`}
        >
          <div className="mb-2 inline-flex items-center gap-2 text-sm text-mystic-goldSoft">
            <Clock3 size={16} />
            Timer de sessão
          </div>
          <p className="font-display text-4xl text-amber-100">{billing.formattedElapsed}</p>
          <p className="mt-3 text-sm text-amber-100/75">
            Consumo: {billing.consumedMinutes.toFixed(2)} min
          </p>
          <p className="text-sm text-amber-100/75">
            Cobrança: R$ {billing.consumedValue.toFixed(2)}
          </p>
          <p className="text-sm text-amber-100/75">
            Saldo estimado: {billing.remainingMinutes.toFixed(2)} min
          </p>
        </div>
      </div>
      <div className="mt-4 md:max-w-xs">
        <TarotCard
          title={selectedConsultant ? selectedConsultant.name : 'Aguardando Conexão'}
          subtitle={
            selectedConsultant
              ? 'Energia da consulta alinhada para a leitura.'
              : 'Selecione um consultor para iniciar o ritual de revelação.'
          }
        />
      </div>
    </GlassCard>
  )
}
