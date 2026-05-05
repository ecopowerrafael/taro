import { useState } from 'react'
import { AlertTriangle, UserPlus, Wallet, Video } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsultantMarketplaceNew } from '../components/ConsultantMarketplaceNew'
import { QuestionFlowModal } from '../components/QuestionFlowModal'
import { VideoConsultationRoom } from '../components/VideoConsultationRoom'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

const isConsultantOnline = (consultant) => consultant?.status === 'Online'

export function ConsultoresPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    consultants,
    statusFilter,
    setStatusFilter,
    selectConsultant,
    selectedConsultant,
    billing,
    roomUrl,
    connectSession,
    disconnectSession,
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
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState({ isOpen: false, minRequired: 0, type: 'video' })
  const [confirmCallModal, setConfirmCallModal] = useState({ isOpen: false, consultant: null })
  const [guestActionModal, setGuestActionModal] = useState({ isOpen: false, mode: 'video' })

  const handleChooseService = (consultant, mode) => {
    if (mode === 'video') {
      if (!profile) {
        setGuestActionModal({ isOpen: true, mode: 'video' })
        return
      }

      if (!isConsultantOnline(consultant)) {
        setSystemNotice(t('consultants.consultant_offline', 'Este consultor não está online no momento. Escolha um consultor online para iniciar a chamada ao vivo.'))
        return
      }

      const minRequired = consultant.pricePerMinute * 5
      if (minutesBalance < minRequired) {
        setInsufficientBalanceModal({ isOpen: true, minRequired, type: 'video' })
        return
      }

      setConfirmCallModal({ isOpen: true, consultant })
      return
    }

    if (!profile) {
      setGuestActionModal({ isOpen: true, mode: 'questions' })
      return
    }

    const config =
      mode === '3-questions'
        ? { questionCount: 3, price: consultant.priceThreeQuestions }
        : { questionCount: 5, price: consultant.priceFiveQuestions }

    if (minutesBalance < config.price) {
      setInsufficientBalanceModal({ isOpen: true, minRequired: config.price, type: 'questions' })
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

    if (!isConsultantOnline(confirmCallModal.consultant)) {
      setConfirmCallModal({ isOpen: false, consultant: null })
      setSystemNotice(t('consultants.consultant_offline', 'Este consultor não está online no momento. Escolha um consultor online para iniciar a chamada ao vivo.'))
      return
    }

    const consultantId = confirmCallModal.consultant.id
    
    // Fechar modal de confirmação
    setConfirmCallModal({ isOpen: false, consultant: null })
    
    // Aqui faremos a requisição para o backend criar a sala, enviar emails e retornar a URL
    setSystemNotice(t('consultants.creating_room', 'Criando sala segura e notificando consultor...'))
    
    try {
      // Usar o token do contexto ao invés de buscar do localStorage cru
      if (!token) {
        setSystemNotice(t('consultants.session_expired', 'Sessão expirada. Faça login para iniciar uma consulta de vídeo.'))
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
        setSystemNotice(data.message || t('consultants.error_starting', 'Erro ao iniciar sessão de vídeo.'))
        return
      }
      
      setSystemNotice('')
      // Redireciona para a nova página da sala de espera/vídeo
      navigate(`/sala/${data.sessionId}`)
      
    } catch (err) {
      console.error(err)
      setSystemNotice(t('consultants.error_connection', 'Erro de conexão ao tentar iniciar a sala.'))
    }
  }

  return (
    <PageShell title={t('consultants.page_title', 'Encontrar Consultor')} subtitle={t('consultants.page_subtitle', 'Filtre especialistas e inicie sua consulta em vídeo.')}>
      {systemNotice && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          <AlertTriangle size={16} />
          {systemNotice}
        </div>
      )}
      <ConsultantMarketplaceNew
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

      {/* Modal: Saldo Insuficiente */}
      {insufficientBalanceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-center text-amber-400">
              <Wallet size={48} />
            </div>
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">
              {t('consultants.insufficient_balance', 'Saldo Insuficiente')}
            </h3>
            <p className="mb-6 text-center text-amber-100/80">
              {insufficientBalanceModal.type === 'video' ? (
                <>{t('consultants.need_balance_video', 'Você precisa ter saldo para no mínimo 5 minutos (R$ {{amount}}) para iniciar esta chamada de vídeo.', { amount: insufficientBalanceModal.minRequired.toFixed(2) })}</>
              ) : (
                <>{t('consultants.need_balance_questions', 'Você precisa ter um saldo de no mínimo (R$ {{amount}}) para enviar este pacote de perguntas.', { amount: insufficientBalanceModal.minRequired.toFixed(2) })}</>
              )}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/recarregar')}
                className="w-full rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 py-3 font-bold text-black transition hover:brightness-110"
              >
                {t('consultants.recharge_now', 'Faça uma recarga')}
              </button>
              <button
                onClick={() => setInsufficientBalanceModal({ isOpen: false, minRequired: 0, type: 'video' })}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                {t('common.back', 'Voltar')}
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
              {t('consultants.confirm_call_title', 'Confirmar Início da Consulta')}
            </h3>
            <p className="mb-6 text-center text-amber-100/80">
              {t('consultants.confirm_call_desc', 'Você está prestes a iniciar uma chamada de vídeo com')} <strong className="text-amber-50">{confirmCallModal.consultant.name}</strong>.<br />
              {t('consultants.confirm_call_price', 'O valor é de R$ {{amount}} por minuto.', { amount: confirmCallModal.consultant.pricePerMinute.toFixed(2) })}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartVideoConsultation}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 py-3 font-bold text-black transition hover:brightness-110"
              >
                {t('consultants.confirm_start', 'Confirmar Início')}
              </button>
              <button
                onClick={() => setConfirmCallModal({ isOpen: false, consultant: null })}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                {t('common.back', 'Voltar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {guestActionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-center text-mystic-goldSoft">
              <UserPlus size={48} />
            </div>
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">
              {t('consultants.guest_modal_title', 'Crie sua conta para continuar')}
            </h3>
            <p className="mb-6 text-center text-amber-100/80">
              {guestActionModal.mode === 'video'
                ? t('consultants.login_to_start', 'Faça login ou cadastre-se para iniciar a consulta.')
                : t('consultants.login_to_send_questions', 'Faça login ou cadastre-se para enviar perguntas ao consultor.')}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setGuestActionModal({ isOpen: false, mode: 'video' })
                  navigate('/cadastro')
                }}
                className="w-full rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 py-3 font-bold text-black transition hover:brightness-110"
              >
                {t('consultants.guest_modal_register', 'Ir para cadastro')}
              </button>
              <button
                onClick={() => setGuestActionModal({ isOpen: false, mode: 'video' })}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                {t('common.back', 'Voltar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
