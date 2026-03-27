import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getZodiacSign } from '../utils/zodiac'
import { useBilling } from '../hooks/useBilling'
import { createRechargePreference } from '../services/mercadoPagoMock'
import { notificationService } from '../services/ConsultantNotificationService'
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
    isPremium: true,
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
    isPremium: true,
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
    isPremium: false,
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
    pixBeneficiaryName: '',
    transactions: [],
    withdrawals: [],
  }
  return acc
}, {})

const initialAdminDashboardStats = {
  totalBilled: 0,
  totalCommission: 0,
  totalQuestions3: 0,
  totalQuestions5: 0,
  totalVideoCalls: 0,
  todayTotal: 0,
  currentMonthTotal: 0,
  previousMonthTotal: 0,
  vgvLast30Days: 0,
  stripeFeesLast30Days: 0,
  custodyBalance: 0,
  custodyExpectedReturn: 0,
  consultantPayoutLast30Days: 0,
  consultantServicePayoutLast30Days: 0,
  platformCommissionRealizedLast30Days: 0,
  serviceGrossUsedLast30Days: 0,
  consultantSharePercentLast30Days: 0,
  platformSharePercentLast30Days: 0,
  realNetProfitLast30Days: 0,
  averageRechargeTicketLast30Days: 0,
  rechargeCountLast30Days: 0,
  monthOverMonthPercent: 0,
  dailyTotals: [],
  monthlyTotals: [],
  topConsultants: [],
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

const uint8ArrayToBase64Url = (value) => {
  let binary = ''
  value.forEach((item) => {
    binary += String.fromCharCode(item)
  })

  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const applicationServerKeyMatches = (subscription, expectedKey) => {
  const currentKey = subscription?.options?.applicationServerKey
  if (!currentKey) {
    return false
  }

  try {
    const normalizedCurrent = new Uint8Array(currentKey)
    return uint8ArrayToBase64Url(normalizedCurrent) === uint8ArrayToBase64Url(expectedKey)
  } catch {
    return false
  }
}

const normalizeConsultant = (consultant) => ({
  ...consultant,
  pricePerMinute: Number(consultant.pricePerMinute) || 0,
  priceThreeQuestions: Number(consultant.priceThreeQuestions) || 0,
  priceFiveQuestions: Number(consultant.priceFiveQuestions) || 0,
  baseConsultations: Number(consultant.baseConsultations) || 0,
  realSessions: Number(consultant.realSessions) || 0,
  ratingAverage: Number(consultant.ratingAverage) || 0,
  isPremium: Boolean(consultant.isPremium),
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

const normalizeMinutePackage = (pack) => ({
  ...pack,
  minutes: Number(pack.minutes) || 0,
  price: Number(pack.price) || 0,
  promoPrice:
    pack.promoPrice === null ||
    pack.promoPrice === undefined ||
    pack.promoPrice === '' ||
    Number(pack.promoPrice) <= 0
      ? null
      : Number(pack.promoPrice),
  isFeatured: Boolean(pack.isFeatured),
})

const normalizeWalletState = (walletRows, fallback = {}) => {
  const next = { ...fallback }
  walletRows.forEach((wallet) => {
    next[wallet.consultantId] = {
      availableBalance: Number(wallet.availableBalance) || 0,
      pixKey: wallet.pixKey ?? '',
      pixBeneficiaryName: wallet.pixBeneficiaryName ?? '',
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
  const [stripeCredentials, setStripeCredentialsState] = useState({
    publicKey: '',
    secretKey: '',
  })
  const [questionRequests, setQuestionRequests] = useState([])
  const [videoSessions, setVideoSessions] = useState([])
  const [consultantWallets, setConsultantWallets] = useState(initialConsultantWallets)
  const [paymentResult, setPaymentResult] = useState(null)
  const [systemNotice, setSystemNotice] = useState('')
  const [inAppNotifications, setInAppNotifications] = useState([])
  const [notificationHistory, setNotificationHistory] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationCounterRef = useRef(0)
  const mpCredentialsRef = useRef(mpCredentials)
  const dailyCredentialsRef = useRef(dailyCredentials)
  const stripeCredentialsRef = useRef(stripeCredentials)

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
    if (!token) return

    try {
      if (!('Notification' in window)) {
        return
      }

      let permission = Notification.permission
      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }

      if (permission !== 'granted') {
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      const publicVapidKeyRes = await fetch(buildApiUrl('/api/push/public-key'))
      if (!publicVapidKeyRes.ok) {
        throw new Error('Não foi possível obter a chave pública de push.')
      }
      const publicVapidKey = await publicVapidKeyRes.text()

      // Convert VAPID key to Uint8Array
      const padding = '='.repeat((4 - publicVapidKey.length % 4) % 4)
      const base64 = (publicVapidKey + padding).replace(/-/g, '+').replace(/_/g, '/')
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }

      let subscription = await registration.pushManager.getSubscription()
      if (subscription && !applicationServerKeyMatches(subscription, outputArray)) {
        await subscription.unsubscribe().catch(() => {})
        subscription = null
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        })
      }

      const response = await fetch(buildApiUrl('/api/push/subscribe'), {
        method: 'POST',
        body: JSON.stringify({ subscription, userId }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || payload.message || 'Falha ao registrar subscription push.')
      }

      return { ok: true, endpoint: subscription.endpoint }
    } catch (e) {
      console.error('Erro ao registrar Push:', e)
      return { ok: false, message: e.message || 'Erro ao registrar push.' }
    }
  }

  useEffect(() => {
    if (profile?.id && token) {
      registerPushSubscription(profile.id)
    }
  }, [profile?.id, token])

  const ensurePushSubscription = async () => {
    if (!profile?.id) {
      return { ok: false, message: 'Usuário não autenticado.' }
    }

    return registerPushSubscription(profile.id)
  }

  // Sistema de notificações in-app (Toast/Overlay)
  const addInAppNotification = (notification) => {
    const id = `notif-${Date.now()}-${++notificationCounterRef.current}`
    const notif = {
      id,
      title: notification.title || 'Notificação',
      message: notification.message || '',
      icon: notification.icon || 'message',
      contactName: notification.contactName || null,
      actions: notification.actions || [],
      autoCloseMs: notification.autoCloseMs || 8000,
      ...notification,
    }

    setInAppNotifications((prev) => [...prev, notif])

    if (notif.autoCloseMs > 0) {
      const timeoutId = setTimeout(() => {
        removeInAppNotification(id)
      }, notif.autoCloseMs)
      return { id, timeoutId }
    }

    return { id }
  }

  const removeInAppNotification = (id) => {
    setInAppNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Persistência de notificações em localStorage
  const saveNotificationsToStorage = (notifications) => {
    try {
      const key = `taro_notifications_${profile?.id}`
      localStorage.setItem(key, JSON.stringify(notifications))
    } catch (err) {
      console.warn('[PlatformContext] Erro ao salvar notificações:', err)
    }
  }

  const loadNotificationsFromStorage = () => {
    try {
      const key = `taro_notifications_${profile?.id}`
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch (err) {
      console.warn('[PlatformContext] Erro ao carregar notificações:', err)
      return []
    }
  }

  // Marcar notificação como lida/não lida
  const markNotificationAsRead = (id) => {
    setNotificationHistory((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      saveNotificationsToStorage(updated)
      
      // Atualiza unread count
      const newUnreadCount = updated.filter((n) => !n.read).length
      setUnreadCount(newUnreadCount)
      
      return updated
    })
  }

  const markAllNotificationsAsRead = () => {
    setNotificationHistory((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      saveNotificationsToStorage(updated)
      setUnreadCount(0)
      return updated
    })
  }

  // Adicionar ao histórico
  const addToNotificationHistory = (notification) => {
    const historyEntry = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      icon: notification.icon || 'message',
      contactName: notification.contactName,
      createdAt: new Date().toISOString(),
      read: false,
      type: notification.type || 'info', // 'call', 'question', 'info'
    }

    setNotificationHistory((prev) => {
      const updated = [historyEntry, ...prev].slice(0, 100) // Manter últimas 100
      saveNotificationsToStorage(updated)
      setUnreadCount((c) => c + 1)
      return updated
    })
  }

  const clearNotificationHistory = () => {
    setNotificationHistory([])
    setUnreadCount(0)
    saveNotificationsToStorage([])
  }

  // Carregar notificações ao montar componente
  useEffect(() => {
    if (profile?.id) {
      const loaded = loadNotificationsFromStorage()
      setNotificationHistory(loaded)
      const unread = loaded.filter((n) => !n.read).length
      setUnreadCount(unread)
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

  useEffect(() => {
    stripeCredentialsRef.current = stripeCredentials
  }, [stripeCredentials])

  // Setup socket.io listeners para notificações in-app
  useEffect(() => {
    if (!isConsultant || !userConsultantProfile) {
      return
    }
    const handleIncomingCall = (data) => {
      const callerName = data.customerName || data.callerName || data.caller?.name || 'Cliente'
      const notification = {
        id: `call-${data.sessionId}`,
        title: '📞 Chamada Recebida',
        message: `${callerName} está aguardando uma vídeo consulta com você.`,
        icon: 'phone',
        contactName: callerName,
        type: 'call',
        autoCloseMs: 0,
        actions: [
          {
            id: 'answer',
            label: 'Responder',
            primary: true,
            onClick: () => {
              window.location.href = `/sala/${data.sessionId}`
            },
          },
          {
            id: 'dismiss',
            label: 'Ignorar',
            primary: false,
          },
        ],
      }
      addInAppNotification(notification)
      addToNotificationHistory(notification)
    }

    const handleNewQuestion = (data) => {
      const questionCount = Number(data.questionCount) || 1
      const notification = {
        id: `question-${data.requestId}`,
        title: `❓ ${questionCount} Pergunta${questionCount > 1 ? 's' : ''} Recebida${questionCount > 1 ? 's' : ''}`,
        message: data.preview || 'Você recebeu uma consulta de perguntas para responder.',
        icon: 'message',
        contactName: data.clientName || 'Cliente',
        type: 'question',
        autoCloseMs: 10000,
        actions: [
          {
            id: 'answer',
            label: 'Responder Agora',
            primary: true,
            onClick: () => {
              window.location.href = '/area-consultor?tab=questions'
            },
          },
        ],
      }
      addInAppNotification(notification)
      addToNotificationHistory(notification)
    }

    notificationService.on('incoming_call', handleIncomingCall)
    notificationService.on('new_question', handleNewQuestion)

    return () => {
      notificationService.off('incoming_call', handleIncomingCall)
      notificationService.off('new_question', handleNewQuestion)
    }
  }, [isConsultant, userConsultantProfile, addInAppNotification, addToNotificationHistory])

  // Monitor window blur/focus para marcar notificações ao voltar
  useEffect(() => {
    const handleFocus = () => {
      // Quando volta para a aba, poderia sincronizar com backend se necessário
      console.log('[PlatformContext] Janela voltou ao foco')
    }

    const handleBlur = () => {
      console.log('[PlatformContext] Janela perdeu foco, notificações podem não ser visíveis')
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

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

  const setStripeCredentials = (updater) => {
    setStripeCredentialsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const normalized = {
        publicKey: next?.publicKey ?? next?.stripePublicKey ?? '',
        secretKey: next?.secretKey ?? next?.stripeSecretKey ?? '',
      }
      stripeCredentialsRef.current = normalized
      return normalized
    })
  }

  const savePlatformCredentials = async (type, data) => {
    try {
      // Use PATCH para salvar credenciais individuais por tipo
      // Use PUT para salvar tudo (compatibilidade com código antigo)
      const method = type ? 'PATCH' : 'PUT'
      const url = type ? buildApiUrl(`/api/credentials/${type}`) : buildApiUrl('/api/credentials')

      console.log(`[PlatformContext] Salvando ${type || 'todas'} credenciais via ${method}`, data)
      console.log(`[PlatformContext] URL: ${url}, Token: ${token ? 'presente' : 'FALTANDO'}`)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      console.log(`[PlatformContext] Resposta recebida: status=${response.status}, ok=${response.ok}`)

      if (response.ok) {
        // Atualiza o estado local dependendo do tipo (usa funções normalizadoras)
        if (type === 'mp') setMpCredentials(data)
        if (type === 'daily') setDailyCredentials(data)
        if (type === 'pix') setMpCredentials(data)
        if (type === 'stripe') setStripeCredentials(data)
        if (type === 'smtp') setMpCredentials(data)
        setSystemNotice(`Configurações de ${type || 'credenciais'} salvas com sucesso.`)
        console.log(`[PlatformContext] Sucesso ao salvar ${type}`)
        return { ok: true }
      } else {
        const errData = await response.json().catch(() => ({ message: 'Resposta inválida do servidor (HTML ou Vazio)' }))
        const errorMsg = errData.message || 'Erro ao salvar credenciais.'
        console.error(`[PlatformContext] Erro no salvamento de ${type}:`, errData)
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
  const [adminUsers, setAdminUsers] = useState([])
  const [adminDashboardStats, setAdminDashboardStats] = useState(initialAdminDashboardStats)

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

  const fetchAdminUsers = async () => {
    if (!token) {
      return
    }

    try {
      const response = await fetch(buildApiUrl('/api/auth/admin/users'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        return
      }

      const payload = await response.json()
      if (!Array.isArray(payload)) {
        return
      }

      setAdminUsers(
        payload.map((user) => ({
          ...user,
          minutesBalance: Number(user.minutesBalance) || 0,
          threeQuestionsCount: Number(user.threeQuestionsCount) || 0,
          fiveQuestionsCount: Number(user.fiveQuestionsCount) || 0,
          liveConsultationsCount: Number(user.liveConsultationsCount) || 0,
        })),
      )
    } catch (error) {
      console.error('[fetchAdminUsers] Erro ao buscar usuários:', error)
    }
  }

  const sendAdminPushBroadcast = async ({ title, body, url, targetRole = 'all' }) => {
    try {
      const response = await fetch(buildApiUrl('/api/push/admin/broadcast'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, body, url, targetRole }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { ok: false, message: payload.message || 'Erro ao enviar broadcast push.' }
      }

      return { ok: true, ...payload }
    } catch (error) {
      console.error('[sendAdminPushBroadcast] Erro ao enviar broadcast:', error)
      return { ok: false, message: 'Erro de conexão ao enviar broadcast push.' }
    }
  }

  const getMyPushStatus = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/push/me/status'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { ok: false, message: payload.message || 'Erro ao consultar status do push.' }
      }
      return payload
    } catch (error) {
      console.error('[getMyPushStatus] Erro:', error)
      return { ok: false, message: 'Erro de conexão ao consultar push.' }
    }
  }

  const sendMyPushTest = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/push/me/test'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { ok: false, message: payload.message || 'Erro ao enviar push de teste.' }
      }
      return payload
    } catch (error) {
      console.error('[sendMyPushTest] Erro:', error)
      return { ok: false, message: 'Erro de conexão ao enviar teste push.' }
    }
  }

  const updateAdminUser = async ({
    id,
    name,
    email,
    role,
    birthDate,
    minutesBalance: nextBalance,
    newPassword,
  }) => {
    try {
      const response = await fetch(buildApiUrl(`/api/auth/admin/users/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          role,
          birthDate,
          minutesBalance: Number(nextBalance),
          newPassword,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { ok: false, message: payload.message || 'Erro ao atualizar usuário.' }
      }

      await fetchAdminUsers()
      return { ok: true, message: payload.message || 'Usuário atualizado com sucesso.' }
    } catch (error) {
      console.error('[updateAdminUser] Erro ao atualizar usuário:', error)
      return { ok: false, message: 'Falha de conexão ao atualizar usuário.' }
    }
  }

  const fetchAdminDashboardStats = async () => {
    if (!token) {
      return
    }

    try {
      const response = await fetch(buildApiUrl('/api/auth/admin/dashboard-metrics'), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        return
      }

      const payload = await response.json()
      setAdminDashboardStats({
        totalBilled: Number(payload?.totalBilled) || 0,
        totalCommission: Number(payload?.totalCommission) || 0,
        totalQuestions3: Number(payload?.totalQuestions3) || 0,
        totalQuestions5: Number(payload?.totalQuestions5) || 0,
        totalVideoCalls: Number(payload?.totalVideoCalls) || 0,
        todayTotal: Number(payload?.todayTotal) || 0,
        currentMonthTotal: Number(payload?.currentMonthTotal) || 0,
        previousMonthTotal: Number(payload?.previousMonthTotal) || 0,
        vgvLast30Days: Number(payload?.vgvLast30Days) || 0,
        stripeFeesLast30Days: Number(payload?.stripeFeesLast30Days) || 0,
        custodyBalance: Number(payload?.custodyBalance) || 0,
        custodyExpectedReturn: Number(payload?.custodyExpectedReturn) || 0,
        consultantPayoutLast30Days: Number(payload?.consultantPayoutLast30Days) || 0,
        consultantServicePayoutLast30Days:
          Number(payload?.consultantServicePayoutLast30Days) || 0,
        platformCommissionRealizedLast30Days:
          Number(payload?.platformCommissionRealizedLast30Days) || 0,
        serviceGrossUsedLast30Days: Number(payload?.serviceGrossUsedLast30Days) || 0,
        consultantSharePercentLast30Days: Number(payload?.consultantSharePercentLast30Days) || 0,
        platformSharePercentLast30Days: Number(payload?.platformSharePercentLast30Days) || 0,
        realNetProfitLast30Days: Number(payload?.realNetProfitLast30Days) || 0,
        averageRechargeTicketLast30Days: Number(payload?.averageRechargeTicketLast30Days) || 0,
        rechargeCountLast30Days: Number(payload?.rechargeCountLast30Days) || 0,
        monthOverMonthPercent: Number(payload?.monthOverMonthPercent) || 0,
        dailyTotals: Array.isArray(payload?.dailyTotals) ? payload.dailyTotals : [],
        monthlyTotals: Array.isArray(payload?.monthlyTotals) ? payload.monthlyTotals : [],
        topConsultants: Array.isArray(payload?.topConsultants) ? payload.topConsultants : [],
      })
    } catch (error) {
      console.error('[fetchAdminDashboardStats] Erro ao buscar métricas:', error)
    }
  }

  const upsertConsultantOnApi = async (consultant, isSelfEdit = false) => {
    console.log('[upsertConsultantOnApi] Attempting with isSelfEdit:', isSelfEdit, 'consultant:', consultant.id)
    
    // Se for auto-edição, usar endpoint POST /consultants/profile/:id
    if (isSelfEdit) {
      console.log('[upsertConsultantOnApi] Using POST /profile endpoint for self-edit')
      const response = await fetch(buildApiUrl(`/api/consultants/profile/${consultant.id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(consultant),
      })
      console.log('[upsertConsultantOnApi] POST Response status:', response.status, 'ok:', response.ok)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[upsertConsultantOnApi] POST Error response:', errorText)
      }
      return response.ok
    }

    // Para admin, usar PUT tradicional
    console.log('[upsertConsultantOnApi] Using PUT endpoint for admin')
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
    console.log('[upsertConsultantOnApi] Headers being sent:', Object.keys(headers))
    console.log('[upsertConsultantOnApi] Consultant ID:', consultant.id)
    
    const response = await fetch(buildApiUrl(`/api/consultants/${consultant.id}`), {
      method: 'PUT',
      headers,
      body: JSON.stringify(consultant),
    })
    console.log('[upsertConsultantOnApi] PUT Response status:', response.status, 'ok:', response.ok)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[upsertConsultantOnApi] PUT Error response:', errorText)
    }
    return response.ok
  }

  const persistConsultant = async (consultant, isSelfEdit = false) => {
    try {
      console.log('[persistConsultant] Starting with consultant:', consultant.id, 'isSelfEdit:', isSelfEdit)
      const ok = await upsertConsultantOnApi(consultant, isSelfEdit)
      console.log('[persistConsultant] Result:', ok)
      if (!ok) {
        setSystemNotice('Não foi possível salvar alterações do consultor no backend.')
        return false
      }
      return true
    } catch (err) {
      console.error('[persistConsultant] Error:', err)
      setSystemNotice('Falha de conexão ao salvar dados do consultor.')
      return false
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
      const errorData = await response.json().catch(() => ({}))
      console.error('[createQuestionRequestOnApi] Erro na resposta:', response.status, errorData)
      throw new Error(errorData.message || `Erro ${response.status}: Falha ao registrar solicitação de perguntas no backend.`)
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

  const savePixKeyOnApi = async ({ consultantId, pixKey, pixBeneficiaryName }) => {
    const response = await fetch(buildApiUrl(`/api/wallets/${consultantId}/pix-key`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pixKey, pixBeneficiaryName }),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Falha ao salvar chave PIX no backend.')
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
        const stripe = {
          publicKey: payload?.stripePublicKey ?? '',
          secretKey: payload?.stripeSecretKey ?? '',
        }
        mpCredentialsRef.current = mp
        dailyCredentialsRef.current = daily
        stripeCredentialsRef.current = stripe
        setMpCredentialsState(mp)
        setDailyCredentialsState(daily)
        setStripeCredentialsState(stripe)
      } catch {
        return
      }
    }
    void loadCredentials()
  }, [token])

  useEffect(() => {
    const loadMinutePackages = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/recharges/packages'))
        if (!response.ok) {
          return
        }
        const payload = await response.json()
        if (!Array.isArray(payload) || payload.length === 0) {
          return
        }
        setMinutePackages(payload.map(normalizeMinutePackage))
      } catch {
        return
      }
    }

    void loadMinutePackages()
  }, [])

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
    billing.stopSession('disconnectSession')
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
        isPremium: false,
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
    console.log('[updateConsultantByAdmin] Starting with id:', id)
    let updatedConsultant = null
    setConsultants((prev) =>
      prev.map((consultant) => {
        if (consultant.id === id) {
          updatedConsultant = normalizeConsultant({ ...consultant, ...updates })
          console.log('[updateConsultantByAdmin] Updated consultant:', updatedConsultant.id)
          return updatedConsultant
        }
        return consultant
      }),
    )
    if (updatedConsultant) {
      console.log('[updateConsultantByAdmin] Calling persistConsultant')
      void persistConsultant(updatedConsultant)
    }
  }

  const persistConsultantWithResult = async (id, updates, isSelfEdit = false) => {
    console.log('[persistConsultantWithResult] Starting with id:', id, 'isSelfEdit:', isSelfEdit)
    let updatedConsultant = null
    setConsultants((prev) =>
      prev.map((consultant) => {
        if (consultant.id === id) {
          updatedConsultant = normalizeConsultant({ ...consultant, ...updates })
          console.log('[persistConsultantWithResult] Updated consultant:', updatedConsultant.id)
          return updatedConsultant
        }
        return consultant
      }),
    )
    if (updatedConsultant) {
      console.log('[persistConsultantWithResult] Calling persistConsultant')
      return await persistConsultant(updatedConsultant, isSelfEdit)
    }
    console.log('[persistConsultantWithResult] No consultant found')
    return false
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

  const saveMinutePackages = async (packages) => {
    try {
      const response = await fetch(buildApiUrl('/api/recharges/packages'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packages }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = payload.message || 'Erro ao salvar pacotes de recarga.'
        setSystemNotice(message)
        return { ok: false, message }
      }

      const nextPackages = Array.isArray(payload.packages)
        ? payload.packages.map(normalizeMinutePackage)
        : packages.map(normalizeMinutePackage)

      setMinutePackages(nextPackages)
      setSystemNotice(payload.message || 'Pacotes de recarga salvos com sucesso.')
      return { ok: true, packages: nextPackages }
    } catch (error) {
      console.error('[saveMinutePackages] Error:', error)
      const message = 'Erro de conexão ao salvar pacotes de recarga.'
      setSystemNotice(message)
      return { ok: false, message }
    }
  }

  const submitQuestionConsultation = async ({ consultant, questionCount, price, entries }) => {
    // Validação de perfil
    if (!profile || !profile.email) {
      setSystemNotice('Erro: Sua conta não tem email válido. Atualize seu perfil e tente novamente.')
      return
    }

    if (!consultant || !consultant.id) {
      setSystemNotice('Erro: Consultor inválido. Por favor, selecione novamente.')
      return
    }

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
      customerName: profile.name || 'Cliente',
      customerEmail: profile.email,
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

    console.log('[submitQuestionConsultation] Enviando perguntas:', request)

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
    } catch (error) {
      console.error('[submitQuestionConsultation] Erro ao enviar perguntas:', error)
      setQuestionRequests((prev) => [request, ...prev])
      setSystemNotice(`Erro ao enviar perguntas: ${error.message || 'Tente novamente.'}`)
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

  const setConsultantPixKey = async ({ consultantId, pixKey, pixBeneficiaryName }) => {
    try {
      await savePixKeyOnApi({ consultantId, pixKey, pixBeneficiaryName })
    } catch (error) {
      setSystemNotice(error.message || 'Falha ao sincronizar chave PIX no servidor. Valor salvo localmente.')
    }
    setConsultantWallets((prev) => {
      const wallet = prev[consultantId] ?? {
        availableBalance: 0,
        pixKey: '',
        pixBeneficiaryName: '',
        transactions: [],
        withdrawals: [],
      }

      return {
        ...prev,
        [consultantId]: {
          ...wallet,
          pixKey,
          pixBeneficiaryName,
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
    if (!wallet.pixBeneficiaryName) {
      return { ok: false, message: 'Cadastre o nome do beneficiário antes de solicitar saque.' }
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
              pixKey: current.pixKey,
              pixBeneficiaryName: current.pixBeneficiaryName,
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

  const updateWithdrawalStatusOnApi = async ({ consultantId, withdrawalId, newStatus }) => {
    const response = await fetch(
      buildApiUrl(`/api/wallets/${consultantId}/withdrawals/${withdrawalId}/status`),
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      },
    )
    const payload = await response.json()
    if (!response.ok) {
      return { ok: false, message: payload.message || 'Falha ao atualizar saque.' }
    }
    return {
      ok: true,
      message: payload.message || 'Saque atualizado com sucesso.',
      wallet: normalizeWalletState([payload.wallet])[payload.wallet.consultantId],
    }
  }

  const updateWithdrawalStatus = async ({ consultantId, withdrawalId, newStatus }) => {
    try {
      const apiResult = await updateWithdrawalStatusOnApi({ consultantId, withdrawalId, newStatus })
      if (apiResult.ok) {
        setConsultantWallets((prev) => ({
          ...prev,
          [consultantId]: apiResult.wallet,
        }))
        return { ok: true, message: apiResult.message }
      }
      return apiResult
    } catch (error) {
      console.error('[updateWithdrawalStatus] Error:', error)
      return { ok: false, message: 'Erro ao atualizar saque.' }
    }
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
    inAppNotifications,
    addInAppNotification,
    removeInAppNotification,
    notificationHistory,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addToNotificationHistory,
    clearNotificationHistory,
    ensurePushSubscription,
    getMyPushStatus,
    sendMyPushTest,
    billing,
    roomUrl,
    minutePackages,
    setMinutePackages,
    updateMinutePackage,
    setFeaturedPackage,
    saveMinutePackages,
    mpCredentials,
    setMpCredentials,
    savePlatformCredentials,
    dailyCredentials,
    setDailyCredentials,
    stripeCredentials,
    setStripeCredentials,
    submitQuestionConsultation,
    questionRequests,
    respondToQuestionRequest,
    updateConsultantBaseConsultations,
    consultantWallets,
    setConsultantPixKey,
    requestConsultantWithdrawal,
    updateWithdrawalStatus,
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
    persistConsultantWithResult,
    updateConsultantAvailability,
    rechargePackage,
    rechargeRequests,
    fetchPendingRecharges,
    requestRecharge,
    processRechargeAction,
    adminUsers,
    fetchAdminUsers,
    sendAdminPushBroadcast,
    updateAdminUser,
    fetchAdminDashboardStats,
  }

  if (process.env.NODE_ENV === 'development') {
    // Verify all functions are valid
    const invalidFuncs = Object.entries(value).filter(
      ([key, val]) => typeof val === 'undefined' || val === null
    )
    if (invalidFuncs.length > 0) {
      console.warn('[PlatformContext] Invalid context values:', invalidFuncs.map(([k]) => k))
    }
  }

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}
