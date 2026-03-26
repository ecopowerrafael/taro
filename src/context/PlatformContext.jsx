import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getZodiacSign } from '../utils/zodiac'
import { useBilling } from '../hooks/useBilling'
import { createRechargePreference } from '../services/mercadoPagoMock'
import { PlatformContext } from './platform-context'

const horoscopeBySign = {
  Áries: 'Hoje é dia de liderança intuitiva e decisões rápidas.',
  Touro: 'Seu poder está na constância e no foco em prosperidade.',
  Gêmeos: 'Conversas estratégicas trarão boas oportunidades.',
  Câncer: 'Escute sua sensibilidade para proteger o que importa.',
  Leão: 'Sua presença magnética abre portas profissionais.',
  Virgem: 'A organização emocional destrava um novo ciclo.',
  Libra: 'Parcerias harmoniosas elevam sua energia.',
  Escorpião: 'Transformações profundas trazem ganhos concretos.',
  Sagitário: 'Expansão espiritual e coragem caminham juntos.',
  Capricórnio: 'Disciplina com propósito gera crescimento sustentável.',
  Aquário: 'Inovação e visão de futuro serão diferenciais.',
  Peixes: 'Sua intuição está afiada para escolhas certeiras.',
}

const initialConsultants = [
  {
    id: 'c1',
    name: 'Aurora Luz',
    email: 'aurora@taro.com',
    tagline: 'Leio energias de amor com objetividade.',
    description: 'Especialista em Tarot terapêutico, relações e alinhamento emocional.',
    status: 'Online',
    pricePerMinute: 8.5,
    priceThreeQuestions: 24,
    priceFiveQuestions: 36,
    createdAt: '2026-02-10',
    baseConsultations: 16,
    realSessions: 11,
    ratingAverage: 4.9,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=320&auto=format&fit=crop',
    commissionOverride: null,
  },
  {
    id: 'c2',
    name: 'Noah Arcano',
    email: 'noah@taro.com',
    tagline: 'Mapeio ciclos profissionais e financeiros.',
    description: 'Consultas com foco em carreira, propósito e planejamento estratégico.',
    status: 'Ocupado',
    pricePerMinute: 12,
    priceThreeQuestions: 32,
    priceFiveQuestions: 47,
    createdAt: '2026-01-28',
    baseConsultations: 9,
    realSessions: 6,
    ratingAverage: 4.8,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=320&auto=format&fit=crop',
    commissionOverride: 25,
  },
  {
    id: 'c3',
    name: 'Maya Estelar',
    email: 'maya@taro.com',
    tagline: 'Direcionamento espiritual com clareza prática.',
    description: 'Atendimento para decisões de vida, espiritualidade e desbloqueios.',
    status: 'Online',
    pricePerMinute: 9.75,
    priceThreeQuestions: 28,
    priceFiveQuestions: 41,
    createdAt: '2026-03-02',
    baseConsultations: 12,
    realSessions: 8,
    ratingAverage: 4.7,
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=320&auto=format&fit=crop',
    commissionOverride: null,
  },
]

const initialPendingConsultants = [
  {
    id: 'pending_1',
    name: 'Flaviany Oliveira Freitas',
    email: 'flavianyfreitas52@gmail.com',
    pricePerMinute: 5,
    priceThreeQuestions: 14,
    priceFiveQuestions: 22,
    createdAt: '2026-03-22',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=320&auto=format&fit=crop',
  },
]

const initialMinutePackages = [
  { id: 'p1', minutes: 10, price: 50, promoPrice: null, isFeatured: false },
  { id: 'p2', minutes: 30, price: 135, promoPrice: 119, isFeatured: true },
  { id: 'p3', minutes: 60, price: 240, promoPrice: null, isFeatured: false },
]

const MIN_WITHDRAWAL_AMOUNT = 50

const initialConsultantWallets = initialConsultants.reduce((acc, consultant) => {
  acc[consultant.id] = {
    availableBalance: 0,
    pixKey: '',
    transactions: [],
    withdrawals: [],
  }
  return acc
}, {})

const adminDashboardStats = {
  totalBilled: 215,
  totalCommission: 43,
  consultantEarnings: 172,
  todayRevenue: 0,
  todayCommission: 0,
  monthRevenue: 0,
  monthCommission: 0,
  totalSessions: 44,
  totalUsers: 18,
  astrologersCount: 10,
  clientsCount: 8,
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

const buildApiUrl = (resource) => {
  if (!API_BASE_URL) {
    return resource
  }
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  const path = resource.startsWith('/') ? resource : `/${resource}`
  return `${base}${path}`
}

const normalizeConsultant = (consultant) => ({
  ...consultant,
  pricePerMinute: Number(consultant.pricePerMinute) || 0,
  priceThreeQuestions: Number(consultant.priceThreeQuestions) || 0,
  priceFiveQuestions: Number(consultant.priceFiveQuestions) || 0,
  baseConsultations: Number(consultant.baseConsultations) || 0,
  realSessions: Number(consultant.realSessions) || 0,
  ratingAverage: Number(consultant.ratingAverage) || 0,
  commissionOverride:
    consultant.commissionOverride === null || consultant.commissionOverride === undefined
      ? null
      : Number(consultant.commissionOverride) || null,
})

const normalizeQuestionRequest = (request) => ({
  ...request,
  questionCount: Number(request.questionCount) || 0,
  packagePrice: Number(request.packagePrice) || 0,
  commissionValue: Number(request.commissionValue) || 0,
  consultantNetValue: Number(request.consultantNetValue) || 0,
  entries: (Array.isArray(request.entries) ? request.entries : []).map((entry) => ({
    ...entry,
    question:
      entry?.question ??
      entry?.text ??
      (entry?.fileName ? `Áudio: ${entry.fileName}` : 'Pergunta não informada'),
  })),
  answerSummary: request.answerSummary ?? '',
})

const normalizeWalletState = (walletRows, fallback = {}) => {
  const next = { ...fallback }
  walletRows.forEach((wallet) => {
    next[wallet.consultantId] = {
      availableBalance: Number(wallet.availableBalance) || 0,
      pixKey: wallet.pixKey ?? '',
      transactions: Array.isArray(wallet.transactions)
        ? wallet.transactions.map((transaction) => ({
            ...transaction,
            amount: Number(transaction.amount) || 0,
            commissionValue:
              transaction.commissionValue === null || transaction.commissionValue === undefined
                ? null
                : Number(transaction.commissionValue) || 0,
          }))
        : [],
      withdrawals: Array.isArray(wallet.withdrawals)
        ? wallet.withdrawals.map((withdrawal) => ({
            ...withdrawal,
            amount: Number(withdrawal.amount) || 0,
          }))
        : [],
    }
  })
  return next
}

export function PlatformProvider({ children }) {
  const {
    user: profile,
    token,
    loading: authLoading,
    login,
    register,
    registerConsultant,
    logout,
    updateProfile,
    rechargeMinutes,
    debitMinutes: debitMinutesFromAuth,
    isAuthenticated,
    isAdmin,
    isConsultant,
  } = useAuth()

  const sign = useMemo(() => getZodiacSign(profile?.birthDate) ?? null, [profile?.birthDate])

  const dailyHoroscope = sign
    ? horoscopeBySign[sign]
    : 'Finalize seu cadastro para receber seu horóscopo diário.'

  const [consultants, setConsultants] = useState(initialConsultants)
  const [pendingConsultants, setPendingConsultants] = useState(initialPendingConsultants)
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [selectedConsultant, setSelectedConsultant] = useState(null)
  const [globalCommission, setGlobalCommission] = useState(30)
  const [minutePackages, setMinutePackages] = useState(initialMinutePackages)
  const [mpCredentials, setMpCredentialsState] = useState({
    publicKey: '',
    accessToken: '',
    webhookSecret: '',
    pixKey: '',
    pixReceiverName: '',
    pixReceiverCity: '',
  })
  const [dailyCredentials, setDailyCredentialsState] = useState({
    apiKey: '',
    domain: 'demo.daily.co',
    roomName: 'hello',
  })
  const [questionRequests, setQuestionRequests] = useState([])
  const [videoSessions, setVideoSessions] = useState([])
  const [consultantWallets, setConsultantWallets] = useState(initialConsultantWallets)
  const [paymentResult, setPaymentResult] = useState(null)
  const [systemNotice, setSystemNotice] = useState('')
  const mpCredentialsRef = useRef(mpCredentials)
  const dailyCredentialsRef = useRef(dailyCredentials)

  const minutesBalance = profile?.minutesBalance || 0

  const userConsultantProfile = useMemo(() => {
    if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) {
      return null
    }
    return consultants.find((c) => c.userId === profile.id || c.email === profile.email)
  }, [profile, consultants])

  // Registra Service Worker e Push Subscription.
  const registerPushSubscription = async (userId) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      const publicVapidKeyRes = await fetch('/api/push/public-key')
      const publicVapidKey = await publicVapidKeyRes.text()

      // Convert VAPID key to Uint8Array
      const padding = '='.repeat((4 - publicVapidKey.length % 4) % 4)
      const base64 = (publicVapidKey + padding).replace(/-/g, '+').replace(/_/g, '/')
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription, userId }),
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (e) {
      console.error('Erro ao registrar Push:', e)
    }
  }

  useEffect(() => {
    if (profile?.id) {
      registerPushSubscription(profile.id)
    }
  }, [profile?.id])

  const debitMinutes = async (minutes) => {
    const result = await debitMinutesFromAuth(minutes)
    if (!result.ok) {
      setSystemNotice(result.message || 'Erro ao debitar minutos.')
      return false
    }
    return true
  }

  const creditMinutes = async (minutes) => {
    // In a real app, this would be an API call
    console.log(`Creditando ${minutes} minutos`)
  }

  const ensureWalletsForConsultants = (consultantList) => {
    setConsultantWallets((prev) => {
      let changed = false
      const next = { ...prev }
      consultantList.forEach((consultant) => {
        if (!next[consultant.id]) {
          changed = true
          next[consultant.id] = {
            availableBalance: 0,
            pixKey: '',
            transactions: [],
            withdrawals: [],
          }
        }
      })
      return changed ? next : prev
    })
  }

  const billing = useBilling({
    balanceMinutes: minutesBalance,
    onConsume: debitMinutes,
    onInsufficientBalance: () => {
      setSystemNotice('Saldo insuficiente. A chamada foi encerrada automaticamente.')
    },
  })

  const roomUrl = useMemo(() => {
    const domain = (dailyCredentials.domain || '').trim() || 'demo.daily.co'
    const roomName = (dailyCredentials.roomName || '').trim() || 'hello'
    return `https://${domain}/${roomName}`
  }, [dailyCredentials.domain, dailyCredentials.roomName])

  useEffect(() => {
    mpCredentialsRef.current = mpCredentials
  }, [mpCredentials])

  useEffect(() => {
    dailyCredentialsRef.current = dailyCredentials
  }, [dailyCredentials])

  const persistCredentialsOnApi = async (nextMpCredentials, nextDailyCredentials) => {
    const response = await fetch(buildApiUrl('/api/credentials'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mpCredentials: nextMpCredentials,
        dailyCredentials: nextDailyCredentials,
      }),
    })
    return response.ok
  }

  const setMpCredentials = (updater) => {
    setMpCredentialsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const normalized = {
        publicKey: next?.publicKey ?? next?.mpPublicKey ?? '',
        accessToken: next?.accessToken ?? next?.mpAccessToken ?? '',
        webhookSecret: next?.webhookSecret ?? next?.mpWebhookSecret ?? '',
        pixKey: next?.pixKey ?? '',
        pixReceiverName: next?.pixReceiverName ?? '',
        pixReceiverCity: next?.pixReceiverCity ?? '',
      }
      mpCredentialsRef.current = normalized
      return normalized
    })
  }

  const setDailyCredentials = (updater) => {
    setDailyCredentialsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const normalized = {
        apiKey: next?.apiKey ?? next?.dailyApiKey ?? '',
        domain: next?.domain ?? next?.dailyDomain ?? 'demo.daily.co',
        roomName: next?.roomName ?? next?.dailyRoomName ?? 'hello',
      }
      dailyCredentialsRef.current = normalized
      return normalized
    })
  }

  const savePlatformCredentials = async (type, data) => {
    try {
      const response = await fetch(buildApiUrl('/api/credentials'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        // Atualiza o estado local dependendo do tipo
        if (type === 'mp') setMpCredentialsState((prev) => ({ ...prev, ...data }))
        if (type === 'daily') setDailyCredentialsState((prev) => ({ ...prev, ...data }))
        if (type === 'pix') setMpCredentialsState((prev) => ({ ...prev, ...data }))
        setSystemNotice('Configurações salvas com sucesso.')
        return { ok: true }
      } else {
        const errData = await response.json().catch(() => ({ message: 'Resposta inválida do servidor (HTML ou Vazio)' }))
        const errorMsg = errData.message || 'Erro ao salvar credenciais.'
        console.error('[PlatformContext] Erro no salvamento:', errData)
        alert(`Falha no salvamento: ${errorMsg}\n\nDetalhes: ${JSON.stringify(errData, null, 2)}`)
        setSystemNotice(errorMsg)
        return { ok: false }
      }
    } catch (error) {
      console.error('[PlatformContext] Erro fatal no salvamento:', error)
      alert(`Erro crítico de conexão ou script:\n${error.message}`)
      setSystemNotice('Erro de conexão ao salvar.')
      return { ok: false }
    }
  }

  const [rechargeRequests, setRechargeRequests] = useState([])

  const fetchPendingRecharges = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/recharges/pending'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setRechargeRequests(data)
      }
    } catch (error) {
      console.error('Erro ao buscar recargas:', error)
    }
  }

  const requestRecharge = async (amount, minutes, method) => {
    try {
      const response = await fetch(buildApiUrl('/api/recharges/request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, minutes, method }),
      })
      return response.ok
    } catch (error) {
      console.error('Erro ao solicitar recarga:', error)
      return false
    }
  }

  const processRechargeAction = async (requestId, action) => {
    try {
      const response = await fetch(buildApiUrl(`/api/recharges/${requestId}/action`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })
      if (response.ok) {
        fetchPendingRecharges()
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao processar recarga:', error)
      return false
    }
  }

  const upsertConsultantOnApi = async (consultant) => {
    const response = await fetch(buildApiUrl(`/api/consultants/${consultant.id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(consultant),
    })
    return response.ok
  }

  const persistConsultant = async (consultant) => {
    try {
      const ok = await upsertConsultantOnApi(consultant)
      if (!ok) {
        setSystemNotice('Não foi possível salvar alterações do consultor no backend.')
      }
    } catch {
      setSystemNotice('Falha de conexão ao salvar dados do consultor.')
    }
  }

  const persistConsultantStatus = async (id, status) => {
    try {
      const response = await fetch(buildApiUrl(`/api/consultants/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        setSystemNotice('Não foi possível sincronizar o status do consultor no backend.')
      }
    } catch {
      setSystemNotice('Falha de conexão ao atualizar status do consultor.')
    }
  }

  const createQuestionRequestOnApi = async (request) => {
    const response = await fetch(buildApiUrl('/api/question-requests'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error('Falha ao registrar solicitação de perguntas no backend.')
    }
    const payload = await response.json()
    return normalizeQuestionRequest(payload)
  }

  const answerQuestionRequestOnApi = async ({ requestId, consultantId, answerSummary, commissionRate }) => {
    const response = await fetch(buildApiUrl(`/api/question-requests/${requestId}/answer`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consultantId,
        answerSummary,
        commissionRate,
      }),
    })
    if (!response.ok) {
      throw new Error('Falha ao concluir resposta no backend.')
    }
    const payload = await response.json()
    return {
      request: normalizeQuestionRequest(payload.request),
      wallet: normalizeWalletState([payload.wallet])[payload.wallet.consultantId],
    }
  }

  const savePixKeyOnApi = async ({ consultantId, pixKey }) => {
    const response = await fetch(buildApiUrl(`/api/wallets/${consultantId}/pix-key`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pixKey }),
    })
    if (!response.ok) {
      throw new Error('Falha ao salvar chave PIX no backend.')
    }
  }

  const requestWithdrawalOnApi = async ({ consultantId, amount }) => {
    const response = await fetch(buildApiUrl(`/api/wallets/${consultantId}/withdrawals`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, status: 'requested' }),
    })
    const payload = await response.json()
    if (!response.ok) {
      return { ok: false, message: payload.message || 'Falha ao solicitar saque.' }
    }
    return {
      ok: true,
      message: payload.message || 'Solicitação de saque registrada com sucesso.',
      wallet: normalizeWalletState([payload.wallet])[payload.wallet.consultantId],
    }
  }

  useEffect(() => {
    const loadConsultants = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/consultants'))
        if (!response.ok) {
          return
        }
        const payload = await response.json()
        if (!Array.isArray(payload)) {
          return
        }
        if (payload.length === 0) {
          ensureWalletsForConsultants(initialConsultants)
          await Promise.all(initialConsultants.map((consultant) => upsertConsultantOnApi(consultant)))
          return
        }
        const normalized = payload.map(normalizeConsultant)
        setConsultants(normalized)
        ensureWalletsForConsultants(normalized)
      } catch {
        return
      }
    }
    void loadConsultants()
  }, [])

  useEffect(() => {
    const loadCredentials = async () => {
      if (!token) return
      try {
        const response = await fetch(buildApiUrl('/api/credentials'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (!response.ok) {
          return
        }
        const payload = await response.json()
        const mp = {
          publicKey: payload?.mpPublicKey ?? '',
          accessToken: payload?.mpAccessToken ?? '',
          webhookSecret: payload?.mpWebhookSecret ?? '',
          pixKey: payload?.pixKey ?? '',
          pixReceiverName: payload?.pixReceiverName ?? '',
          pixReceiverCity: payload?.pixReceiverCity ?? '',
        }
        const daily = {
          apiKey: payload?.dailyApiKey ?? '',
          domain: payload?.dailyDomain ?? 'demo.daily.co',
          roomName: payload?.dailyRoomName ?? 'hello',
        }
        mpCredentialsRef.current = mp
        dailyCredentialsRef.current = daily
        setMpCredentialsState(mp)
        setDailyCredentialsState(daily)
      } catch {
        return
      }
    }
    void loadCredentials()
  }, [token])

  useEffect(() => {
    const loadQuestionRequests = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/question-requests'))
        if (!response.ok) {
          return
        }
        const payload = await response.json()
        if (!Array.isArray(payload)) {
          return
        }
        setQuestionRequests(payload.map(normalizeQuestionRequest))
      } catch {
        return
      }
    }

    const loadWallets = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/wallets'))
        if (!response.ok) {
          return
        }
        const payload = await response.json()
        if (!Array.isArray(payload)) {
          return
        }
        setConsultantWallets((prev) => normalizeWalletState(payload, prev))
      } catch {
        return
      }
    }

    void loadQuestionRequests()
    void loadWallets()
  }, [])

  const selectConsultant = (consultant) => {
    setSelectedConsultant(consultant)
    setSystemNotice(`Consultor selecionado: ${consultant.name}. Clique em Conectar para iniciar.`)
  }

  const connectSession = () => {
    if (!selectedConsultant) {
      setSystemNotice('Selecione um consultor antes de conectar.')
      return
    }
    setSystemNotice('')
    const started = billing.startSession({
      consultantId: selectedConsultant.id,
      consultantName: selectedConsultant.name,
      pricePerMinute: selectedConsultant.pricePerMinute,
    })

    if (!started) {
      setSystemNotice('Recarregue minutos antes de iniciar uma consulta.')
    }
  }

  const disconnectSession = () => {
    billing.stopSession()
  }

  const approveConsultant = (id) => {
    let consultantToPersist = null
    setConsultants((prev) => {
      const exists = prev.some((consultant) => consultant.id === id)
      if (exists) {
        return prev.map((consultant) => {
          if (consultant.id === id) {
            consultantToPersist = { ...consultant, status: 'Online' }
            return consultantToPersist
          }
          return consultant
        })
      }

      const pending = pendingConsultants.find((consultant) => consultant.id === id)
      if (!pending) {
        return prev
      }

      const approvedConsultant = {
        ...pending,
        status: 'Online',
        tagline: 'Novo consultor aprovado pela plataforma.',
        description: 'Consultor recém aprovado e disponível para atendimentos.',
        baseConsultations: 0,
        realSessions: 0,
        ratingAverage: 5,
        commissionOverride: null,
      }
      consultantToPersist = approvedConsultant

      return [approvedConsultant, ...prev]
    })

    setPendingConsultants((prev) => prev.filter((consultant) => consultant.id !== id))
    setConsultantWallets((prev) => {
      if (prev[id]) {
        return prev
      }
      return {
        ...prev,
        [id]: {
          availableBalance: 0,
          pixKey: '',
          transactions: [],
          withdrawals: [],
        },
      }
    })
    if (consultantToPersist) {
      void persistConsultant(consultantToPersist)
    }
  }

  const blockConsultant = (id) => {
    void persistConsultantStatus(id, 'Ocupado')
    setConsultants((prev) =>
      prev.map((consultant) => (consultant.id === id ? { ...consultant, status: 'Ocupado' } : consultant)),
    )
  }

  const editConsultant = (id) => {
    setConsultants((prev) =>
      prev.map((consultant) =>
        consultant.id === id
          ? {
              ...consultant,
              commissionOverride: consultant.commissionOverride === null ? globalCommission : null,
            }
          : consultant,
      ),
    )
  }

  const updateConsultantByAdmin = (id, updates) => {
    let updatedConsultant = null
    setConsultants((prev) =>
      prev.map((consultant) => {
        if (consultant.id === id) {
          updatedConsultant = normalizeConsultant({ ...consultant, ...updates })
          return updatedConsultant
        }
        return consultant
      }),
    )
    if (updatedConsultant) {
      void persistConsultant(updatedConsultant)
    }
  }

  const updateConsultantAvailability = (id, isOnline) => {
    const nextStatus = isOnline ? 'Online' : 'Offline'
    void persistConsultantStatus(id, nextStatus)
    setConsultants((prev) =>
      prev.map((consultant) =>
        consultant.id === id
          ? { ...consultant, status: nextStatus }
          : consultant,
      ),
    )
  }

  const updateConsultantBaseConsultations = (id, value) => {
    const normalized = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
    let updatedConsultant = null
    setConsultants((prev) =>
      prev.map((consultant) => {
        if (consultant.id === id) {
          updatedConsultant = { ...consultant, baseConsultations: normalized }
          return updatedConsultant
        }
        return consultant
      }),
    )
    if (updatedConsultant) {
      void persistConsultant(updatedConsultant)
    }
  }

  const rechargePackage = async (pack) => {
    const amount = pack.promoPrice ?? pack.price
    /* 
    // Removendo o mock do Mercado Pago para teste direto
    const response = await createRechargePreference({
      packageId: pack.id,
      minutes: pack.minutes,
      amount,
      customerEmail: profile?.email ?? 'guest@taro.com',
    })
    setPaymentResult(response)
    */
    
    // Chamada real para atualizar o saldo no banco de dados
    const result = await rechargeMinutes(pack.minutes)
    
    if (result.ok) {
      setSystemNotice(`Recarga confirmada: +${pack.minutes} minutos por R$ ${amount.toFixed(2)}.`)
    } else {
      setSystemNotice(result.message || 'Erro ao processar recarga.')
    }
  }

  const updateMinutePackage = (id, updates) => {
    setMinutePackages((prev) =>
      prev.map((pack) => (pack.id === id ? { ...pack, ...updates } : pack)),
    )
  }

  const setFeaturedPackage = (id) => {
    setMinutePackages((prev) =>
      prev.map((pack) => ({ ...pack, isFeatured: pack.id === id })),
    )
  }

  const submitQuestionConsultation = async ({ consultant, questionCount, price, entries }) => {
    const payload = entries.map((entry, index) => ({
      id: `${Date.now()}_${index}`,
      type: entry.type,
      text: entry.text ?? '',
      question:
        entry?.question ??
        entry?.text ??
        (entry?.file?.name ? `Áudio: ${entry.file.name}` : ''),
      fileName: entry.file?.name ?? '',
      durationSeconds: entry.durationSeconds ?? 0,
    }))

    const request = {
      id: `req_${consultant.id}_${Date.now()}`,
      consultantId: consultant.id,
      consultantName: consultant.name,
      customerName: profile?.name ?? 'Cliente',
      customerEmail: profile?.email ?? 'guest@taro.com',
      questionCount,
      packagePrice: price,
      entries: payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
      answeredAt: null,
      answerSummary: '',
      commissionValue: 0,
      consultantNetValue: 0,
    }

    try {
      const savedRequest = await createQuestionRequestOnApi(request)
      setQuestionRequests((prev) => [savedRequest, ...prev.filter((item) => item.id !== savedRequest.id)])
      
      // Debita minutos APÓS sucesso do envio
      const debitSuccess = await debitMinutes(price)
      if (debitSuccess) {
        setSystemNotice(
          `Perguntas enviadas para ${consultant.name}. ${questionCount} pergunta(s) registrada(s) e saldo debitado de R$ ${price.toFixed(2)}.`,
        )
      } else {
        setSystemNotice(
          `Perguntas enviadas mas houve erro ao debitar saldo. Contate suporte.`,
        )
      }
    } catch {
      setQuestionRequests((prev) => [request, ...prev])
      setSystemNotice('Erro ao enviar perguntas. Tente novamente.')
    }
  }

  const respondToQuestionRequest = async ({ requestId, consultantId, answerSummary }) => {
    const request = questionRequests.find((item) => item.id === requestId)
    if (!request || request.status === 'answered') {
      return
    }

    const consultant = consultants.find((item) => item.id === consultantId)
    const commissionRate = consultant?.commissionOverride ?? globalCommission
    const commissionValue = (request.packagePrice * commissionRate) / 100
    const consultantNetValue = request.packagePrice - commissionValue
    const answeredAt = new Date().toISOString()

    try {
      const result = await answerQuestionRequestOnApi({
        requestId,
        consultantId,
        answerSummary,
        commissionRate,
      })
      setQuestionRequests((prev) =>
        prev.map((item) => (item.id === requestId ? { ...item, ...result.request } : item)),
      )
      setConsultantWallets((prev) => ({
        ...prev,
        [consultantId]: result.wallet,
      }))
      setConsultants((prev) =>
        prev.map((item) =>
          item.id === consultantId ? { ...item, realSessions: (item.realSessions ?? 0) + 1 } : item,
        ),
      )
      return
    } catch {
      setSystemNotice('Não foi possível sincronizar a resposta no servidor. Aplicando modo local.')
    }

    setQuestionRequests((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: 'answered',
              answerSummary,
              answeredAt,
              commissionValue,
              consultantNetValue,
            }
          : item,
      ),
    )

    setConsultantWallets((prev) => {
      const wallet = prev[consultantId] ?? {
        availableBalance: 0,
        pixKey: '',
        transactions: [],
        withdrawals: [],
      }

      return {
        ...prev,
        [consultantId]: {
          ...wallet,
          availableBalance: wallet.availableBalance + consultantNetValue,
          transactions: [
            {
              id: `tx_${requestId}`,
              type: 'credit',
              amount: consultantNetValue,
              commissionValue,
              createdAt: answeredAt,
              description: `Resposta de pacote ${request.questionCount} perguntas`,
            },
            ...wallet.transactions,
          ],
        },
      }
    })

    setConsultants((prev) =>
      prev.map((consultant) =>
        consultant.id === consultantId
          ? { ...consultant, realSessions: (consultant.realSessions ?? 0) + 1 }
          : consultant,
      ),
    )
  }

  const setConsultantPixKey = async ({ consultantId, pixKey }) => {
    try {
      await savePixKeyOnApi({ consultantId, pixKey })
    } catch {
      setSystemNotice('Falha ao sincronizar chave PIX no servidor. Valor salvo localmente.')
    }
    setConsultantWallets((prev) => {
      const wallet = prev[consultantId] ?? {
        availableBalance: 0,
        pixKey: '',
        transactions: [],
        withdrawals: [],
      }

      return {
        ...prev,
        [consultantId]: {
          ...wallet,
          pixKey,
        },
      }
    })
  }

  const requestConsultantWithdrawal = async ({ consultantId, amount }) => {
    const wallet = consultantWallets[consultantId]
    if (!wallet) {
      return { ok: false, message: 'Carteira do consultor não encontrada.' }
    }
    if (!wallet.pixKey) {
      return { ok: false, message: 'Cadastre uma chave PIX antes de solicitar saque.' }
    }
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      return { ok: false, message: `Saque mínimo: R$ ${MIN_WITHDRAWAL_AMOUNT.toFixed(2)}.` }
    }
    if (amount > wallet.availableBalance) {
      return { ok: false, message: 'Saldo insuficiente para saque.' }
    }

    try {
      const apiResult = await requestWithdrawalOnApi({ consultantId, amount })
      if (apiResult.ok) {
        setConsultantWallets((prev) => ({
          ...prev,
          [consultantId]: apiResult.wallet,
        }))
        return { ok: true, message: apiResult.message }
      }
      if (apiResult.message) {
        return apiResult
      }
    } catch {
      setSystemNotice('Falha ao sincronizar saque no servidor. Aplicando modo local.')
    }

    const createdAt = new Date().toISOString()
    setConsultantWallets((prev) => {
      const current = prev[consultantId]
      return {
        ...prev,
        [consultantId]: {
          ...current,
          availableBalance: current.availableBalance - amount,
          withdrawals: [
            {
              id: `wd_${Date.now()}`,
              amount,
              createdAt,
              status: 'requested',
            },
            ...current.withdrawals,
          ],
          transactions: [
            {
              id: `tx_wd_${Date.now()}`,
              type: 'debit',
              amount,
              createdAt,
              description: 'Solicitação de saque',
            },
            ...current.transactions,
          ],
        },
      }
    })

    return { ok: true, message: 'Solicitação de saque registrada com sucesso.' }
  }

  const value = {
    profile,
    sign,
    minutesBalance,
    dailyHoroscope,
    login,
    register,
    registerConsultant,
    logout,
    updateProfile,
    isAuthenticated,
    isAdmin,
    isConsultant,
    userConsultantProfile,
    authLoading,
    token,
    consultants,
    pendingConsultants,
    statusFilter,
    setStatusFilter,
    selectedConsultant,
    globalCommission,
    setGlobalCommission,
    paymentResult,
    systemNotice,
    setSystemNotice,
    billing,
    roomUrl,
    minutePackages,
    setMinutePackages,
    updateMinutePackage,
    setFeaturedPackage,
    mpCredentials,
    setMpCredentials,
    savePlatformCredentials,
    dailyCredentials,
    setDailyCredentials,
    submitQuestionConsultation,
    questionRequests,
    respondToQuestionRequest,
    updateConsultantBaseConsultations,
    consultantWallets,
    setConsultantPixKey,
    requestConsultantWithdrawal,
    minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
    adminDashboardStats,
    selectConsultant,
    setSelectedConsultant,
    connectSession,
    disconnectSession,
    approveConsultant,
    blockConsultant,
    editConsultant,
    updateConsultantByAdmin,
    updateConsultantAvailability,
    rechargePackage,
    savePlatformCredentials,
    rechargeRequests,
    fetchPendingRecharges,
    requestRecharge,
    processRechargeAction,
    token,
  }

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}
