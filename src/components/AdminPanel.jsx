import { useMemo, useState } from 'react'
import { Check, CreditCard, Landmark, Pencil, ShieldBan } from 'lucide-react'
import { GlassCard } from './GlassCard'

export function AdminPanel({
  consultants,
  pendingConsultants,
  minutePackages,
  updateMinutePackage,
  setFeaturedPackage,
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
}) {
  const [activeTab, setActiveTab] = useState('consultores')
  const [editingConsultantId, setEditingConsultantId] = useState(null)
  const [editForm, setEditForm] = useState(null)
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
    publicKey: mpCredentials?.publicKey ?? '',
    accessToken: mpCredentials?.accessToken ?? '',
    webhookSecret: mpCredentials?.webhookSecret ?? '',
    dailyApiKey: dailyCredentials?.apiKey ?? '',
    dailyDomain: dailyCredentials?.domain ?? '',
    dailyRoomName: dailyCredentials?.roomName ?? '',
  })
  const [credentialsSaving, setCredentialsSaving] = useState(false)
  const [credentialsFeedback, setCredentialsFeedback] = useState('')

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

  const saveFinance = () => {
    const normalizedFinance = financeDraft.map((pack) => ({
      ...pack,
      price: parseNumberValue(pack.price).toString(),
      promoPrice: parseNullableNumberValue(pack.promoPrice)?.toString() ?? '',
    }))
    setFinanceDraft(normalizedFinance)
    financeDraft.forEach((pack) => {
      updateMinutePackage(pack.id, {
        price: parseNumberValue(pack.price),
        promoPrice: parseNullableNumberValue(pack.promoPrice),
      })
    })
    if (featuredFinanceId) {
      setFeaturedPackage(featuredFinanceId)
    }
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
      return
    }
    onSaveConsultant(editingConsultantId, {
      name: editForm.name.trim(),
      email: editForm.email.trim().toLowerCase(),
      tagline: editForm.tagline.trim(),
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

  return (
    <GlassCard
      title="Painel Administrativo"
      subtitle="Gestão de consultores, financeiro e regras de comissão."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={tabButtonClass('consultores')} onClick={() => setActiveTab('consultores')}>
          <Check size={14} />
          Consultores
        </button>
        <button className={tabButtonClass('financeiro')} onClick={() => setActiveTab('financeiro')}>
          <CreditCard size={14} />
          Recarga
        </button>
        <button className={tabButtonClass('credenciais')} onClick={() => setActiveTab('credenciais')}>
          <Landmark size={14} />
          Credenciais
        </button>
      </div>
      <div className="grid gap-5">
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
              disabled={!financeDirty}
              className="mt-3 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Salvar pacotes
            </button>
          </section>
        )}

        {activeTab === 'credenciais' && (
          <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
            <h3 className="font-display text-xl text-mystic-goldSoft">Credenciais de Integração</h3>
            <p className="mt-1 text-xs text-ethereal-silver/70">Mercado Pago, Daily.co e PIX</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-amber-100/75">
                Public Key
                <input
                  value={credentialsDraft.publicKey}
                  onChange={(event) =>
                    setCredentialsDraft((prev) => ({ ...prev, publicKey: event.target.value }))
                  }
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                />
              </label>
              <label className="grid gap-2 text-sm text-amber-100/75">
                Access Token
                <input
                  value={credentialsDraft.accessToken}
                  onChange={(event) =>
                    setCredentialsDraft((prev) => ({ ...prev, accessToken: event.target.value }))
                  }
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                />
              </label>
              <label className="grid gap-2 text-sm text-amber-100/75">
                Webhook Secret
                <input
                  value={credentialsDraft.webhookSecret}
                  onChange={(event) =>
                    setCredentialsDraft((prev) => ({ ...prev, webhookSecret: event.target.value }))
                  }
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                />
              </label>
              <label className="grid gap-2 text-sm text-amber-100/75">
                Daily API Key
                <input
                  value={credentialsDraft.dailyApiKey}
                  onChange={(event) =>
                    setCredentialsDraft((prev) => ({ ...prev, dailyApiKey: event.target.value }))
                  }
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                />
              </label>
              <label className="grid gap-2 text-sm text-amber-100/75">
                Daily Domain
                <input
                  value={credentialsDraft.dailyDomain}
                  onChange={(event) =>
                    setCredentialsDraft((prev) => ({ ...prev, dailyDomain: event.target.value }))
                  }
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                />
              </label>
              <label className="grid gap-2 text-sm text-amber-100/75">
                Daily Room Name
                <input
                  value={credentialsDraft.dailyRoomName}
                  onChange={(event) =>
                    setCredentialsDraft((prev) => ({ ...prev, dailyRoomName: event.target.value }))
                  }
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                />
              </label>
              <label className="grid gap-2 text-sm text-amber-100/75">
                Chave PIX
                <input
                  value={credentialsDraft.pixKey || ''}
                  onChange={(event) =>
                    setCredentialsDraft((prev) => ({ ...prev, pixKey: event.target.value }))
                  }
                  placeholder="E-mail, CPF ou Aleatória"
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                />
              </label>
              <label className="grid gap-2 text-sm text-amber-100/75">
                Código Copia e Cola PIX
                <textarea
                  value={credentialsDraft.pixCopyPaste || ''}
                  onChange={(event) =>
                    setCredentialsDraft((prev) => ({ ...prev, pixCopyPaste: event.target.value }))
                  }
                  rows={1}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                />
              </label>
              <label className="grid gap-2 text-sm text-amber-100/75 md:col-span-2">
                QR Code PIX (Base64)
                <textarea
                  value={credentialsDraft.pixQR || ''}
                  onChange={(event) =>
                    setCredentialsDraft((prev) => ({ ...prev, pixQR: event.target.value }))
                  }
                  rows={1}
                  placeholder="data:image/png;base64,..."
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                />
              </label>
            </div>
            <button
              onClick={saveCredentials}
              disabled={!credentialsDirty || credentialsSaving}
              className="mt-3 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {credentialsSaving ? 'Salvando credenciais...' : 'Salvar credenciais'}
            </button>
            {credentialsFeedback && <p className="mt-2 text-xs text-amber-100/80">{credentialsFeedback}</p>}
          </section>
        )}
      </div>
      {editingConsultantId && editForm && (
        <div className="mt-5 rounded-lg border border-mystic-gold/45 bg-black/35 p-4">
          <h4 className="font-display text-xl text-mystic-goldSoft">Editar Consultor</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={editForm.name ?? ''}
              onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              placeholder="Nome"
            />
            <input
              value={editForm.email ?? ''}
              onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              placeholder="E-mail"
            />
            <input
              value={editForm.tagline ?? ''}
              onChange={(event) => setEditForm((prev) => ({ ...prev, tagline: event.target.value }))}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2 md:col-span-2"
              placeholder="Tagline"
            />
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
            <input
              type="number"
              min="0"
              step="0.1"
              value={editForm.ratingAverage}
              onChange={(event) => setEditForm((prev) => ({ ...prev, ratingAverage: event.target.value }))}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              placeholder="Média"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={editForm.commissionOverride ?? ''}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, commissionOverride: event.target.value }))
              }
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              placeholder="Comissão override %"
            />
            <select
              value={editForm.status ?? 'Online'}
              onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2 md:col-span-2"
            >
              <option>Online</option>
              <option>Ocupado</option>
              <option>Offline</option>
            </select>
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
