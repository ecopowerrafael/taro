import { useMemo, useState, useEffect } from 'react'
import {
  Activity,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Edit2,
  ExternalLink,
  Filter,
  History,
  Info,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  X,
  Plus,
  Save,
  CheckCircle2,
  XCircle,
  Landmark,
  Pencil,
  ShieldBan,
} from 'lucide-react'
import { GlassCard } from './GlassCard'

export function AdminPanel({
  consultants,
  pendingConsultants,
  minutePackages,
  updateMinutePackage,
  setFeaturedPackage,
  onSaveMinutePackages,
  updateConsultantBaseConsultations,
  consultantWallets,
  questionRequests,
  globalCommission,
  onGlobalCommissionChange,
  onApprove,
  onBlock,
  onSaveConsultant,
  mpCredentials,
  onMpCredentialsChange,
  dailyCredentials,
  onDailyCredentialsChange,
  onSaveCredentials,
  rechargeRequests,
  onRechargeAction,
  updateWithdrawalStatus,
  stripeCredentials,
  onStripeCredentialsChange,
  adminUsers,
  onRefreshAdminUsers,
  onUpdateAdminUser,
  adminDashboardStats,
  onRefreshAdminDashboard,
  token,
}) {
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'consultores' | 'usuarios' | 'financeiro' | 'credenciais' | 'recharges' | 'saques'
  const [searchQuery, setSearchSearchQuery] = useState('')
  const [editingConsultantId, setEditingConsultantId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [withdrawalModal, setWithdrawalModal] = useState(null) // { consultantId, withdrawalId, status } ou null
  const [commissionDraft, setCommissionDraft] = useState(globalCommission?.toString() ?? '0')
  const [financeDraft, setFinanceDraft] = useState(
    minutePackages.map((pack) => ({
      id: pack.id,
      minutes: pack.minutes,
      price: pack.price?.toString() ?? '0',
      promoPrice: pack.promoPrice?.toString() ?? '',
      isFeatured: pack.isFeatured,
    })),
  )
  const [featuredFinanceId, setFeaturedFinanceId] = useState(
    minutePackages.find((pack) => pack.isFeatured)?.id ?? null,
  )
  const [credentialsDraft, setCredentialsDraft] = useState({
    mpPublicKey: '',
    mpAccessToken: '',
    mpWebhookSecret: '',
    dailyApiKey: '',
    dailyDomain: '',
    dailyRoomName: '',
    stripePublicKey: '',
    stripeSecretKey: '',
    pixKey: '',
    pixReceiverName: '',
    pixReceiverCity: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
  })
  const [mercadoPagoAvailable, setMercadoPagoAvailable] = useState(false)
  const [paymentMethodsChecked, setPaymentMethodsChecked] = useState(false)
  const [financeSaving, setFinanceSaving] = useState(false)
  const [financeFeedback, setFinanceFeedback] = useState('')

  // Verificar disponibilidade de métodos de pagamento
  useEffect(() => {
    const checkPaymentMethods = async () => {
      try {
        const response = await fetch('/api/credentials/info/payment-methods')
        if (response.ok) {
          const data = await response.json()
          setMercadoPagoAvailable(data.mercadoPagoAvailable || false)
        }
      } catch (error) {
        console.warn('[AdminPanel] Erro ao verificar métodos de pagamento:', error)
      }
      setPaymentMethodsChecked(true)
    }
    checkPaymentMethods()
  }, [])

  useEffect(() => {
    if (mpCredentials || dailyCredentials || stripeCredentials) {
      setCredentialsDraft({
        mpPublicKey: mpCredentials?.publicKey || '',
        mpAccessToken: mpCredentials?.accessToken || '',
        mpWebhookSecret: mpCredentials?.webhookSecret || '',
        dailyApiKey: dailyCredentials?.apiKey || '',
        dailyDomain: dailyCredentials?.domain || '',
        dailyRoomName: dailyCredentials?.roomName || '',
        stripePublicKey: stripeCredentials?.publicKey || '',
        stripeSecretKey: stripeCredentials?.secretKey || '',
        pixKey: mpCredentials?.pixKey || '',
        pixReceiverName: mpCredentials?.pixReceiverName || '',
        pixReceiverCity: mpCredentials?.pixReceiverCity || '',
        smtpHost: dailyCredentials?.smtpHost || '',
        smtpPort: dailyCredentials?.smtpPort || '',
        smtpUser: dailyCredentials?.smtpUser || '',
        smtpPass: dailyCredentials?.smtpPass || '',
        smtpFrom: dailyCredentials?.smtpFrom || '',
      })
    }
  }, [mpCredentials, dailyCredentials, stripeCredentials])

  useEffect(() => {
    setFinanceDraft(
      minutePackages.map((pack) => ({
        id: pack.id,
        minutes: pack.minutes,
        price: pack.price?.toString() ?? '0',
        promoPrice: pack.promoPrice?.toString() ?? '',
        isFeatured: pack.isFeatured,
      })),
    )
    setFeaturedFinanceId(minutePackages.find((pack) => pack.isFeatured)?.id ?? null)
  }, [minutePackages])

  const handleSavePartial = async (type) => {
    setCredentialsSaving(true)
    setCredentialsFeedback('')
    
    let data = {}
    if (type === 'mp') {
      data = {
        mpPublicKey: credentialsDraft.mpPublicKey,
        mpAccessToken: credentialsDraft.mpAccessToken,
        mpWebhookSecret: credentialsDraft.mpWebhookSecret,
      }
    } else if (type === 'daily') {
      data = {
        dailyApiKey: credentialsDraft.dailyApiKey,
        dailyDomain: credentialsDraft.dailyDomain,
        dailyRoomName: credentialsDraft.dailyRoomName,
      }
    } else if (type === 'pix') {
      data = {
        pixKey: credentialsDraft.pixKey,
        pixReceiverName: credentialsDraft.pixReceiverName,
        pixReceiverCity: credentialsDraft.pixReceiverCity,
      }
    } else if (type === 'stripe') {
      data = {
        stripePublicKey: credentialsDraft.stripePublicKey,
        stripeSecretKey: credentialsDraft.stripeSecretKey,
      }
    } else if (type === 'smtp') {
      data = {
        smtpHost: credentialsDraft.smtpHost,
        smtpPort: credentialsDraft.smtpPort,
        smtpUser: credentialsDraft.smtpUser,
        smtpPass: credentialsDraft.smtpPass,
        smtpFrom: credentialsDraft.smtpFrom,
      }
    }
    
    // Call savePlatformCredentials and wait for response
    const result = await onMpCredentialsChange(type, data)
    
    if (result?.ok) {
      setCredentialsFeedback(`✓ Credenciais de ${type} salvas com sucesso!`)
      setTimeout(() => setCredentialsFeedback(''), 3000)
    } else {
      setCredentialsFeedback(`✗ Erro ao salvar credenciais de ${type}. Tente novamente.`)
    }
    
    setCredentialsSaving(false)
  }

  const [credentialsSaving, setCredentialsSaving] = useState(false)
  const [credentialsFeedback, setCredentialsFeedback] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [userEditDraft, setUserEditDraft] = useState(null)
  const [userEditSaving, setUserEditSaving] = useState(false)
  const [userEditFeedback, setUserEditFeedback] = useState('')

  // Estados para criação de avaliação mock
  const [mockReviewForm, setMockReviewForm] = useState({ consultantId: '', displayName: '', sessionType: 'video', rating: 5, comment: '' })
  const [mockReviewSaving, setMockReviewSaving] = useState(false)
  const [mockReviewFeedback, setMockReviewFeedback] = useState('')
  const [bulkMockSaving, setBulkMockSaving] = useState(false)
  const [bulkMockFeedback, setBulkMockFeedback] = useState('')

  const tabButtonClass = (tabId) =>
    `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
      activeTab === tabId
        ? 'border-mystic-gold/70 bg-mystic-gold/20 text-mystic-goldSoft'
        : 'border-mystic-gold/35 text-amber-100/80 hover:bg-mystic-gold/10'
    }`

  const normalizeNullableText = (value) => {
    const normalized = (value ?? '').trim()
    return normalized === '' ? null : normalized
  }

  const parseNumberValue = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const parseNullableNumberValue = (value) => {
    if ((value ?? '').toString().trim() === '') {
      return null
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const financeDirty = useMemo(() => {
    if (financeDraft.length !== minutePackages.length) {
      return true
    }
    const hasChangedPack = minutePackages.some((pack) => {
      const draft = financeDraft.find((item) => item.id === pack.id)
      if (!draft) {
        return true
      }
      if (parseNumberValue(draft.price) !== pack.price) {
        return true
      }
      if (parseNullableNumberValue(draft.promoPrice) !== (pack.promoPrice ?? null)) {
        return true
      }
      return false
    })
    if (hasChangedPack) {
      return true
    }
    return featuredFinanceId !== (minutePackages.find((pack) => pack.isFeatured)?.id ?? null)
  }, [featuredFinanceId, financeDraft, minutePackages])

  const credentialsDirty = useMemo(() => {
    const normalizedPublicKey = normalizeNullableText(credentialsDraft.publicKey)
    const normalizedAccessToken = normalizeNullableText(credentialsDraft.accessToken)
    const normalizedWebhookSecret = normalizeNullableText(credentialsDraft.webhookSecret)
    const normalizedDailyApiKey = normalizeNullableText(credentialsDraft.dailyApiKey)
    const normalizedDailyDomain = normalizeNullableText(credentialsDraft.dailyDomain)
    const normalizedDailyRoomName = normalizeNullableText(credentialsDraft.dailyRoomName)

    return (
      normalizedPublicKey !== (mpCredentials?.publicKey ?? null) ||
      normalizedAccessToken !== (mpCredentials?.accessToken ?? null) ||
      normalizedWebhookSecret !== (mpCredentials?.webhookSecret ?? null) ||
      normalizedDailyApiKey !== (dailyCredentials?.apiKey ?? null) ||
      normalizedDailyDomain !== (dailyCredentials?.domain ?? null) ||
      normalizedDailyRoomName !== (dailyCredentials?.roomName ?? null)
    )
  }, [credentialsDraft, dailyCredentials, mpCredentials])

  const commissionDirty = useMemo(() => {
    return parseNumberValue(commissionDraft) !== globalCommission
  }, [commissionDraft, globalCommission])

  const saveCommission = () => {
    const parsed = parseNumberValue(commissionDraft)
    onGlobalCommissionChange(parsed)
    setCommissionDraft(parsed.toString())
  }

  const saveFinance = async () => {
    setFinanceSaving(true)
    setFinanceFeedback('')
    const normalizedFinance = financeDraft.map((pack) => ({
      ...pack,
      price: parseNumberValue(pack.price).toString(),
      promoPrice: parseNullableNumberValue(pack.promoPrice)?.toString() ?? '',
      isFeatured: pack.id === featuredFinanceId,
    }))
    setFinanceDraft(normalizedFinance)

    const payload = normalizedFinance.map((pack, index) => ({
      id: pack.id,
      minutes: Number(pack.minutes),
      price: parseNumberValue(pack.price),
      promoPrice: parseNullableNumberValue(pack.promoPrice),
      isFeatured: pack.id === featuredFinanceId,
      sortOrder: index + 1,
    }))

    if (typeof onSaveMinutePackages === 'function') {
      const result = await onSaveMinutePackages(payload)
      if (result?.ok) {
        setFinanceFeedback('Pacotes salvos com sucesso.')
      } else {
        setFinanceFeedback(result?.message || 'Nao foi possivel salvar os pacotes.')
      }
      setFinanceSaving(false)
      return
    }

    financeDraft.forEach((pack) => {
      updateMinutePackage(pack.id, {
        price: parseNumberValue(pack.price),
        promoPrice: parseNullableNumberValue(pack.promoPrice),
      })
    })
    if (featuredFinanceId) {
      setFeaturedPackage(featuredFinanceId)
    }
    setFinanceFeedback('Pacotes atualizados localmente.')
    setFinanceSaving(false)
  }

  const saveCredentials = async () => {
    setCredentialsSaving(true)
    setCredentialsFeedback('')
    const normalizedPublicKey = normalizeNullableText(credentialsDraft.publicKey)
    const normalizedAccessToken = normalizeNullableText(credentialsDraft.accessToken)
    const normalizedWebhookSecret = normalizeNullableText(credentialsDraft.webhookSecret)
    const normalizedDailyApiKey = normalizeNullableText(credentialsDraft.dailyApiKey)
    const normalizedDailyDomain = normalizeNullableText(credentialsDraft.dailyDomain)
    const normalizedDailyRoomName = normalizeNullableText(credentialsDraft.dailyRoomName)

    setCredentialsDraft({
      publicKey: normalizedPublicKey ?? '',
      accessToken: normalizedAccessToken ?? '',
      webhookSecret: normalizedWebhookSecret ?? '',
      dailyApiKey: normalizedDailyApiKey ?? '',
      dailyDomain: normalizedDailyDomain ?? '',
      dailyRoomName: normalizedDailyRoomName ?? '',
    })

    const nextMpCredentials = {
      publicKey: normalizedPublicKey ?? '',
      accessToken: normalizedAccessToken ?? '',
      webhookSecret: normalizedWebhookSecret ?? '',
    }
    const nextDailyCredentials = {
      apiKey: normalizedDailyApiKey ?? '',
      domain: normalizedDailyDomain ?? 'demo.daily.co',
      roomName: normalizedDailyRoomName ?? 'hello',
    }

    const saved = await onSaveCredentials(nextMpCredentials, nextDailyCredentials)
    if (saved) {
      onMpCredentialsChange(nextMpCredentials)
      onDailyCredentialsChange(nextDailyCredentials)
      setCredentialsFeedback('Credenciais salvas com sucesso.')
    } else {
      setCredentialsFeedback('Não foi possível salvar credenciais. Tente novamente.')
    }
    setCredentialsSaving(false)
  }

  const openEditConsultant = (consultant) => {
    setEditingConsultantId(consultant.id)
    setEditForm({
      name: consultant.name ?? '',
      email: consultant.email ?? '',
      tagline: consultant.tagline ?? '',
      baseConsultations: consultant.baseConsultations?.toString() ?? '0',
      pricePerMinute: consultant.pricePerMinute?.toString() ?? '0',
      priceThreeQuestions: consultant.priceThreeQuestions?.toString() ?? '0',
      priceFiveQuestions: consultant.priceFiveQuestions?.toString() ?? '0',
      commissionOverride: consultant.commissionOverride ?? '',
      ratingAverage: consultant.ratingAverage?.toString() ?? '5',
      status: consultant.status ?? 'Online',
    })
  }

  const saveEditConsultant = () => {
    if (!editingConsultantId || !editForm) {
      console.log('[AdminPanel] Missing data for save:', { editingConsultantId, editForm })
      return
    }
    console.log('[AdminPanel] Calling onSaveConsultant with id:', editingConsultantId)
    console.log('[AdminPanel] onSaveConsultant type:', typeof onSaveConsultant)
    onSaveConsultant(editingConsultantId, {
      name: editForm.name.trim(),
      email: editForm.email.trim().toLowerCase(),
      tagline: editForm.tagline.trim(),
      baseConsultations: Number(editForm.baseConsultations) || 0,
      pricePerMinute: Number(editForm.pricePerMinute) || 0,
      priceThreeQuestions: Number(editForm.priceThreeQuestions) || 0,
      priceFiveQuestions: Number(editForm.priceFiveQuestions) || 0,
      commissionOverride:
        editForm.commissionOverride === '' ? null : Number(editForm.commissionOverride) || null,
      ratingAverage: Number(editForm.ratingAverage) || 0,
      status: editForm.status,
    })
    setEditingConsultantId(null)
    setEditForm(null)
  }

  const getConsultantBilled = (consultantId) =>
    questionRequests
      .filter((request) => request.consultantId === consultantId && request.status === 'answered')
      .reduce((sum, request) => sum + request.packagePrice, 0)

  const getConsultantPayable = (consultantId) => consultantWallets[consultantId]?.availableBalance ?? 0

  const getPendingWithdrawals = () => {
    const pending = []
    Object.entries(consultantWallets).forEach(([consultantId, wallet]) => {
      if (!wallet.withdrawals) return
      wallet.withdrawals.forEach((withdrawal) => {
        if (withdrawal.status === 'requested') {
          const consultant = consultants.find((c) => c.id === consultantId)
          pending.push({
            consultantId,
            consultantName: consultant?.name ?? 'Desconhecido',
            ...withdrawal,
          })
        }
      })
    })
    return pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const handleApproveWithdrawal = async (consultantId, withdrawalId) => {
    const result = await updateWithdrawalStatus({
      consultantId,
      withdrawalId,
      newStatus: 'paid',
    })
    if (result.ok) {
      setWithdrawalModal(null)
    }
  }

  const handleRejectWithdrawal = async (consultantId, withdrawalId) => {
    const result = await updateWithdrawalStatus({
      consultantId,
      withdrawalId,
      newStatus: 'rejected',
    })
    if (result.ok) {
      setWithdrawalModal(null)
    }
  }

  const saveMockReview = async () => {
    if (!mockReviewForm.consultantId || !mockReviewForm.displayName.trim()) {
      setMockReviewFeedback('Selecione um consultor e informe o nome do avaliador.')
      return
    }
    setMockReviewSaving(true)
    setMockReviewFeedback('')
    try {
      const res = await fetch('/api/consultants/reviews/admin-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(mockReviewForm),
      })
      const data = await res.json()
      if (res.ok) {
        setMockReviewFeedback(`✓ Avaliação adicionada! Nova média: ${data.newRatingAverage?.toFixed(2)}`)
        setMockReviewForm(f => ({ ...f, displayName: '', comment: '' }))
      } else {
        setMockReviewFeedback(data.message || 'Erro ao salvar avaliação.')
      }
    } catch {
      setMockReviewFeedback('Erro de conexão.')
    }
    setMockReviewSaving(false)
  }

  const runBulkMock = async () => {
    setBulkMockSaving(true)
    setBulkMockFeedback('')
    try {
      const res = await fetch('/api/consultants/reviews/bulk-mock', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setBulkMockFeedback(`✓ ${data.inserted} avaliações geradas para ${data.consultants} consultor(es).`)
      } else {
        setBulkMockFeedback(data.message || 'Erro ao gerar avaliações.')
      }
    } catch {
      setBulkMockFeedback('Erro de conexão.')
    }
    setBulkMockSaving(false)
  }

  const totalPendingWithdrawals = getPendingWithdrawals().length
  const dailyTotals = Array.isArray(adminDashboardStats?.dailyTotals) ? adminDashboardStats.dailyTotals : []
  const monthlyTotals = Array.isArray(adminDashboardStats?.monthlyTotals) ? adminDashboardStats.monthlyTotals : []
  const topConsultants = Array.isArray(adminDashboardStats?.topConsultants)
    ? adminDashboardStats.topConsultants
    : []
  const maxDailyTotal = Math.max(1, ...dailyTotals.map((item) => Number(item.total) || 0))
  const maxMonthlyTotal = Math.max(1, ...monthlyTotals.map((item) => Number(item.total) || 0))

  const openEditUser = (user) => {
    const rawBirthDate = user.birthDate ? String(user.birthDate).slice(0, 10) : ''
    const normalizedBirthDate = /^\d{4}-\d{2}-\d{2}$/.test(rawBirthDate) ? rawBirthDate : ''

    setEditingUser(user)
    setUserEditFeedback('')
    setUserEditDraft({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'client',
      birthDate: normalizedBirthDate,
      minutesBalance: (Number(user.minutesBalance) || 0).toString(),
      newPassword: '',
    })
  }

  const saveEditedUser = async () => {
    if (!userEditDraft) return
    setUserEditSaving(true)
    setUserEditFeedback('')

    const result = await onUpdateAdminUser?.({
      id: userEditDraft.id,
      name: userEditDraft.name,
      email: userEditDraft.email,
      role: userEditDraft.role,
      birthDate: userEditDraft.birthDate || null,
      minutesBalance: Number(userEditDraft.minutesBalance),
      newPassword: userEditDraft.newPassword,
    })

    if (result?.ok) {
      setUserEditFeedback('Usuário salvo com sucesso.')
      setTimeout(() => {
        setEditingUser(null)
        setUserEditDraft(null)
        setUserEditFeedback('')
      }, 700)
    } else {
      setUserEditFeedback(result?.message || 'Erro ao salvar usuário.')
    }

    setUserEditSaving(false)
  }

  return (
    <GlassCard
      title="Painel Administrativo"
      subtitle="Gestão de consultores, financeiro e regras de comissão."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={tabButtonClass('dashboard')} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={14} />
          Dashboard
        </button>
        <button className={tabButtonClass('consultores')} onClick={() => setActiveTab('consultores')}>
          <Check size={14} />
          Consultores
        </button>
        <button className={tabButtonClass('usuarios')} onClick={() => setActiveTab('usuarios')}>
          <Users size={14} />
          Usuários
        </button>
        <button className={tabButtonClass('financeiro')} onClick={() => setActiveTab('financeiro')}>
          <CreditCard size={14} />
          Recarga
        </button>
        <button className={tabButtonClass('credenciais')} onClick={() => setActiveTab('credenciais')}>
          <Landmark size={14} />
          Credenciais
        </button>
        <button
          className={tabButtonClass('recharges')}
          onClick={() => setActiveTab('recharges')}
        >
          <Wallet size={14} />
          Recargas
          {rechargeRequests.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {rechargeRequests.length}
            </span>
          )}
        </button>
        <button
          className={tabButtonClass('saques')}
          onClick={() => setActiveTab('saques')}
        >
          <Wallet size={14} />
          Saques
          {totalPendingWithdrawals > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
              {totalPendingWithdrawals}
            </span>
          )}
        </button>
      </div>
      <div className="grid gap-5">
        {activeTab === 'dashboard' && (
          <div className="grid gap-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-ethereal-silver/70">Visão consolidada com dados reais da plataforma.</p>
              <button
                onClick={() => onRefreshAdminDashboard?.()}
                className="rounded-lg border border-mystic-gold/50 bg-mystic-gold/10 px-3 py-1.5 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/20"
              >
                Atualizar dashboard
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Total Faturado</p>
                <p className="mt-1 font-display text-3xl text-mystic-goldSoft">
                  R$ {Number(adminDashboardStats?.totalBilled || 0).toFixed(2)}
                </p>
              </article>
              <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Comissão Astria</p>
                <p className="mt-1 font-display text-3xl text-mystic-goldSoft">
                  R$ {Number(adminDashboardStats?.totalCommission || 0).toFixed(2)}
                </p>
              </article>
              <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Total Diário</p>
                <p className="mt-1 font-display text-3xl text-mystic-goldSoft">
                  R$ {Number(adminDashboardStats?.todayTotal || 0).toFixed(2)}
                </p>
              </article>
              <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Total Mensal</p>
                <p className="mt-1 font-display text-3xl text-mystic-goldSoft">
                  R$ {Number(adminDashboardStats?.currentMonthTotal || 0).toFixed(2)}
                </p>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Mês Anterior</p>
                <p className="mt-1 font-display text-2xl text-mystic-goldSoft">
                  R$ {Number(adminDashboardStats?.previousMonthTotal || 0).toFixed(2)}
                </p>
              </article>
              <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Comparação M/M</p>
                <p className="mt-1 font-display text-2xl text-mystic-goldSoft">
                  {Number(adminDashboardStats?.monthOverMonthPercent || 0).toFixed(2)}%
                </p>
              </article>
              <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Perguntas (3)</p>
                <p className="mt-1 font-display text-2xl text-mystic-goldSoft">
                  {Number(adminDashboardStats?.totalQuestions3 || 0)}
                </p>
              </article>
              <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Perguntas (5)</p>
                <p className="mt-1 font-display text-2xl text-mystic-goldSoft">
                  {Number(adminDashboardStats?.totalQuestions5 || 0)}
                </p>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              <article className="rounded-lg border border-emerald-400/25 bg-emerald-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">VGV (30 dias)</p>
                <p className="mt-1 font-display text-2xl text-emerald-200">
                  R$ {Number(adminDashboardStats?.vgvLast30Days || 0).toFixed(2)}
                </p>
              </article>
              <article className="rounded-lg border border-rose-400/25 bg-rose-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-rose-100/70">Taxas Stripe (30 dias)</p>
                <p className="mt-1 font-display text-2xl text-rose-200">
                  R$ {Number(adminDashboardStats?.stripeFeesLast30Days || 0).toFixed(2)}
                </p>
              </article>
              <article className="rounded-lg border border-sky-400/25 bg-sky-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-100/70">Saldo em Custódia</p>
                <p className="mt-1 font-display text-2xl text-sky-200">
                  R$ {Number(adminDashboardStats?.custodyBalance || 0).toFixed(2)}
                </p>
                <p className="mt-2 text-[11px] text-sky-100/65">
                  Saldo a receber (30%): R$ {Number(adminDashboardStats?.custodyExpectedReturn || 0).toFixed(2)}
                </p>
              </article>
              <article className="rounded-lg border border-amber-400/25 bg-amber-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">Lucro Líquido Real (30 dias)</p>
                <p className="mt-1 font-display text-2xl text-amber-200">
                  R$ {Number(adminDashboardStats?.realNetProfitLast30Days || 0).toFixed(2)}
                </p>
                <p className="mt-2 text-[11px] text-amber-100/65">
                  Comissão realizada em atendimentos - taxas Stripe
                </p>
              </article>
              <article className="rounded-lg border border-violet-400/25 bg-violet-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-100/70">Ticket Médio (30 dias)</p>
                <p className="mt-1 font-display text-2xl text-violet-200">
                  R$ {Number(adminDashboardStats?.averageRechargeTicketLast30Days || 0).toFixed(2)}
                </p>
                <p className="mt-2 text-[11px] text-violet-100/55">
                  {Number(adminDashboardStats?.rechargeCountLast30Days || 0)} recargas aprovadas
                </p>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-lg border border-cyan-400/25 bg-cyan-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Total gasto em atendimento + perguntas (30 dias)</p>
                <p className="mt-1 font-display text-2xl text-cyan-200">
                  R$ {Number(adminDashboardStats?.serviceGrossUsedLast30Days || 0).toFixed(2)}
                </p>
              </article>
              <article className="rounded-lg border border-orange-400/25 bg-orange-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-orange-100/70">% paga aos consultores (30 dias)</p>
                <p className="mt-1 font-display text-2xl text-orange-200">
                  {Number(adminDashboardStats?.consultantSharePercentLast30Days || 0).toFixed(2)}%
                </p>
                <p className="mt-2 text-[11px] text-orange-100/65">
                  R$ {Number(adminDashboardStats?.consultantPayoutLast30Days || 0).toFixed(2)} repasse total
                </p>
                <p className="mt-1 text-[11px] text-orange-100/55">
                  R$ {Number(adminDashboardStats?.consultantServicePayoutLast30Days || 0).toFixed(2)} em atendimento/perguntas
                </p>
              </article>
              <article className="rounded-lg border border-lime-400/25 bg-lime-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-lime-100/70">% recebida pela plataforma (30 dias)</p>
                <p className="mt-1 font-display text-2xl text-lime-200">
                  {Number(adminDashboardStats?.platformSharePercentLast30Days || 0).toFixed(2)}%
                </p>
                <p className="mt-2 text-[11px] text-lime-100/65">
                  R$ {Number(adminDashboardStats?.platformCommissionRealizedLast30Days || 0).toFixed(2)} de comissão
                </p>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
                <h4 className="font-display text-lg text-mystic-goldSoft">Faturamento Diário</h4>
                <p className="text-xs text-ethereal-silver/65">Últimos registros por dia</p>
                <div className="mt-4 flex h-56 items-end gap-2 overflow-x-auto">
                  {dailyTotals.length === 0 ? (
                    <p className="text-sm text-ethereal-silver/70">Sem dados diários no período.</p>
                  ) : (
                    dailyTotals.map((item) => {
                      const total = Number(item.total) || 0
                      const height = Math.max(6, Math.round((total / maxDailyTotal) * 180))
                      return (
                        <div key={item.label} className="flex min-w-[48px] flex-col items-center gap-2">
                          <div className="text-[10px] text-amber-100/75">R$ {total.toFixed(0)}</div>
                          <div
                            className="w-8 rounded-t-md bg-gradient-to-t from-mystic-gold/80 to-amber-200/80"
                            style={{ height: `${height}px` }}
                            title={`${item.label}: R$ ${total.toFixed(2)}`}
                          />
                          <div className="text-[10px] text-ethereal-silver/70">{String(item.label).slice(5)}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
                <h4 className="font-display text-lg text-mystic-goldSoft">Resumo de Uso</h4>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg border border-mystic-gold/20 bg-black/30 p-3">
                    <p className="text-xs text-amber-100/65">Total de chamadas de vídeo</p>
                    <p className="font-display text-2xl text-mystic-goldSoft">
                      {Number(adminDashboardStats?.totalVideoCalls || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-mystic-gold/20 bg-black/30 p-3">
                    <p className="text-xs text-amber-100/65">Perguntas totais (3 + 5)</p>
                    <p className="font-display text-2xl text-mystic-goldSoft">
                      {Number(adminDashboardStats?.totalQuestions3 || 0) + Number(adminDashboardStats?.totalQuestions5 || 0)}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
                <h4 className="font-display text-lg text-mystic-goldSoft">Faturamento Mensal</h4>
                <p className="text-xs text-ethereal-silver/65">Comparativo por mês</p>
                <div className="mt-4 flex h-56 items-end gap-2 overflow-x-auto">
                  {monthlyTotals.length === 0 ? (
                    <p className="text-sm text-ethereal-silver/70">Sem dados mensais no período.</p>
                  ) : (
                    monthlyTotals.map((item) => {
                      const total = Number(item.total) || 0
                      const height = Math.max(6, Math.round((total / maxMonthlyTotal) * 180))
                      const monthLabel = String(item.label).slice(5)
                      return (
                        <div key={item.label} className="flex min-w-[58px] flex-col items-center gap-2">
                          <div className="text-[10px] text-amber-100/75">R$ {total.toFixed(0)}</div>
                          <div
                            className="w-9 rounded-t-md bg-gradient-to-t from-emerald-500/80 to-emerald-200/80"
                            style={{ height: `${height}px` }}
                            title={`${item.label}: R$ ${total.toFixed(2)}`}
                          />
                          <div className="text-[10px] text-ethereal-silver/70">{monthLabel}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
                <h4 className="font-display text-lg text-mystic-goldSoft">Top 10 Consultores (Ganhos)</h4>
                <div className="mt-3 grid gap-2">
                  {topConsultants.length === 0 ? (
                    <p className="text-sm text-ethereal-silver/70">Sem dados de ganhos ainda.</p>
                  ) : (
                    topConsultants.map((consultant, index) => (
                      <div
                        key={consultant.id}
                        className="flex items-center justify-between rounded-lg border border-mystic-gold/20 bg-black/30 px-3 py-2"
                      >
                        <p className="text-sm text-amber-50">
                          {index + 1}. {consultant.name}
                        </p>
                        <p className="text-sm font-semibold text-mystic-goldSoft">
                          R$ {Number(consultant.totalEarnings || 0).toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'recharges' && (
          <section className="grid gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-mystic-goldSoft">Aprovação de Saldo</h3>
              <p className="text-xs text-ethereal-silver/60">Total pendente: {rechargeRequests.length}</p>
            </div>
            <div className="grid gap-3">
              {rechargeRequests.length === 0 ? (
                <p className="rounded-lg border border-mystic-gold/20 bg-black/30 p-8 text-center text-ethereal-silver/60">
                  Nenhuma solicitação de recarga pendente.
                </p>
              ) : (
                rechargeRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-mystic-gold/20 bg-black/30 p-4"
                  >
                    <div className="grid gap-1">
                      <p className="font-medium text-amber-50">{req.userName}</p>
                      <p className="text-xs text-amber-100/60">{req.userEmail}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-xl text-mystic-goldSoft">R$ {Number(req.amount).toFixed(2)}</p>
                      <p className="text-[10px] uppercase tracking-wider text-amber-100/40">{req.method}</p>
                    </div>
                    <div className="text-right text-xs text-amber-100/50">
                      {new Date(req.createdAt).toLocaleString('pt-BR')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRechargeAction(req.id, 'approved')}
                        className="flex items-center gap-1 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 transition hover:bg-emerald-500/20"
                      >
                        <Check size={14} />
                        Aprovar
                      </button>
                      <button
                        onClick={() => onRechargeAction(req.id, 'rejected')}
                        className="flex items-center gap-1 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20"
                      >
                        <X size={14} />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'usuarios' && (
          <section className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-2xl text-mystic-goldSoft">Usuários da Plataforma</h3>
              <button
                onClick={() => onRefreshAdminUsers?.()}
                className="rounded-lg border border-mystic-gold/50 bg-mystic-gold/10 px-3 py-1.5 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/20"
              >
                Atualizar lista
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-mystic-gold/25">
              <table className="min-w-full divide-y divide-mystic-gold/20 text-sm">
                <thead className="bg-black/35">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Nome</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Email</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Saldo atual</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">3 perguntas</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">5 perguntas</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Consultas ao vivo</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mystic-gold/15 bg-black/20">
                  {(adminUsers || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-ethereal-silver/70">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    (adminUsers || []).map((user) => (
                      <tr key={user.id}>
                        <td className="px-3 py-2 text-amber-50">{user.name}</td>
                        <td className="px-3 py-2 text-amber-100/80">{user.email}</td>
                        <td className="px-3 py-2 text-mystic-goldSoft">R$ {Number(user.minutesBalance || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-ethereal-silver/85">{Number(user.threeQuestionsCount || 0)}</td>
                        <td className="px-3 py-2 text-ethereal-silver/85">{Number(user.fiveQuestionsCount || 0)}</td>
                        <td className="px-3 py-2 text-ethereal-silver/85">{Number(user.liveConsultationsCount || 0)}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => openEditUser(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-mystic-gold/60 px-2 py-1 text-[11px] text-mystic-goldSoft transition hover:bg-mystic-gold/10"
                          >
                            <Pencil size={12} />
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'consultores' && (
          <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
            <h3 className="font-display text-xl text-mystic-goldSoft">Pendentes de Aprovação</h3>
            <div className="mt-3 grid gap-3">
              {pendingConsultants.length === 0 && (
                <p className="rounded-lg border border-mystic-gold/20 bg-black/30 p-3 text-sm text-ethereal-silver/80">
                  Nenhum consultor pendente no momento.
                </p>
              )}
              {pendingConsultants.map((consultant) => (
                <div
                  key={consultant.id}
                  className="grid gap-3 rounded-lg border border-mystic-gold/20 bg-black/30 p-3 md:grid-cols-[56px_1fr_1fr_120px_130px_auto]"
                >
                  <img
                    src={consultant.photo}
                    alt={`Foto de ${consultant.name}`}
                    className="h-12 w-12 rounded-full border border-mystic-gold/60 object-cover"
                  />
                  <div>
                    <p className="text-amber-50">{consultant.name}</p>
                    <p className="text-xs text-amber-100/65">{consultant.email}</p>
                  </div>
                  <p className="text-sm text-ethereal-silver/85">
                    R$ {Number(consultant.pricePerMinute ?? 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-ethereal-silver/85">
                    {new Date(`${consultant.createdAt}T00:00:00`).toLocaleDateString('pt-BR')}
                  </p>
                  <button
                    onClick={() => onApprove(consultant.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/60 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                  >
                    <Check size={14} />
                    Aprovar
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'consultores' && (
          <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
            <h3 className="font-display text-xl text-mystic-goldSoft">Astrólogos Aprovados</h3>
            <div className="mt-3 grid gap-3">
              {consultants.map((consultant) => {
                const billed = getConsultantBilled(consultant.id)
                const payable = getConsultantPayable(consultant.id)
                const totalSessions = (consultant.baseConsultations ?? 0) + (consultant.realSessions ?? 0)

                return (
                  <div
                    key={consultant.id}
                    className="grid gap-3 rounded-lg border border-mystic-gold/20 bg-black/30 p-3 md:grid-cols-[56px_1fr_80px_110px_130px_120px_90px_100px_100px_auto]"
                  >
                    <img
                      src={consultant.photo}
                      alt={`Foto de ${consultant.name}`}
                      className="h-12 w-12 rounded-full border border-mystic-gold/60 object-cover"
                    />
                    <div>
                      <p className="text-sm text-amber-50">{consultant.name}</p>
                      <p className="text-[11px] text-ethereal-silver/70">{consultant.email}</p>
                      {consultant.isPremium && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-mystic-gold/55 bg-mystic-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-mystic-goldSoft">
                          <Star size={10} className="fill-current" />
                          Premium ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ethereal-silver/85">{consultant.status}</p>
                  <p className="text-xs text-ethereal-silver/85">
                    R$ {Number(consultant.pricePerMinute ?? 0).toFixed(2)}
                  </p>
                    <input
                      type="number"
                      min="0"
                      value={consultant.baseConsultations ?? 0}
                      onChange={(event) =>
                        updateConsultantBaseConsultations(
                          consultant.id,
                          Number(event.target.value) || 0,
                        )
                      }
                      className="rounded-lg border border-mystic-gold/35 bg-black/35 px-2 py-1 text-xs text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                    />
                    <p className="text-xs text-ethereal-silver/85">{consultant.realSessions ?? 0}</p>
                    <p className="text-xs text-ethereal-silver/85">{consultant.commissionOverride ?? globalCommission}%</p>
                    <p className="text-xs text-ethereal-silver/85">R$ {billed.toFixed(2)}</p>
                    <p className="text-xs text-ethereal-silver/85">R$ {payable.toFixed(2)}</p>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => onBlock(consultant.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-400/60 px-2 py-1 text-[11px] text-red-300 transition hover:bg-red-500/10"
                      >
                        <ShieldBan size={12} />
                        Bloquear
                      </button>
                      <button
                        onClick={() => onSaveConsultant(consultant.id, { isPremium: !consultant.isPremium })}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition ${
                          consultant.isPremium
                            ? 'border-mystic-gold/70 bg-mystic-gold/10 text-mystic-goldSoft hover:bg-mystic-gold/20'
                            : 'border-amber-300/40 text-amber-100/80 hover:bg-amber-500/10'
                        }`}
                      >
                        <Star size={12} className={consultant.isPremium ? 'fill-current' : ''} />
                        {consultant.isPremium ? 'Remover destaque' : 'Destacar'}
                      </button>
                      <button
                        onClick={() => openEditConsultant(consultant)}
                        className="inline-flex items-center gap-1 rounded-lg border border-mystic-gold/60 px-2 py-1 text-[11px] text-mystic-goldSoft transition hover:bg-mystic-gold/10"
                      >
                        <Pencil size={12} />
                        Editar
                      </button>
                    </div>
                    <p className="text-[11px] text-ethereal-silver/60 md:col-span-10">
                      Consultas totais: {totalSessions} • Média: {consultant.ratingAverage?.toFixed(1) ?? '0.0'}★
                    </p>
                  </div>
                )
              })}
            </div>
            <label className="mt-4 grid gap-2 text-sm text-amber-100/70">
              Comissão Global %
              <input
                type="number"
                value={commissionDraft}
                onChange={(event) => setCommissionDraft(event.target.value)}
                className="w-full rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2 md:w-56"
              />
            </label>
            <button
              onClick={saveCommission}
              disabled={!commissionDirty}
              className="mt-3 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Salvar comissão
            </button>
          </section>
        )}

        {activeTab === 'consultores' && (
          <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
            <h3 className="font-display text-xl text-mystic-goldSoft">Avaliações Mock</h3>
            <p className="mt-1 mb-4 text-xs text-amber-100/65">
              Crie avaliações de aparência real para os consultores ou gere automaticamente para todos de uma vez.
            </p>

            {/* Geração em massa */}
            <div className="mb-6 rounded-lg border border-mystic-gold/20 bg-black/30 p-4">
              <p className="mb-3 text-sm font-semibold text-amber-50">Geração automática (5 por consultor)</p>
              <p className="mb-4 text-xs text-amber-100/60">
                Insere 5 avaliações com nomes, notas e comentários realistas sobre clareza e assertividade em leitura de tarot para cada consultor aprovado.
              </p>
              <button
                onClick={runBulkMock}
                disabled={bulkMockSaving}
                className="inline-flex items-center gap-2 rounded-lg border border-violet-400/60 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition enabled:hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkMockSaving ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                {bulkMockSaving ? 'Gerando...' : 'Gerar para todos os consultores'}
              </button>
              {bulkMockFeedback && (
                <p className={`mt-3 text-xs ${bulkMockFeedback.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {bulkMockFeedback}
                </p>
              )}
            </div>

            {/* Formulário manual */}
            <div className="rounded-lg border border-mystic-gold/20 bg-black/30 p-4">
              <p className="mb-4 text-sm font-semibold text-amber-50">Adicionar avaliação manual</p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-amber-100/70">
                  Consultor
                  <select
                    value={mockReviewForm.consultantId}
                    onChange={e => setMockReviewForm(f => ({ ...f, consultantId: e.target.value }))}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                  >
                    <option value="">— selecione —</option>
                    {consultants.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-amber-100/70">
                  Nome do avaliador
                  <input
                    type="text"
                    placeholder="Ex: Mariana S."
                    value={mockReviewForm.displayName}
                    onChange={e => setMockReviewForm(f => ({ ...f, displayName: e.target.value }))}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 placeholder-amber-100/30 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                  />
                </label>
                <label className="grid gap-1 text-xs text-amber-100/70">
                  Tipo de consulta
                  <select
                    value={mockReviewForm.sessionType}
                    onChange={e => setMockReviewForm(f => ({ ...f, sessionType: e.target.value }))}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                  >
                    <option value="video">Vídeo</option>
                    <option value="question">Perguntas</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-amber-100/70">
                  Nota (1–5 estrelas)
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setMockReviewForm(f => ({ ...f, rating: star }))}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={24}
                          className={star <= mockReviewForm.rating ? 'fill-stardust-gold text-stardust-gold' : 'text-zinc-600'}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-amber-100/70">{mockReviewForm.rating} estrelas</span>
                  </div>
                </label>
              </div>
              <label className="mt-4 grid gap-1 text-xs text-amber-100/70">
                Comentário
                <textarea
                  rows={3}
                  maxLength={500}
                  value={mockReviewForm.comment}
                  onChange={e => setMockReviewForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Comentário realista sobre a leitura de tarot..."
                  className="resize-none rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 placeholder-amber-100/30 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                />
                <span className="text-right text-amber-100/40">{mockReviewForm.comment.length}/500</span>
              </label>
              <button
                onClick={saveMockReview}
                disabled={mockReviewSaving}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200 transition enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mockReviewSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                {mockReviewSaving ? 'Salvando...' : 'Adicionar avaliação'}
              </button>
              {mockReviewFeedback && (
                <p className={`mt-3 text-xs ${mockReviewFeedback.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mockReviewFeedback}
                </p>
              )}
            </div>
          </section>
        )}

        {activeTab === 'financeiro' && (
          <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
            <h3 className="font-display text-xl text-mystic-goldSoft">Pacotes de Recarga</h3>
            <p className="mt-1 text-xs text-amber-100/65">
              Defina valor padrão, valor promocional opcional e pacote mais escolhido.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {financeDraft.map((pack) => (
                <article
                  key={pack.id}
                  className={`rounded-lg border p-3 ${
                    featuredFinanceId === pack.id
                      ? 'border-mystic-gold/70 bg-mystic-gold/10'
                      : 'border-mystic-gold/35 bg-black/35'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-amber-50">{pack.minutes} min</p>
                    {featuredFinanceId === pack.id && (
                      <span className="rounded-full border border-mystic-gold/70 bg-mystic-gold/20 px-2 py-1 text-[10px] uppercase tracking-wide text-mystic-goldSoft">
                        Mais escolhido
                      </span>
                    )}
                  </div>
                  <label className="grid gap-1 text-xs text-amber-100/70">
                    Valor padrão (R$)
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={pack.price}
                      onChange={(event) =>
                        setFinanceDraft((prev) =>
                          prev.map((item) =>
                            item.id === pack.id ? { ...item, price: event.target.value } : item,
                          ),
                        )
                      }
                      className="rounded-lg border border-mystic-gold/35 bg-black/35 px-2 py-1.5 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                    />
                  </label>
                  <label className="mt-2 grid gap-1 text-xs text-amber-100/70">
                    Valor promocional opcional (R$)
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={pack.promoPrice}
                      onChange={(event) =>
                        setFinanceDraft((prev) =>
                          prev.map((item) =>
                            item.id === pack.id ? { ...item, promoPrice: event.target.value } : item,
                          ),
                        )
                      }
                      className="rounded-lg border border-mystic-gold/35 bg-black/35 px-2 py-1.5 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                    />
                  </label>
                  <button
                    onClick={() => setFeaturedFinanceId(pack.id)}
                    className="mt-3 w-full rounded-lg border border-mystic-gold/55 px-2 py-1.5 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/10"
                  >
                    Definir como mais escolhido
                  </button>
                </article>
              ))}
            </div>
            <button
              onClick={saveFinance}
              disabled={!financeDirty || financeSaving}
              className="mt-3 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {financeSaving ? 'Salvando pacotes...' : 'Salvar pacotes'}
            </button>
            {financeFeedback && <p className="mt-2 text-xs text-amber-100/80">{financeFeedback}</p>}
          </section>
        )}

        {activeTab === 'credenciais' && (
          <div className="grid gap-6">
            {/* Seção de informações de métodos de pagamento */}
            <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
              <div className="mb-3 flex items-start gap-2">
                <Info size={18} className="text-mystic-gold mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-display text-sm text-mystic-goldSoft">Meios de Pagamento Disponíveis</h3>
                  <div className="mt-2 text-xs text-ethereal-silver/75 space-y-1">
                    <p>✅ <strong>Stripe:</strong> Disponível (Cartões de Crédito)</p>
                    {mercadoPagoAvailable ? (
                      <p>✅ <strong>Mercado Pago:</strong> Disponível (Cartões + Boleto)</p>
                    ) : (
                      <p>❌ <strong>Mercado Pago:</strong> Não instalado (instale npm package para ativar)</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Seção Mercado Pago - condicionalizada */}
            {mercadoPagoAvailable && (
              <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl text-mystic-goldSoft">Mercado Pago</h3>
                    <p className="text-xs text-ethereal-silver/70">Credenciais para pagamentos com cartão.</p>
                  </div>
                  <button
                    onClick={() => handleSavePartial('mp')}
                    className="flex items-center gap-1 rounded-lg bg-mystic-gold/90 px-3 py-1 text-xs font-bold text-black transition hover:brightness-110"
                  >
                    <Save size={14} />
                    Salvar MP
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1.5 text-sm text-amber-100/75">
                    Public Key
                    <input
                      value={credentialsDraft.mpPublicKey}
                      onChange={(e) => setCredentialsDraft({ ...credentialsDraft, mpPublicKey: e.target.value })}
                      className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm text-amber-100/75">
                    Access Token
                    <input
                      type="password"
                      value={credentialsDraft.mpAccessToken}
                      onChange={(e) => setCredentialsDraft({ ...credentialsDraft, mpAccessToken: e.target.value })}
                      className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                    />
                  </label>
                </div>
              </section>
            )}

            <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl text-mystic-goldSoft">Configuração PIX</h3>
                  <p className="text-xs text-ethereal-silver/70">Dados para geração automática de QR Code.</p>
                </div>
                <button
                  onClick={() => handleSavePartial('pix')}
                  className="flex items-center gap-1 rounded-lg bg-mystic-gold/90 px-3 py-1 text-xs font-bold text-black transition hover:brightness-110"
                >
                  <Save size={14} />
                  Salvar PIX
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Chave PIX
                  <input
                    value={credentialsDraft.pixKey}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, pixKey: e.target.value })}
                    placeholder="Email, CPF ou Celular"
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Nome do Recebedor
                  <input
                    value={credentialsDraft.pixReceiverName}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, pixReceiverName: e.target.value })}
                    placeholder="Nome Completo"
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Cidade do Recebedor
                  <input
                    value={credentialsDraft.pixReceiverCity}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, pixReceiverCity: e.target.value })}
                    placeholder="Ex: Sao Paulo"
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl text-mystic-goldSoft">Stripe (Cartão de Crédito)</h3>
                  <p className="text-xs text-ethereal-silver/70">Credenciais para pagamentos com cartão via Stripe.</p>
                </div>
                <button
                  onClick={() => handleSavePartial('stripe')}
                  disabled={credentialsSaving}
                  className="flex items-center gap-1 rounded-lg bg-mystic-gold/90 px-3 py-1 text-xs font-bold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} />
                  {credentialsSaving ? 'Salvando...' : 'Salvar Stripe'}
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Chave Pública (Publishable Key)
                  <input
                    value={credentialsDraft.stripePublicKey}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, stripePublicKey: e.target.value })}
                    placeholder="pk_live_... ou pk_test_..."
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Chave Secreta (Secret Key)
                  <input
                    type="password"
                    value={credentialsDraft.stripeSecretKey}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, stripeSecretKey: e.target.value })}
                    placeholder="sk_live_... ou sk_test_..."
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl text-mystic-goldSoft">Daily.co (Vídeo)</h3>
                  <p className="text-xs text-ethereal-silver/70">Configurações das salas de atendimento.</p>
                </div>
                <button
                  onClick={() => handleSavePartial('daily')}
                  className="flex items-center gap-1 rounded-lg bg-mystic-gold/90 px-3 py-1 text-xs font-bold text-black transition hover:brightness-110"
                >
                  <Save size={14} />
                  Salvar Daily
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  API Key
                  <input
                    type="password"
                    value={credentialsDraft.dailyApiKey}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, dailyApiKey: e.target.value })}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Domínio
                  <input
                    value={credentialsDraft.dailyDomain}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, dailyDomain: e.target.value })}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Nome da Sala
                  <input
                    value={credentialsDraft.dailyRoomName}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, dailyRoomName: e.target.value })}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl text-mystic-goldSoft">Configurações de E-mail (SMTP)</h3>
                  <p className="text-xs text-ethereal-silver/70">Servidor para envio de e-mails transacionais.</p>
                </div>
                <button
                  onClick={() => handleSavePartial('smtp')}
                  className="flex items-center gap-1 rounded-lg bg-mystic-gold/90 px-3 py-1 text-xs font-bold text-black transition hover:brightness-110"
                >
                  <Save size={14} />
                  Salvar SMTP
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Servidor SMTP (Host)
                  <input
                    type="text"
                    value={credentialsDraft.smtpHost}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, smtpHost: e.target.value })}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                    placeholder="ex: smtp.hostinger.com"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Porta SMTP
                  <input
                    type="number"
                    value={credentialsDraft.smtpPort}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, smtpPort: e.target.value })}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                    placeholder="ex: 465"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Usuário (E-mail)
                  <input
                    type="text"
                    value={credentialsDraft.smtpUser}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, smtpUser: e.target.value })}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-amber-100/75">
                  Senha do E-mail
                  <input
                    type="password"
                    value={credentialsDraft.smtpPass}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, smtpPass: e.target.value })}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-amber-100/75 md:col-span-2">
                  E-mail de Remetente (From)
                  <input
                    type="text"
                    value={credentialsDraft.smtpFrom}
                    onChange={(e) => setCredentialsDraft({ ...credentialsDraft, smtpFrom: e.target.value })}
                    className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                    placeholder="ex: contato@appastria.online"
                  />
                </label>
              </div>
            </section>
            {credentialsFeedback && <p className="mt-2 text-xs text-amber-100/80">{credentialsFeedback}</p>}
          </div>
        )}
      </div>

      {activeTab === 'saques' && (
        <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
          <h3 className="font-display text-xl text-mystic-goldSoft">Solicitações de Saque</h3>
          <p className="mt-1 text-xs text-amber-100/65">
            Aprove para fazer o PIX ou rejeite para devolver o saldo ao consultor.
          </p>

          {totalPendingWithdrawals === 0 ? (
            <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/5 p-4 text-center text-sm text-emerald-200">
              Nenhuma solicitação de saque pendente.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {getPendingWithdrawals().map((withdrawal) => (
                <article
                  key={withdrawal.id}
                  className="rounded-lg border border-mystic-gold/30 bg-black/30 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-amber-50">{withdrawal.consultantName}</p>
                      <p className="text-[11px] text-ethereal-silver/60">
                        ID: {withdrawal.id}
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-200">
                      Pendente
                    </span>
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-ethereal-silver/60">Valor</p>
                      <p className="font-semibold text-mystic-goldSoft">
                        R$ {withdrawal.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-ethereal-silver/60">Data</p>
                      <p className="text-[12px] text-amber-100">
                        {new Date(withdrawal.createdAt).toLocaleDateString('pt-BR')} 
                        {' '}
                        {new Date(withdrawal.createdAt).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-widest text-ethereal-silver/60">Chave Pix</p>
                      <p className="text-[12px] break-all text-amber-100">{withdrawal.pixKey || 'Não informada'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-widest text-ethereal-silver/60">Beneficiário</p>
                      <p className="text-[12px] text-amber-100">{withdrawal.pixBeneficiaryName || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleApproveWithdrawal(withdrawal.consultantId, withdrawal.id)
                      }
                      className="flex-1 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                    >
                      <CheckCircle2 size={12} className="mb-0.5 inline" /> Concluído
                    </button>
                    <button
                      onClick={() =>
                        handleRejectWithdrawal(withdrawal.consultantId, withdrawal.id)
                      }
                      className="flex-1 rounded-lg border border-red-400/60 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                    >
                      <XCircle size={12} className="mb-0.5 inline" /> Rejeitar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {editingUser && userEditDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-mystic-gold/40 bg-[#140d17] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-display text-xl text-mystic-goldSoft">Editar usuário</h4>
              <button onClick={() => setEditingUser(null)} className="text-amber-100/70 hover:text-amber-50">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-amber-100/75">
                Nome
                <input
                  value={userEditDraft.name}
                  onChange={(e) => setUserEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                />
              </label>
              <label className="grid gap-1 text-sm text-amber-100/75">
                Email
                <input
                  value={userEditDraft.email}
                  onChange={(e) => setUserEditDraft((prev) => ({ ...prev, email: e.target.value }))}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                />
              </label>
              <label className="grid gap-1 text-sm text-amber-100/75">
                Perfil
                <select
                  value={userEditDraft.role}
                  onChange={(e) => setUserEditDraft((prev) => ({ ...prev, role: e.target.value }))}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                >
                  <option value="client">Cliente</option>
                  <option value="consultant">Consultor</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm text-amber-100/75">
                Data de nascimento
                <input
                  type="date"
                  value={userEditDraft.birthDate}
                  onChange={(e) => setUserEditDraft((prev) => ({ ...prev, birthDate: e.target.value }))}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                />
              </label>
              <label className="grid gap-1 text-sm text-amber-100/75">
                Saldo atual (R$)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={userEditDraft.minutesBalance}
                  onChange={(e) => setUserEditDraft((prev) => ({ ...prev, minutesBalance: e.target.value }))}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                />
              </label>
              <label className="grid gap-1 text-sm text-amber-100/75">
                Nova senha (opcional)
                <input
                  type="text"
                  value={userEditDraft.newPassword}
                  onChange={(e) => setUserEditDraft((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Deixe vazio para manter a senha atual"
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                />
              </label>
            </div>

            {userEditFeedback && <p className="mt-3 text-xs text-amber-100/80">{userEditFeedback}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-lg border border-amber-100/35 px-3 py-2 text-xs text-amber-100/80 transition hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditedUser}
                disabled={userEditSaving}
                className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {userEditSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingConsultantId && editForm && (
        <div className="mt-5 rounded-lg border border-mystic-gold/45 bg-black/35 p-4">
          <h4 className="font-display text-xl text-mystic-goldSoft">Editar Consultor</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 md:col-span-1">
              <span className="text-xs font-semibold text-amber-100">Nome Completo</span>
              <span className="text-[11px] text-ethereal-silver/65">Nome do consultor que aparece na plataforma</span>
              <input
                value={editForm.name ?? ''}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Nome"
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-1">
              <span className="text-xs font-semibold text-amber-100">E-mail</span>
              <span className="text-[11px] text-ethereal-silver/65">E-mail de contato da conta</span>
              <input
                value={editForm.email ?? ''}
                onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="E-mail"
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs font-semibold text-amber-100">Tagline</span>
              <span className="text-[11px] text-ethereal-silver/65">Descrição breve que aparece junto ao nome (ex: "Taróloga especialista em amor")</span>
              <input
                value={editForm.tagline ?? ''}
                onChange={(event) => setEditForm((prev) => ({ ...prev, tagline: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Tagline"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-amber-100">Consultas Base</span>
              <span className="text-[11px] text-ethereal-silver/65">Quantidade manual usada no total exibido do consultor</span>
              <input
                type="number"
                min="0"
                step="1"
                value={editForm.baseConsultations ?? '0'}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, baseConsultations: event.target.value }))
                }
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Consultas base"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-amber-100">Preço por Minuto (R$)</span>
              <span className="text-[11px] text-ethereal-silver/65">Valor cobrado por minuto na chamada de vídeo</span>
              <input
                type="number"
                min="1"
                step="0.5"
                value={editForm.pricePerMinute}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, pricePerMinute: event.target.value }))
                }
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Preço/min"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-amber-100">Pacote 3 Perguntas (R$)</span>
              <span className="text-[11px] text-ethereal-silver/65">Preço fixo para responder 3 perguntas</span>
              <input
                type="number"
                min="1"
                step="0.5"
                value={editForm.priceThreeQuestions}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, priceThreeQuestions: event.target.value }))
                }
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="3 perguntas"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-amber-100">Pacote 5 Perguntas (R$)</span>
              <span className="text-[11px] text-ethereal-silver/65">Preço fixo para responder 5 perguntas</span>
              <input
                type="number"
                min="1"
                step="0.5"
                value={editForm.priceFiveQuestions}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, priceFiveQuestions: event.target.value }))
                }
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="5 perguntas"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-amber-100">Avaliação Média</span>
              <span className="text-[11px] text-ethereal-silver/65">Classificação média do consultor (0-5 estrelas)</span>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={editForm.ratingAverage}
                onChange={(event) => setEditForm((prev) => ({ ...prev, ratingAverage: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Média"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-amber-100">Comissão Override (%)</span>
              <span className="text-[11px] text-ethereal-silver/65">Percentual customizado (deixar em branco para usar global)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={editForm.commissionOverride ?? ''}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, commissionOverride: event.target.value }))
                }
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Comissão override %"
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs font-semibold text-amber-100">Status</span>
              <span className="text-[11px] text-ethereal-silver/65">Estado atual do consultor na plataforma</span>
              <select
                value={editForm.status ?? 'Online'}
                onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              >
                <option>Online</option>
                <option>Ocupado</option>
                <option>Offline</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={saveEditConsultant}
              className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Salvar alterações
            </button>
            <button
              onClick={() => {
                setEditingConsultantId(null)
                setEditForm(null)
              }}
              className="rounded-lg border border-mystic-gold/45 px-3 py-2 text-xs text-ethereal-silver/80 transition hover:bg-mystic-gold/10"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
