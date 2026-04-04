import { useEffect, useMemo, useRef, useState } from 'react'
import { BellRing, Loader2, SendHorizontal, Sparkles, Wallet, Lock, UserPlus, Info, XCircle, History, NotebookPen, Video, MessagesSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'
import { WalletStatement } from '../components/WalletStatement'
import { NotificationBadge } from '../components/NotificationBadge'
import { usePlatformContext } from '../context/platform-context'
import { notificationService } from '../services/ConsultantNotificationService'
import { canPromptPwaInstall, promptPwaInstall } from '../services/pwaService'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

const buildApiUrl = (resource) => {
  if (!API_BASE_URL) {
    return resource
  }

  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  const path = resource.startsWith('/') ? resource : `/${resource}`
  return `${base}${path}`
}

export function AreaConsultorPage() {
  const {
    profile,
    isConsultant,
    isAdmin,
    userConsultantProfile,
    consultants,
    updateConsultantByAdmin,
    persistConsultantWithResult,
    questionRequests,
    respondToQuestionRequest,
    consultantWallets,
    setConsultantPixKey,
    requestConsultantWithdrawal,
    minWithdrawalAmount,
    updateConsultantAvailability,
    addInAppNotification,
    addToNotificationHistory,
    ensurePushSubscription,
    authLoading,
    token,
  } = usePlatformContext()

  const [selectedConsultantId, setSelectedConsultantId] = useState('')
  const [gainFilter, setGainFilter] = useState('total')
  const [pixDraft, setPixDraft] = useState('')
  const [pixBeneficiaryDraft, setPixBeneficiaryDraft] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [panelNotice, setPanelNotice] = useState('')
  const [profileNotice, setProfileNotice] = useState('')
  const [responseDrafts, setResponseDrafts] = useState({})
  const [profileDraft, setProfileDraft] = useState(null)
  const [pendingVideoSessions, setPendingVideoSessions] = useState([])
  const [rejectModal, setRejectModal] = useState(null)
  const [confirmResponseModal, setConfirmResponseModal] = useState(null)
  const [pendingStatusModal, setPendingStatusModal] = useState(false)
  const [questionAlertVisible, setQuestionAlertVisible] = useState(true)
  const [questionInboxModalOpen, setQuestionInboxModalOpen] = useState(false)
  const [pwaInstallAvailable, setPwaInstallAvailable] = useState(canPromptPwaInstall())
  const [consultantSpellOrders, setConsultantSpellOrders] = useState([])
  const [spellOrdersLoading, setSpellOrdersLoading] = useState(false)
  const [consultationHistoryLoading, setConsultationHistoryLoading] = useState(false)
  const [videoConsultationHistory, setVideoConsultationHistory] = useState([])
  const [videoNotesDrafts, setVideoNotesDrafts] = useState({})
  const [historyExpandedCustomer, setHistoryExpandedCustomer] = useState(null)
  const seenPendingSessionIdsRef = useRef(new Set())
  const seenPendingQuestionIdsRef = useRef(new Set())

  // Polling para novas chamadas de v\u00eddeo
  useEffect(() => {
    if (!token || isAdmin) return

    const fetchPendingVideo = async () => {
      try {
        const res = await fetch(buildApiUrl('/api/video-sessions/pending'), {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()

          const now = Date.now()
          const filtered = await Promise.all(
            data.map(async (session) => {
              const createdAt = new Date(session.createdAt).getTime()
              const ageMs = now - createdAt
              if (ageMs > 15 * 60 * 1000) {
                // Remove sessÃµes antigas automaticamente e marca como cancelled
                await fetch(buildApiUrl(`/api/video-sessions/${session.id}/status`), {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ status: 'cancelled' })
                }).catch(() => {})
                return null
              }
              return session
            }),
          )

          setPendingVideoSessions(filtered.filter(Boolean))
        }
      } catch (e) {
        // ignora
      }
    }

    fetchPendingVideo()
    const interval = setInterval(fetchPendingVideo, 5000)
    return () => clearInterval(interval)
  }, [token, isAdmin])
  const [referenceTimestamp] = useState(() => Date.now())

  const formatInitialCurrency = (val) => {
    const num = Number(val) || 0
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatRelativeTime = (createdAt) => {
    if (!createdAt) return 'Solicitado hÃ¡ poucos instantes'
    const created = new Date(createdAt)
    const diffMs = Date.now() - created.getTime()
    const diffSec = Math.floor(diffMs / 1000)

    if (diffSec < 60) return `Solicitado hÃ¡ ${diffSec}s`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `Solicitado hÃ¡ ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    return `Solicitado hÃ¡ ${diffH} h`
  }

  const handleRejectVideoCall = async (sessionId) => {
    try {
      const res = await fetch(buildApiUrl(`/api/video-sessions/${sessionId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'rejected' })
      })
      if (res.ok) {
        setPendingVideoSessions(prev => prev.filter(s => s.id !== sessionId))
        setRejectModal(null)
      } else {
        setPanelNotice('Erro ao rejeitar chamada.')
      }
    } catch (e) {
      setPanelNotice('Erro ao rejeitar chamada.')
    }
  }

  // Atualizar o consultor selecionado quando o perfil carregar
  useEffect(() => {
    if (userConsultantProfile) {
      setSelectedConsultantId(userConsultantProfile.id)
      setProfileDraft({
        name: userConsultantProfile.name,
        email: userConsultantProfile.email,
        tagline: userConsultantProfile.tagline,
        description: userConsultantProfile.description,
        photo: userConsultantProfile.photo ?? '',
        pricePerMinute: formatInitialCurrency(userConsultantProfile.pricePerMinute),
        priceThreeQuestions: formatInitialCurrency(userConsultantProfile.priceThreeQuestions),
        priceFiveQuestions: formatInitialCurrency(userConsultantProfile.priceFiveQuestions),
      })
    } else if (isAdmin && consultants.length > 0) {
      // Se for admin mas nÃ£o tiver perfil de consultor, mostra o primeiro da lista
      setSelectedConsultantId(consultants[0].id)
    }
  }, [userConsultantProfile, isAdmin, consultants])

  const selectedConsultant = consultants.find((consultant) => consultant.id === selectedConsultantId)

  const loadConsultantSpellOrders = async () => {
    if (!token || (!isConsultant && !isAdmin)) {
      return
    }

    setSpellOrdersLoading(true)
    try {
      const response = await fetch(buildApiUrl('/api/spells/orders/mine'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return
      }

      const payload = await response.json()
      setConsultantSpellOrders(Array.isArray(payload) ? payload : [])
    } catch (error) {
      console.error('[AreaConsultorPage] Erro ao buscar pedidos de magias:', error)
    } finally {
      setSpellOrdersLoading(false)
    }
  }

  const loadConsultationHistory = async () => {
    if (!token || (!isConsultant && !isAdmin)) {
      return
    }

    setConsultationHistoryLoading(true)
    try {
      const response = await fetch(buildApiUrl('/api/video-sessions/history/mine'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return
      }

      const payload = await response.json()
      const sessions = Array.isArray(payload) ? payload : []
      setVideoConsultationHistory(sessions)
      setVideoNotesDrafts(
        sessions.reduce((acc, session) => {
          acc[session.id] = session.consultantNotes || ''
          return acc
        }, {}),
      )
    } catch (error) {
      console.error('[AreaConsultorPage] Erro ao buscar histÃ³rico de vÃ­deo:', error)
    } finally {
      setConsultationHistoryLoading(false)
    }
  }

  const saveVideoConsultationNote = async (sessionId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/video-sessions/${sessionId}/notes`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          consultantNotes: videoNotesDrafts[sessionId] || '',
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao salvar observaÃ§Ã£o.')
      }

      const payload = await response.json()
      setVideoConsultationHistory((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, consultantNotes: payload.consultantNotes || '' }
            : session,
        ),
      )
      setPanelNotice('ObservaÃ§Ã£o da consulta em vÃ­deo salva com sucesso.')
    } catch (error) {
      console.error('[AreaConsultorPage] Erro ao salvar observaÃ§Ã£o do vÃ­deo:', error)
      setPanelNotice('NÃ£o foi possÃ­vel salvar a observaÃ§Ã£o da consulta em vÃ­deo.')
    }
  }

  // RenderizaÃ§Ã£o condicional para quem nÃ£o Ã© consultor
  if (!authLoading && !isConsultant && !isAdmin) {
    return (
      <PageShell title="Ãrea do Consultor" subtitle="Painel Restrito">
        <div className="flex flex-col items-center justify-center py-12">
          <GlassCard className="max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-mystic-gold/10 p-6 text-mystic-gold">
                <Lock size={48} />
              </div>
            </div>
            <h2 className="mb-4 font-display text-3xl text-mystic-goldSoft">Acesso Restrito</h2>
            <p className="mb-8 text-amber-100/70">
              Esta Ã¡rea Ã© exclusiva para nossos consultores. Se vocÃª Ã© um tarÃ³logo experiente, 
              venha fazer parte do nosso time!
            </p>
            <div className="flex flex-col gap-4">
              <Link
                to="/seja-consultor"
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 px-8 py-3 font-bold text-black transition hover:brightness-110"
              >
                <UserPlus size={20} />
                Torne-se um Consultor
              </Link>
              <Link
                to="/"
                className="text-sm text-amber-100/50 hover:text-mystic-goldSoft transition"
              >
                Voltar para a Home
              </Link>
            </div>
          </GlassCard>
        </div>
      </PageShell>
    )
  }

  const isSelectedConsultantOnline = selectedConsultant?.status === 'Online'
  const wallet = consultantWallets[selectedConsultantId] ?? {
    availableBalance: 0,
    pixKey: '',
    pixBeneficiaryName: '',
    transactions: [],
    withdrawals: [],
  }

  const pendingRequests = questionRequests.filter(
    (request) => request.consultantId === selectedConsultantId && request.status === 'pending',
  )
  const answeredRequests = questionRequests.filter(
    (request) => request.consultantId === selectedConsultantId && request.status === 'answered',
  )
  const canAnswerQuestions =
    isAdmin || !selectedConsultant || (selectedConsultant.status !== 'pending' && selectedConsultant.status !== 'Pendente')

  useEffect(() => {
    void loadConsultantSpellOrders()
  }, [token, isConsultant, isAdmin])

  useEffect(() => {
    void loadConsultationHistory()
  }, [token, isConsultant, isAdmin])

  useEffect(() => {
    if (!isAdmin && pendingRequests.length > 0) {
      setQuestionAlertVisible(true)
    }

    if (pendingRequests.length === 0) {
      setQuestionInboxModalOpen(false)
    }
  }, [isAdmin, pendingRequests.length])

  useEffect(() => {
    if (isAdmin) {
      return
    }

    pendingVideoSessions.forEach((session) => {
      if (seenPendingSessionIdsRef.current.has(session.id)) {
        return
      }

      seenPendingSessionIdsRef.current.add(session.id)
      const notification = {
        id: `poll-call-${session.id}`,
        title: 'ðŸ“ž Chamada detectada no painel',
        message: `${session.userName || 'Cliente'} estÃ¡ aguardando sua entrada na sala.`,
        icon: 'phone',
        contactName: session.userName || 'Cliente',
        type: 'call',
        autoCloseMs: 0,
        actions: [
          {
            id: 'answer',
            label: 'Entrar na sala',
            primary: true,
            onClick: () => {
              window.location.href = `/sala/${session.id}`
            },
          },
        ],
      }
      notificationService.playRingtone()
      void notificationService.showNotification({
        sessionId: session.id,
        customerName: session.userName || 'Cliente',
      })
      addInAppNotification(notification)
      addToNotificationHistory(notification)
    })
  }, [addInAppNotification, addToNotificationHistory, isAdmin, pendingVideoSessions])

  useEffect(() => {
    if (isAdmin) {
      return
    }

    pendingRequests.forEach((request) => {
      if (seenPendingQuestionIdsRef.current.has(request.id)) {
        return
      }

      seenPendingQuestionIdsRef.current.add(request.id)
      const notification = {
        id: `poll-question-${request.id}`,
        title: `â“ ${request.questionCount} pergunta(s) pendente(s)`,
        message: `${request.customerName || 'Cliente'} enviou uma nova consulta para vocÃª.`,
        icon: 'message',
        contactName: request.customerName || 'Cliente',
        type: 'question',
        autoCloseMs: 10000,
        actions: [
          {
            id: 'answer',
            label: 'Responder Agora',
            primary: true,
            onClick: () => {
              setQuestionInboxModalOpen(true)
              setQuestionAlertVisible(false)
            },
          },
        ],
      }
      if ('vibrate' in navigator) {
        navigator.vibrate([350, 120, 350])
      }
      addInAppNotification(notification)
      addToNotificationHistory(notification)
    })
  }, [addInAppNotification, addToNotificationHistory, isAdmin, pendingRequests])

  const filteredEarnings = useMemo(() => {
    const msByFilter = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    }
    return wallet.transactions
      .filter((item) => item.type === 'credit')
      .filter((item) => {
        if (gainFilter === 'total') {
          return true
        }
        const windowMs = msByFilter[gainFilter]
        return referenceTimestamp - new Date(item.createdAt).getTime() <= windowMs
      })
      .reduce((sum, item) => sum + item.amount, 0)
  }, [gainFilter, referenceTimestamp, wallet.transactions])

  const consultationHistoryByCustomer = useMemo(() => {
    const consultantQuestionHistory = questionRequests.filter((request) => request.consultantId === selectedConsultantId)
    const consultantVideoHistory = videoConsultationHistory.filter((session) => session.consultantId === selectedConsultantId)
    const grouped = new Map()

    consultantQuestionHistory.forEach((request) => {
      const customerKey = request.customerEmail || request.customerName || request.id
      const current = grouped.get(customerKey) || {
        customerKey,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        questionRequests: [],
        videoSessions: [],
        latestAt: request.answeredAt || request.createdAt,
      }
      current.questionRequests.push(request)
      current.latestAt = new Date(current.latestAt || 0) > new Date(request.answeredAt || request.createdAt || 0)
        ? current.latestAt
        : request.answeredAt || request.createdAt
      grouped.set(customerKey, current)
    })

    consultantVideoHistory.forEach((session) => {
      const customerKey = session.userEmail || session.userName || session.id
      const current = grouped.get(customerKey) || {
        customerKey,
        customerName: session.userName,
        customerEmail: session.userEmail,
        questionRequests: [],
        videoSessions: [],
        latestAt: session.finishedAt || session.startedAt || session.createdAt,
      }
      current.videoSessions.push(session)
      current.latestAt = new Date(current.latestAt || 0) > new Date(session.finishedAt || session.startedAt || session.createdAt || 0)
        ? current.latestAt
        : session.finishedAt || session.startedAt || session.createdAt
      grouped.set(customerKey, current)
    })

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        questionRequests: item.questionRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        videoSessions: item.videoSessions.sort((a, b) => new Date(b.finishedAt || b.startedAt || b.createdAt) - new Date(a.finishedAt || a.startedAt || a.createdAt)),
      }))
      .sort((a, b) => new Date(b.latestAt || 0) - new Date(a.latestAt || 0))
  }, [questionRequests, selectedConsultantId, videoConsultationHistory])

  const formatDurationLabel = (durationSeconds = 0) => {
    const totalSeconds = Number(durationSeconds) || 0
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}min ${seconds.toString().padStart(2, '0')}s`
  }

  useEffect(() => {
    // Removido disconnect limpo (agora delegado para o PlatformContext)
  }, [])

  useEffect(() => {
    if (!selectedConsultantId || isAdmin) {
      return
    }

    return () => {
      
    }
  }, [isAdmin, selectedConsultantId])

  useEffect(() => {
    const syncInstallAvailability = () => setPwaInstallAvailable(canPromptPwaInstall())
    syncInstallAvailability()
    window.addEventListener('beforeinstallprompt', syncInstallAvailability)
    window.addEventListener('appinstalled', syncInstallAvailability)
    return () => {
      window.removeEventListener('beforeinstallprompt', syncInstallAvailability)
      window.removeEventListener('appinstalled', syncInstallAvailability)
    }
  }, [])

  const handleSelectConsultant = async (consultantId) => {
    // Apenas permitir trocar se for admin
    if (!isAdmin) return

    const previousConsultantId = selectedConsultantId
    if (previousConsultantId && previousConsultantId !== consultantId) {
      const previousConsultant = consultants.find((item) => item.id === previousConsultantId)
      if (previousConsultant?.status === 'Online') {
        updateConsultantAvailability(previousConsultantId, false)
      }
    }

    setSelectedConsultantId(consultantId)
    const consultant = consultants.find((item) => item.id === consultantId)
    if (!consultant) {
      return
    }
    setProfileDraft({
      name: consultant.name,
      email: consultant.email,
      tagline: consultant.tagline,
      description: consultant.description,
      photo: consultant.photo ?? '',
      pricePerMinute: formatInitialCurrency(consultant.pricePerMinute),
      priceThreeQuestions: formatInitialCurrency(consultant.priceThreeQuestions),
      priceFiveQuestions: formatInitialCurrency(consultant.priceFiveQuestions),
    })
  }

  const handleToggleAvailability = async () => {
    if (!selectedConsultantId || !selectedConsultant) {
      return
    }

    // Verificar se consultor estÃ¡ pendente
    if (selectedConsultant.status === 'pending' || selectedConsultant.status === 'Pendente') {
      setPendingStatusModal(true)
      return
    }

    try {
      if (isSelectedConsultantOnline) {
        updateConsultantAvailability(selectedConsultantId, false)
        setPanelNotice('VocÃª ficou offline e nÃ£o receberÃ¡ novas chamadas.')
        return
      }

      await ensurePushSubscription()
      
      updateConsultantAvailability(selectedConsultantId, true)
      setPanelNotice('VocÃª ficou online. Aguardando chamadas de vÃ­deo.')
    } catch (error) {
      updateConsultantAvailability(selectedConsultantId, false)
      setPanelNotice('NÃ£o foi possÃ­vel ativar o modo online no momento.')
      console.error('[AreaConsultorPage] erro ao alterar disponibilidade:', error)
    }
  }

  const handleSilenceIncomingAlert = async () => {
    notificationService.stopRingtone()
    setPanelNotice('Alerta de chamada silenciado.')
  }

  const handleResponseChange = (requestId, index, value) => {
    setResponseDrafts((prev) => {
      const draft = Array.isArray(prev[requestId]) ? [...prev[requestId]] : []
      draft[index] = value
      return { ...prev, [requestId]: draft }
    })
  }

  const handleSubmitResponse = (requestId) => {
    const request = questionRequests.find((item) => item.id === requestId)
    if (!request) {
      setPanelNotice('SolicitaÃ§Ã£o nÃ£o encontrada.')
      return
    }

    const drafts = responseDrafts[requestId] ?? []
    if (!Array.isArray(drafts) || drafts.length === 0) {
      setPanelNotice('Preencha as respostas antes de concluir o atendimento.')
      return
    }

    // Abre modal de confirmaÃ§Ã£o
    setConfirmResponseModal({ requestId, request, drafts })
  }

  const handleConfirmAndSendResponse = async () => {
    if (!confirmResponseModal) return

    const { requestId, request, drafts } = confirmResponseModal
    const filledAnswers = request.entries.map((entry, i) => {
      const answerText = (drafts[i] ?? '').trim()
      return `P${i + 1}: ${answerText || '[Sem resposta]'}`
    })

    const answerSummary = filledAnswers.join('\n')
    const answeredEntries = request.entries.map((entry, index) => ({
      ...entry,
      answer: (drafts[index] ?? '').trim(),
    }))

    try {
      await respondToQuestionRequest({
        requestId,
        consultantId: selectedConsultantId,
        answerSummary,
        answeredEntries,
      })
      setResponseDrafts((prev) => ({ ...prev, [requestId]: [] }))
      setConfirmResponseModal(null)
      setPanelNotice('Resposta enviada e valor lÃ­quido creditado na carteira do consultor.')
    } catch (error) {
      console.error('[AreaConsultorPage] Erro ao responder pergunta:', error)
      setPanelNotice('Falha ao responder a solicitaÃ§Ã£o. Tente novamente.')
    }
  }

  const handleSavePix = () => {
    if (!pixDraft.trim()) {
      setPanelNotice('Informe uma chave PIX vÃ¡lida.')
      return
    }
    if (!pixBeneficiaryDraft.trim()) {
      setPanelNotice('Informe o nome do beneficiÃ¡rio da chave PIX.')
      return
    }
    setConsultantPixKey({
      consultantId: selectedConsultantId,
      pixKey: pixDraft.trim(),
      pixBeneficiaryName: pixBeneficiaryDraft.trim(),
    })
    setPixDraft('')
    setPixBeneficiaryDraft('')
    setPanelNotice('Chave PIX e beneficiÃ¡rio salvos com sucesso.')
  }

  const handleRequestWithdrawal = async () => {
    const amount = Number(withdrawAmount)
    if (!amount || amount <= 0) {
      setPanelNotice('Informe um valor de saque vÃ¡lido.')
      return
    }
    const result = await requestConsultantWithdrawal({ consultantId: selectedConsultantId, amount })
    setPanelNotice(result.message)
    if (result.ok) {
      setWithdrawAmount('')
    }
  }

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (!file.type.startsWith('image/')) {
      setPanelNotice('Selecione um arquivo de imagem vÃ¡lido.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setProfileDraft((prev) => {
        if (!prev) {
          return prev
        }
        return { ...prev, photo: String(reader.result ?? '') }
      })
      setPanelNotice('Imagem de perfil carregada. Clique em Salvar perfil para confirmar.')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleCurrencyInput = (setter, field) => (event) => {
    let value = event.target.value.replace(/\D/g, '')
    if (!value) value = '0'
    const num = parseInt(value, 10) / 100
    const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    setter((prev) => ({ ...prev, [field]: formatted }))
  }

  const parseCurrency = (value) => {
    if (typeof value === 'number') return value
    if (!value) return 0
    return Number(value.replace(/\./g, '').replace(',', '.'))
  }

  const handleSaveProfile = async () => {
    if (!selectedConsultantId || !profileDraft) {
      console.log('[handleSaveProfile] Missing data:', { selectedConsultantId, profileDraft })
      return
    }
    try {
      console.log('[handleSaveProfile] Starting save with:', { selectedConsultantId, persistConsultantWithResult })
      // Este Ã© auto-ediÃ§Ã£o se o consultor estÃ¡ editando seu prÃ³prio perfil
      const isSelfEdit = selectedConsultantId === userConsultantProfile?.id
      console.log('[handleSaveProfile] Is self edit:', isSelfEdit)
      
      const success = await persistConsultantWithResult(selectedConsultantId, {
        name: profileDraft.name.trim(),
        email: profileDraft.email.trim().toLowerCase(),
        tagline: profileDraft.tagline.trim(),
        description: profileDraft.description.trim(),
        photo: profileDraft.photo.trim(),
        pricePerMinute: parseCurrency(profileDraft.pricePerMinute),
        priceThreeQuestions: parseCurrency(profileDraft.priceThreeQuestions),
        priceFiveQuestions: parseCurrency(profileDraft.priceFiveQuestions),
      }, isSelfEdit)
      console.log('[handleSaveProfile] Result:', success)
      if (success) {
        setProfileNotice('Perfil do consultor atualizado com sucesso.')
      } else {
        setProfileNotice('Erro ao salvar perfil. Verifique sua conexÃ£o e tente novamente.')
      }
    } catch (err) {
      console.error('[handleSaveProfile] Error:', err)
      setProfileNotice('Erro ao salvar perfil: ' + err.message)
    }
  }

  const handleInstallPwa = async () => {
    const result = await promptPwaInstall()
    if (result.ok) {
      setPanelNotice('InstalaÃ§Ã£o iniciada com sucesso.')
      setConfirmResponseModal(null)
      setPwaInstallAvailable(false)
      return
    }

    if (result.reason === 'unavailable') {
      setPanelNotice('InstalaÃ§Ã£o indisponÃ­vel neste navegador agora. Use o menu do navegador para instalar o app.')
      return
    }

    setPanelNotice('A instalaÃ§Ã£o do app foi cancelada.')
  }

  const renderPendingRequestsList = () => (
    <div className="grid gap-3">
      {pendingRequests.length === 0 && (
        <p className="rounded-lg border border-mystic-gold/25 bg-black/30 p-3 text-sm text-ethereal-silver/80">
          VocÃª nÃ£o possui mensagens pendentes.
        </p>
      )}
      {pendingRequests.map((request) => (
        <article key={request.id} className="rounded-xl border border-mystic-gold/35 bg-black/30 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-amber-50">
              Cliente: {request.customerName} â€¢ Pacote {request.questionCount} perguntas
            </p>
            <span className="text-xs text-mystic-goldSoft">ComissÃ£o estimada: R$ {(request.packagePrice * 0.7).toFixed(2)}</span>
          </div>
          <div className="mt-2 text-xs text-amber-100/70">
            <p>Nascimento: {request.customerBirthDate || 'NÃ£o informado'} â€¢ Signo: {request.customerZodiac || 'NÃ£o informado'}</p>
          </div>
          <div className="mt-4 grid gap-4 border-t border-mystic-gold/20 pt-4">
            {request.entries.map((entry, index) => {
              const questionText =
                entry.question || entry.text || (entry.fileName ? `Ãudio: ${entry.fileName}` : 'Pergunta nÃ£o informada')
              return (
                <div key={index} className="grid gap-2">
                  <p className="text-sm text-amber-50">
                    <span className="font-bold text-mystic-goldSoft">P{index + 1}: </span>
                    {questionText}
                  </p>
                  <textarea
                    placeholder={`Digite a resposta para a Pergunta ${index + 1}...`}
                    value={responseDrafts[request.id]?.[index] ?? ''}
                    onChange={(event) =>
                      handleResponseChange(request.id, index, event.target.value)
                    }
                    className="min-h-[80px] w-full resize-y rounded-lg border border-mystic-gold/35 bg-black/35 p-3 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                void handleSubmitResponse(request.id)
              }}
              className="flex items-center gap-2 rounded-lg bg-mystic-gold/90 px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
            >
              <SendHorizontal size={16} />
              Enviar Resposta
            </button>
          </div>
        </article>
      ))}
    </div>
  )

  return (
    <PageShell
      title="Ãrea do Consultor"
      subtitle="Atendimentos de perguntas, vÃ­deo e carteira do consultor."
      mobileMenuFooter={<NotificationBadge className="border border-mystic-gold/45 bg-mystic-gold/10 text-mystic-goldSoft shadow-[0_0_20px_rgba(197,160,89,0.18)] hover:bg-mystic-gold/20" />}
    >
      {/* Notification Badge */}
      <div className="mb-6 hidden justify-end md:flex">
        <NotificationBadge className="bg-white/10 text-mystic-goldSoft hover:bg-white/20" />
      </div>

      {pendingVideoSessions.length > 0 && !isAdmin && (
        <GlassCard title="Chamadas de VÃ­deo Pendentes" subtitle="Clientes aguardando vocÃª entrar na sala.">
          <div className="grid gap-3">
            {pendingVideoSessions.map((session) => (
              <article key={session.id} className="flex items-center justify-between rounded-xl border border-mystic-gold/35 bg-black/30 p-4">
                <div>
                  <p className="text-sm text-amber-50">Cliente: <strong className="text-mystic-goldSoft">{session.userName}</strong></p>
                  <p className="text-xs text-ethereal-silver/80">{formatRelativeTime(session.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRejectModal(session)}
                    className="flex items-center gap-2 rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                  >
                    Recusar
                  </button>
                  <button
                    onClick={() => window.open(`/sala/${session.id}`, '_blank')}
                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
                  >
                    Entrar na Sala
                  </button>
                </div>
              </article>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Aviso se consultor estÃ¡ pendente */}
      {!isAdmin && selectedConsultant && (selectedConsultant.status === 'pending' || selectedConsultant.status === 'Pendente') && (
        <GlassCard title="Cadastro em AnÃ¡lise" subtitle="Seu cadastro estÃ¡ sendo revisado.">
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-center">
            <p className="mb-3 text-sm text-amber-100">Seu cadastro estÃ¡ pendente de aprovaÃ§Ã£o.</p>
            <p className="text-xs text-amber-100/70">VocÃª poderÃ¡ responder perguntas e fazer atendimentos assim que seu cadastro for aprovado pela equipe.</p>
          </div>
        </GlassCard>
      )}

      {/* Atendimento de Perguntas - Oculto se consultor pendente */}
      {canAnswerQuestions && (
        <GlassCard title="Atendimento de Perguntas" subtitle="Visualize e responda cada item enviado pelo cliente.">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <select
                value={selectedConsultantId}
                onChange={(event) => {
                  void handleSelectConsultant(event.target.value)
                }}
                className="rounded-lg border border-mystic-gold/45 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              >
                {consultants.map((consultant) => (
                  <option key={consultant.id} value={consultant.id}>
                    {consultant.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-lg border border-mystic-gold/45 bg-black/35 px-3 py-2 text-sm text-mystic-goldSoft">
                {selectedConsultant?.name}
              </span>
            )}
            <span className="text-xs text-ethereal-silver/80">
              Pendentes: {pendingRequests.length} â€¢ Respondidas: {answeredRequests.length}
            </span>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${isSelectedConsultantOnline ? 'text-emerald-400' : 'text-ethereal-silver/60'}`}>
                {isSelectedConsultantOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              <button
                onClick={() => {
                  void handleToggleAvailability()
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mystic-gold/60 focus:ring-offset-2 focus:ring-offset-black ${
                  isSelectedConsultantOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSelectedConsultantOnline ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          {isAdmin ? (
            renderPendingRequestsList()
          ) : (
            <div className="rounded-lg border border-mystic-gold/25 bg-black/30 p-3">
              {pendingRequests.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-amber-50">VocÃª tem perguntas para responder.</p>
                  <button
                    onClick={() => {
                      setQuestionInboxModalOpen(true)
                      setQuestionAlertVisible(false)
                    }}
                    className="rounded-lg bg-mystic-gold/90 px-4 py-2 text-xs font-bold text-black transition hover:brightness-110"
                  >
                    Responder Agora
                  </button>
                </div>
              ) : (
                <p className="text-sm text-ethereal-silver/80">VocÃª nÃ£o possui mensagens pendentes.</p>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {!isAdmin && canAnswerQuestions && (
        <GlassCard title="Pedidos de Magias" subtitle="Pedidos atribuÃ­dos a vocÃª com status, cliente e repasse lÃ­quido.">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-ethereal-silver/70">Compras aprovadas ou pendentes de validaÃ§Ã£o vinculadas ao seu perfil.</p>
            <button
              onClick={() => {
                void loadConsultantSpellOrders()
              }}
              disabled={spellOrdersLoading}
              className="rounded-lg border border-mystic-gold/45 bg-mystic-gold/10 px-3 py-1.5 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/20 disabled:opacity-40"
            >
              {spellOrdersLoading ? 'Atualizando...' : 'Atualizar pedidos'}
            </button>
          </div>

          <div className="grid gap-3">
            {spellOrdersLoading && consultantSpellOrders.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-mystic-gold/20 bg-black/30 p-4 text-sm text-ethereal-silver/70">
                <Loader2 size={16} className="animate-spin" />
                Carregando pedidos de magias...
              </div>
            ) : consultantSpellOrders.length === 0 ? (
              <p className="rounded-lg border border-mystic-gold/20 bg-black/30 p-4 text-sm text-ethereal-silver/70">
                Nenhum pedido de magia atribuÃ­do a vocÃª atÃ© agora.
              </p>
            ) : (
              consultantSpellOrders.map((order) => (
                <article key={order.id} className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles size={15} className="text-mystic-goldSoft" />
                        <p className="text-sm text-amber-50">{order.spellTitle}</p>
                      </div>
                      <p className="mt-1 text-xs text-amber-100/65">Cliente: {order.userName} â€¢ {order.userEmail}</p>
                      <p className="mt-1 text-[11px] text-ethereal-silver/55">Pedido criado em {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl text-mystic-goldSoft">R$ {Number(order.consultantNetValue).toFixed(2)}</p>
                      <p className="text-[11px] text-ethereal-silver/65">Repasse lÃ­quido</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-mystic-gold/25 bg-black/35 px-2 py-1 text-amber-100/75 uppercase tracking-wide">
                      {order.method}
                    </span>
                    <span className={`rounded-full px-2 py-1 uppercase tracking-wide ${
                      order.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : order.status === 'pending' || order.status === 'processing' || order.status === 'approved'
                          ? 'bg-amber-500/15 text-amber-200'
                          : 'bg-red-500/15 text-red-300'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-ethereal-silver/60">Valor bruto: R$ {Number(order.price).toFixed(2)}</span>
                    <span className="text-ethereal-silver/60">ComissÃ£o plataforma: R$ {Number(order.commissionValue).toFixed(2)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </GlassCard>
      )}

      {!isAdmin && canAnswerQuestions && (
        <GlassCard title="HistÃ³rico de Consulta" subtitle="Revise perguntas, respostas e atendimentos em vÃ­deo por cliente.">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-ethereal-silver/70">Os registros ficam agrupados por cliente para facilitar consultas recorrentes e acompanhamento.</p>
            <button
              onClick={() => {
                void loadConsultationHistory()
              }}
              disabled={consultationHistoryLoading}
              className="rounded-lg border border-mystic-gold/45 bg-mystic-gold/10 px-3 py-1.5 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/20 disabled:opacity-40"
            >
              {consultationHistoryLoading ? 'Atualizando...' : 'Atualizar histÃ³rico'}
            </button>
          </div>

          <div className="grid gap-4">
            {consultationHistoryLoading && consultationHistoryByCustomer.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-mystic-gold/20 bg-black/30 p-4 text-sm text-ethereal-silver/70">
                <Loader2 size={16} className="animate-spin" />
                Carregando histÃ³rico de consultas...
              </div>
            ) : consultationHistoryByCustomer.length === 0 ? (
              <p className="rounded-lg border border-mystic-gold/20 bg-black/30 p-4 text-sm text-ethereal-silver/70">
                Nenhum histÃ³rico encontrado para este consultor atÃ© o momento.
              </p>
            ) : (
              consultationHistoryByCustomer.map((customer) => {
                const isExpanded = historyExpandedCustomer === customer.customerKey
                return (
                  <article key={customer.customerKey} className="rounded-2xl border border-mystic-gold/30 bg-black/25 p-4">
                    <button
                      onClick={() => setHistoryExpandedCustomer(isExpanded ? null : customer.customerKey)}
                      className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-amber-50">{customer.customerName || 'Cliente nÃ£o identificado'}</p>
                        <p className="text-xs text-ethereal-silver/65">{customer.customerEmail || 'E-mail nÃ£o informado'}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-ethereal-silver/70">
                        <span className="inline-flex items-center gap-1 rounded-full border border-mystic-gold/20 bg-black/30 px-2 py-1">
                          <MessagesSquare size={12} className="text-mystic-goldSoft" />
                          {customer.questionRequests.length} pergunta(s)
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-mystic-gold/20 bg-black/30 px-2 py-1">
                          <Video size={12} className="text-mystic-goldSoft" />
                          {customer.videoSessions.length} vÃ­deo(s)
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-mystic-gold/20 bg-black/30 px-2 py-1">
                          <History size={12} className="text-mystic-goldSoft" />
                          Ãšltimo registro em {new Date(customer.latestAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <section className="rounded-xl border border-mystic-gold/20 bg-black/30 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <MessagesSquare size={16} className="text-mystic-goldSoft" />
                            <h4 className="text-sm font-semibold text-amber-50">Perguntas e Respostas</h4>
                          </div>
                          <div className="grid gap-3">
                            {customer.questionRequests.length === 0 ? (
                              <p className="text-sm text-ethereal-silver/65">Nenhuma pergunta registrada para este cliente.</p>
                            ) : (
                              customer.questionRequests.map((request) => (
                                <article key={request.id} className="rounded-xl border border-mystic-gold/15 bg-black/35 p-3">
                                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs text-ethereal-silver/60">{new Date(request.createdAt).toLocaleString('pt-BR')}</span>
                                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${
                                      request.status === 'answered'
                                        ? 'bg-emerald-500/15 text-emerald-300'
                                        : 'bg-amber-500/15 text-amber-200'
                                    }`}>
                                      {request.status === 'answered' ? 'Respondida' : 'Pendente'}
                                    </span>
                                  </div>
                                  <div className="grid gap-3">
                                    {(request.entries || []).map((entry, index) => (
                                      <div key={`${request.id}-${index}`} className="rounded-lg border border-white/8 bg-white/5 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mystic-goldSoft">Pergunta {index + 1}</p>
                                        <p className="mt-1 text-sm text-amber-50">{entry.question || entry.text || 'Pergunta sem descriÃ§Ã£o.'}</p>
                                        <div className="mt-2 rounded-lg border border-emerald-400/15 bg-emerald-500/5 p-3">
                                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Resposta</p>
                                          <p className="mt-1 whitespace-pre-wrap text-sm text-ethereal-silver/80">{entry.answer || 'Resposta ainda nÃ£o registrada.'}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </article>
                              ))
                            )}
                          </div>
                        </section>

                        <section className="rounded-xl border border-mystic-gold/20 bg-black/30 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <NotebookPen size={16} className="text-mystic-goldSoft" />
                            <h4 className="text-sm font-semibold text-amber-50">Consultas em VÃ­deo</h4>
                          </div>
                          <div className="grid gap-3">
                            {customer.videoSessions.length === 0 ? (
                              <p className="text-sm text-ethereal-silver/65">Nenhuma consulta em vÃ­deo registrada para este cliente.</p>
                            ) : (
                              customer.videoSessions.map((session) => (
                                <article key={session.id} className="rounded-xl border border-mystic-gold/15 bg-black/35 p-3">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm text-amber-50">Consulta finalizada em {new Date(session.finishedAt || session.startedAt || session.createdAt).toLocaleString('pt-BR')}</p>
                                      <p className="mt-1 text-xs text-ethereal-silver/65">DuraÃ§Ã£o: {formatDurationLabel(session.durationSeconds)} â€¢ Repasse: R$ {Number(session.consultantEarnings || 0).toFixed(2)}</p>
                                    </div>
                                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300">
                                      {session.status}
                                    </span>
                                  </div>

                                  <label className="mt-3 grid gap-2 text-xs text-amber-100/75">
                                    ObservaÃ§Ãµes do consultor
                                    <textarea
                                      rows={3}
                                      value={videoNotesDrafts[session.id] ?? ''}
                                      onChange={(event) => setVideoNotesDrafts((prev) => ({ ...prev, [session.id]: event.target.value }))}
                                      className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                                      placeholder="Escreva observaÃ§Ãµes internas sobre este atendimento."
                                    />
                                  </label>

                                  <div className="mt-3 flex justify-end">
                                    <button
                                      onClick={() => {
                                        void saveVideoConsultationNote(session.id)
                                      }}
                                      className="rounded-lg bg-mystic-gold/90 px-4 py-2 text-xs font-bold text-black transition hover:brightness-110"
                                    >
                                      Salvar observaÃ§Ã£o
                                    </button>
                                  </div>
                                </article>
                              ))
                            )}
                          </div>
                        </section>
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </div>
        </GlassCard>
      )}

      {!isAdmin && canAnswerQuestions && questionAlertVisible && pendingRequests.length > 0 && !questionInboxModalOpen && (
        <div className="fixed bottom-5 right-5 z-40 w-[calc(100%-2.5rem)] max-w-sm rounded-xl border border-mystic-gold/45 bg-[#1a1028]/95 p-4 shadow-[0_0_35px_rgba(197,160,89,0.22)] backdrop-blur-sm">
          <div className="mb-3 flex items-start gap-3">
            <BellRing size={18} className="text-mystic-goldSoft" />
            <div>
              <p className="text-sm font-semibold text-amber-50">VocÃª tem perguntas para responder</p>
              <p className="text-xs text-amber-100/70">HÃ¡ {pendingRequests.length} solicitaÃ§Ã£o(Ãµes) pendente(s).</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setQuestionInboxModalOpen(true)
                setQuestionAlertVisible(false)
              }}
              className="flex-1 rounded-lg bg-mystic-gold/90 px-3 py-2 text-xs font-bold text-black transition hover:brightness-110"
            >
              Responder Agora
            </button>
            <button
              onClick={() => setQuestionAlertVisible(false)}
              className="rounded-lg border border-mystic-gold/35 bg-black/30 px-3 py-2 text-xs text-amber-100/80 transition hover:bg-black/50"
            >
              Depois
            </button>
          </div>
        </div>
      )}

      {!isAdmin && questionInboxModalOpen && canAnswerQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[86vh] overflow-y-auto rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-display text-2xl text-mystic-goldSoft">Perguntas Pendentes</h3>
              <button
                onClick={() => setQuestionInboxModalOpen(false)}
                className="rounded-lg border border-mystic-gold/30 bg-black/40 px-3 py-2 text-xs text-amber-100/85 transition hover:bg-black/60"
              >
                Fechar
              </button>
            </div>
            {renderPendingRequestsList()}
          </div>
        </div>
      )}

      {/* Editar Meu Perfil - Oculto se consultor pendente */}
      {(isAdmin || !selectedConsultant || (selectedConsultant.status !== 'pending' && selectedConsultant.status !== 'Pendente')) && (
        <GlassCard title="Editar Meu Perfil" subtitle="Atualize dados pÃºblicos e preÃ§os do seu atendimento.">
        {profileDraft && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              Imagem de perfil
              <span className="text-[11px] text-ethereal-silver/65">Envie uma imagem do seu dispositivo para atualizar o card pÃºblico.</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              />
              <div className="mt-1 flex items-center gap-3 rounded-lg border border-mystic-gold/20 bg-black/30 p-2">
                <img
                  src={profileDraft.photo || selectedConsultant?.photo}
                  alt="PrÃ©via da foto do perfil"
                  className="h-14 w-14 rounded-full border border-mystic-gold/55 object-cover"
                />
                <p className="text-[11px] text-ethereal-silver/70">PrÃ©via da imagem exibida para clientes.</p>
              </div>
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              Nome pÃºblico
              <span className="text-[11px] text-ethereal-silver/65">Nome exibido para os clientes no card e perfil.</span>
              <input
                value={profileDraft.name}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Nome"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              E-mail de contato
              <span className="text-[11px] text-ethereal-silver/65">Usado para identificaÃ§Ã£o administrativa do consultor.</span>
              <input
                value={profileDraft.email}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="E-mail"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              Tagline do perfil
              <span className="text-[11px] text-ethereal-silver/65">Frase curta que aparece abaixo do seu nome.</span>
              <input
                value={profileDraft.tagline}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, tagline: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Tagline"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              DescriÃ§Ã£o completa
              <span className="text-[11px] text-ethereal-silver/65">Explique sua abordagem, especialidades e diferenciais.</span>
              <textarea
                rows={3}
                value={profileDraft.description}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, description: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="DescriÃ§Ã£o"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              PreÃ§o por minuto (R$)
              <span className="text-[11px] text-ethereal-silver/65">Valor cobrado no atendimento por vÃ­deo.</span>
              <input
                type="text"
                value={profileDraft.pricePerMinute}
                onChange={handleCurrencyInput(setProfileDraft, 'pricePerMinute')}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="0,00"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              Pacote 3 perguntas (R$)
              <span className="text-[11px] text-ethereal-silver/65">Valor fechado para responder 3 perguntas.</span>
              <input
                type="text"
                value={profileDraft.priceThreeQuestions}
                onChange={handleCurrencyInput(setProfileDraft, 'priceThreeQuestions')}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="0,00"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              Pacote 5 perguntas (R$)
              <span className="text-[11px] text-ethereal-silver/65">Valor fechado para responder 5 perguntas.</span>
              <input
                type="text"
                value={profileDraft.priceFiveQuestions}
                onChange={handleCurrencyInput(setProfileDraft, 'priceFiveQuestions')}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="0,00"
              />
            </label>
            <button
              onClick={handleSaveProfile}
              className="rounded-lg border border-mystic-gold/70 bg-mystic-gold/15 px-3 py-2 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/25 md:col-span-2"
            >
              Salvar perfil
            </button>            {profileNotice && (
              <p className="mt-3 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 md:col-span-2">
                {profileNotice}
              </p>
            )}          </div>
        )}
        </GlassCard>
      )}

      <GlassCard title="Carteira do Consultor" subtitle="Controle de ganhos, PIX e solicitaÃ§Ã£o de saque.">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ethereal-silver/70">Saldo disponÃ­vel</p>
            <p className="mt-2 font-display text-3xl text-mystic-goldSoft">
              R$ {wallet.availableBalance.toFixed(2)}
            </p>
          </article>
          <article className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ethereal-silver/70">Ganhos filtrados</p>
            <p className="mt-2 font-display text-3xl text-mystic-goldSoft">R$ {filteredEarnings.toFixed(2)}</p>
          </article>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-sm text-ethereal-silver/85">Adicionar chave PIX para recebimento</p>
            <input
              value={pixDraft}
              onChange={(event) => setPixDraft(event.target.value)}
              placeholder={wallet.pixKey ? `Atual: ${wallet.pixKey}` : 'Digite a chave PIX'}
              className="mt-2 w-full rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
            <input
              value={pixBeneficiaryDraft}
              onChange={(event) => setPixBeneficiaryDraft(event.target.value)}
              placeholder={wallet.pixBeneficiaryName ? `BeneficiÃ¡rio atual: ${wallet.pixBeneficiaryName}` : 'Nome do beneficiÃ¡rio'}
              className="mt-2 w-full rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
            <button
              onClick={handleSavePix}
              className="mt-2 rounded-lg border border-mystic-gold/60 px-3 py-2 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/10"
            >
              Salvar chave Pix e beneficiÃ¡rio
            </button>
            {(wallet.pixKey || wallet.pixBeneficiaryName) && (
              <p className="mt-2 text-[11px] text-amber-100/60">
                Chave atual: {wallet.pixKey || 'nÃ£o informada'} | BeneficiÃ¡rio: {wallet.pixBeneficiaryName || 'nÃ£o informado'}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-sm text-ethereal-silver/85">Solicitar saque</p>
            <input
              type="number"
              min={minWithdrawalAmount}
              step="0.5"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              placeholder={`MÃ­nimo R$ ${minWithdrawalAmount.toFixed(2)}`}
              className="mt-2 w-full rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
            <button
              onClick={handleRequestWithdrawal}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-mystic-gold/70 bg-mystic-gold/15 px-3 py-2 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/25"
            >
              <Wallet size={14} />
              Solicitar saque
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {['total', 'daily', 'weekly', 'monthly'].map((filter) => (
            <button
              key={filter}
              onClick={() => setGainFilter(filter)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                gainFilter === filter
                  ? 'border-mystic-gold/70 bg-mystic-gold/20 text-mystic-goldSoft'
                  : 'border-mystic-gold/35 text-ethereal-silver/80 hover:bg-mystic-gold/10'
              }`}
            >
              {filter === 'total' && 'Total'}
              {filter === 'daily' && 'DiÃ¡rio'}
              {filter === 'weekly' && 'Semanal'}
              {filter === 'monthly' && 'Mensal'}
            </button>
          ))}
        </div>

        {panelNotice && (
          <p className="mt-4 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {panelNotice}
          </p>
        )}

        {/* Separador e Extrato de MovimentaÃ§Ãµes */}
        <div className="mt-8 border-t border-mystic-gold/20 pt-6">
          <h3 className="mb-4 font-display text-lg text-mystic-goldSoft">Extrato de MovimentaÃ§Ãµes</h3>
          {userConsultantProfile && (
            <WalletStatement
              consultantId={userConsultantProfile.id}
              token={token}
            />
          )}
        </div>

        {/* BotÃ£o Instalar App */}
        <div className="mt-6 rounded-lg border border-mystic-gold/30 bg-black/30 p-4 text-center">
          <p className="mb-3 text-sm text-amber-100/80">
            Para melhor receber notificaÃ§Ãµes de novas chamadas instale nosso aplicativo.
          </p>
          <button
            onClick={() => setConfirmResponseModal({ isInstallPrompt: true })}
            className="rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 px-6 py-2 font-bold text-black transition hover:brightness-110"
          >
            Instalar App
          </button>
        </div>

      </GlassCard>

      {/* Modal ConfirmaÃ§Ã£o Resposta */}
      {confirmResponseModal && !confirmResponseModal.isInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <h3 className="mb-4 font-display text-2xl text-mystic-goldSoft">Revisar Respostas</h3>
            <div className="mb-6 grid gap-3 rounded-lg border border-mystic-gold/30 bg-black/30 p-4">
              {confirmResponseModal.request?.entries.map((entry, index) => {
                const questionText =
                  entry.question || entry.text || (entry.fileName ? `Ãudio: ${entry.fileName}` : 'Pergunta nÃ£o informada')
                const answerText = (confirmResponseModal.drafts[index] ?? '').trim()
                return (
                  <div key={index} className="border-b border-mystic-gold/20 pb-3 last:border-b-0">
                    <p className="mb-2 text-sm text-mystic-goldSoft">
                      <span className="font-bold">Pergunta {index + 1}:</span> {questionText}
                    </p>
                    <p className="mb-2 text-xs text-amber-100/70">
                      <span className="font-semibold">Sua resposta:</span>
                    </p>
                    <p className="rounded bg-black/40 p-2 text-sm text-amber-50 text-left">{answerText || '[Sem resposta]'}</p>
                  </div>
                )
              })}
            </div>
            <p className="mb-4 text-xs text-amber-100/60">
              Se desejar editar, cancele e modifique acima. Clique em Confirmar para enviar.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmAndSendResponse}
                className="w-full rounded-lg bg-emerald-600/90 py-3 font-bold text-white transition hover:bg-emerald-500"
              >
                Confirmar e Enviar
              </button>
              <button
                onClick={() => setConfirmResponseModal(null)}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                Voltar e Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Instalar App */}
      {confirmResponseModal?.isInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <h3 className="mb-4 text-center font-display text-2xl text-mystic-goldSoft">
              Instalar Aplicativo
            </h3>
            <p className="mb-6 text-center text-sm text-amber-100/80">
              Escolha o seu dispositivo para instalar e receber notificaÃ§Ãµes em tempo real:
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (/iPhone|iPad|iOS/.test(navigator.userAgent)) {
                    setPanelNotice('No iPhone/iPad, use Compartilhar > Adicionar Ã  Tela de InÃ­cio para instalar o app.')
                    setConfirmResponseModal(null)
                    return
                  }

                  void handleInstallPwa()
                }}
                className="rounded-lg bg-blue-600/90 py-3 font-bold text-white transition hover:bg-blue-500"
              >
                ðŸ“± Instalar PWA
              </button>
              <button
                onClick={() => {
                  setPanelNotice('Se a instalaÃ§Ã£o nÃ£o abrir automaticamente, use o menu do navegador e escolha Instalar aplicativo.')
                  void handleInstallPwa()
                }}
                className="rounded-lg bg-green-600/90 py-3 font-bold text-white transition hover:bg-green-500"
                disabled={!pwaInstallAvailable}
              >
                ðŸ¤– Android / Desktop
              </button>
              <button
                onClick={() => setConfirmResponseModal(null)}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                Depois
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <div className="mb-4 flex items-center justify-center text-amber-400">
              <XCircle size={48} />
            </div>
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">
              Recusar chamada?
            </h3>
            <p className="mb-6 text-center text-amber-100/80">
              Tem certeza que deseja recusar a chamada de <strong>{rejectModal.userName}</strong>? O cliente serÃ¡ notificado.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleRejectVideoCall(rejectModal.id)}
                className="w-full rounded-lg bg-red-600/90 py-3 font-bold text-white transition hover:bg-red-500"
              >
                Sim, recusar
              </button>
              <button
                onClick={() => setRejectModal(null)}
                className="w-full rounded-lg border border-mystic-gold/30 bg-black/40 py-3 font-medium text-amber-50 transition hover:bg-black/60"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Status Pendente */}
      {pendingStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/90 p-6 shadow-[0_0_40px_rgba(197,160,89,0.2)]">
            <h3 className="mb-2 text-center font-display text-2xl text-mystic-goldSoft">
              Cadastro Pendente
            </h3>
            <p className="mb-6 text-center text-sm text-amber-100/80">
              Seu cadastro estÃ¡ pendente de aprovaÃ§Ã£o pela equipe.
            </p>
            <p className="mb-6 text-center text-xs text-amber-100/70">
              VocÃª poderÃ¡ fazer atendimentos assim que seu cadastro for analisado e aprovado.
            </p>
            <button
              onClick={() => setPendingStatusModal(false)}
              className="w-full rounded-lg bg-mystic-gold/90 px-4 py-3 font-bold text-black transition hover:brightness-110"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </PageShell>
  )
}

