import { useState } from 'react'
import { AlertTriangle, Wallet, Video } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ConsultantMarketplace } from '../components/ConsultantMarketplace'
import { QuestionFlowModal } from '../components/QuestionFlowModal'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function ConsultoresPage() {
  const navigate = useNavigate()
  const {
    consultants,
    statusFilter,
    setStatusFilter,
    selectConsultant,
    systemNotice,
    setSystemNotice,
    profile,
    minutesBalance,
    submitQuestionConsultation,
    token, // Vamos pegar o token direto do context, que já está garantido e atualizado
  } = usePlatformContext()
  const [questionFlow, setQuestionFlow] = useState({
    isOpen: false,
    consultant: null,
    questionCount: 0,
    price: 0,
  })

  // Novos estados para os modais
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState({ isOpen: false, minRequiredMinutes: 0 })
  const [confirmCallModal, setConfirmCallModal] = useState({ isOpen: false, consultant: null })

  const handleChooseService = (consultant, mode) => {
    if (mode === 'video') {
      if (!profile) {
        setSystemNotice('Faça login ou cadastre-se para iniciar a consulta.')
        return
      }

      const minRequiredMinutes = 5
      if (minutesBalance < minRequiredMinutes) {
        setInsufficientBalanceModal({ isOpen: true, minRequiredMinutes })
        return
      }

      setConfirmCallModal({ isOpen: true, consultant })
      return
    }

    if (!profile) {
      setSystemNotice('Faça login ou cadastre-se para enviar perguntas ao consultor.')
      return
    }

    const config =
      mode === '3-questions'
        ? { questionCount: 3, price: consultant.priceThreeQuestions }
        : { questionCount: 5, price: consultant.priceFiveQuestions }

    if (minutesBalance < config.price) {
      setSystemNotice('Saldo insuficiente para o pacote de perguntas selecionado.')
      return
    }

    selectConsultant(consultant)
    setQuestionFlow({
      isOpen: true,
      consultant,
      questionCount: config.questionCount,
      price: config.price,
    })
    setSystemNotice('')
  }

  const closeQuestionFlow = () => {
    setQuestionFlow({ isOpen: false, consultant: null, questionCount: 0, price: 0 })
  }

  const confirmSendQuestions = (entries) => {
    submitQuestionConsultation({
      consultant: questionFlow.consultant,
      questionCount: questionFlow.questionCount,
      price: questionFlow.price,
      entries,
    })
  }

  const handleStartVideoConsultation = async () => {
    if (!confirmCallModal.consultant) return
    const consultantId = confirmCallModal.consultant.id
    
    // Fechar modal de confirmação
    setConfirmCallModal({ isOpen: false, consultant: null })
    
    // Aqui faremos a requisição para o backend criar a sala, enviar emails e retornar a URL
    setSystemNotice('Criando sala segura e notificando consultor...')
    
    try {
      // Usar o token do contexto ao invés de buscar do localStorage cru
      if (!token) {
        setSystemNotice('Sessão expirada. Faça login para iniciar uma consulta de vídeo.')
        return
      }

      // Adicionamos a URL de API base caso seja necessário e removemos aspas do token
      const cleanToken = token.replace(/^"|"$/g, '').trim()
      
      const response = await fetch('/api/video-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`
        },
        body: JSON.stringify({ consultantId })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setSystemNotice(data.message || 'Erro ao iniciar sessão de vídeo.')
        return
      }
      
      setSystemNotice('')
      // Redireciona para a nova página da sala de espera/vídeo
      navigate(`/sala/${data.sessionId}`)
      
    } catch (err) {
      console.error(err)
      setSystemNotice('Erro de conexão ao tentar iniciar a sala.')
    }
  }

  return (
    <PageShell title="Encontrar Consultor" subtitle="Filtre especialistas e inicie sua consulta em vídeo.">
      {systemNotice && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          <AlertTriangle size={16} />
          {systemNotice}
        </div>
      )}
      <ConsultantMarketplace
        consultants={consultants}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onChooseService={handleChooseService}
      />
      <QuestionFlowModal
        key={`${questionFlow.consultant?.id ?? 'none'}-${questionFlow.questionCount}`}
        isOpen={questionFlow.isOpen}
        consultant={questionFlow.consultant}
        questionCount={questionFlow.questionCount}
        price={questionFlow.price}
        onClose={closeQuestionFlow}
        onConfirmSend={confirmSendQuestions}
      />

      {/* Modal: Saldo Insuficiente para Vídeo */}
      {insufficientBalanceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-center text-amber-400">
              <Wallet size={48} />
            </div>
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">
              Saldo Insuficiente
            </h3>
            <p className="mb-6 text-center text-amber-100/80">
              Você precisa ter saldo para no mínimo {insufficientBalanceModal.minRequiredMinutes} minutos para iniciar esta chamada de vídeo.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/recarregar')}
                className="w-full rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 py-3 font-bold text-black transition hover:brightness-110"
              >
                Faça uma recarga
              </button>
              <button
                onClick={() => setInsufficientBalanceModal({ isOpen: false, minRequiredMinutes: 0 })}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Início da Consulta */}
      {confirmCallModal.isOpen && confirmCallModal.consultant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-center text-emerald-400">
              <Video size={48} />
            </div>
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">
              Confirmar Início da Consulta
            </h3>
            <p className="mb-6 text-center text-amber-100/80">
              Você está prestes a iniciar uma chamada de vídeo com <strong className="text-amber-50">{confirmCallModal.consultant.name}</strong>.<br />
              O valor é de R$ {confirmCallModal.consultant.pricePerMinute.toFixed(2)} por minuto.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartVideoConsultation}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 py-3 font-bold text-black transition hover:brightness-110"
              >
                Confirmar Início
              </button>
              <button
                onClick={() => setConfirmCallModal({ isOpen: false, consultant: null })}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
