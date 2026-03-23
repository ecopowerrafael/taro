import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ConsultantMarketplace } from '../components/ConsultantMarketplace'
import { QuestionFlowModal } from '../components/QuestionFlowModal'
import { VideoConsultationRoom } from '../components/VideoConsultationRoom'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function ConsultoresPage() {
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
  } = usePlatformContext()
  const [questionFlow, setQuestionFlow] = useState({
    isOpen: false,
    consultant: null,
    questionCount: 0,
    price: 0,
  })

  const handleChooseService = (consultant, mode) => {
    if (mode === 'video') {
      selectConsultant(consultant)
      return
    }

    if (!profile) {
      setSystemNotice('Complete seu cadastro para enviar perguntas ao consultor.')
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
      <VideoConsultationRoom
        roomUrl={roomUrl}
        selectedConsultant={selectedConsultant}
        billing={billing}
        onConnect={connectSession}
        onDisconnect={disconnectSession}
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
    </PageShell>
  )
}
