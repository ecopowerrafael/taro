import { useEffect, useMemo, useState } from 'react'
import { SendHorizontal, Wallet, Lock, UserPlus, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'
import { usePlatformContext } from '../context/platform-context'
import { ConsultantAvailabilityService } from '../services/consultantAvailabilityService'

export function AreaConsultorPage() {
  const {
    profile,
    isConsultant,
    isAdmin,
    userConsultantProfile,
    consultants,
    updateConsultantByAdmin,
    questionRequests,
    respondToQuestionRequest,
    consultantWallets,
    setConsultantPixKey,
    requestConsultantWithdrawal,
    minWithdrawalAmount,
    updateConsultantAvailability,
    authLoading,
  } = usePlatformContext()

  const [selectedConsultantId, setSelectedConsultantId] = useState('')
  const [gainFilter, setGainFilter] = useState('total')
  const [pixDraft, setPixDraft] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [panelNotice, setPanelNotice] = useState('')
  const [responseDrafts, setResponseDrafts] = useState({})
  const [profileDraft, setProfileDraft] = useState(null)
  const [referenceTimestamp] = useState(() => Date.now())
  const availabilityService = useMemo(() => new ConsultantAvailabilityService(), [])

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
        pricePerMinute: userConsultantProfile.pricePerMinute,
        priceThreeQuestions: userConsultantProfile.priceThreeQuestions,
        priceFiveQuestions: userConsultantProfile.priceFiveQuestions,
      })
    } else if (isAdmin && consultants.length > 0) {
      // Se for admin mas não tiver perfil de consultor, mostra o primeiro da lista
      setSelectedConsultantId(consultants[0].id)
    }
  }, [userConsultantProfile, isAdmin, consultants])

  const selectedConsultant = consultants.find((consultant) => consultant.id === selectedConsultantId)

  // Renderização condicional para quem não é consultor
  if (!authLoading && !isConsultant && !isAdmin) {
    return (
      <PageShell title="Área do Consultor" subtitle="Painel Restrito">
        <div className="flex flex-col items-center justify-center py-12">
          <GlassCard className="max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-mystic-gold/10 p-6 text-mystic-gold">
                <Lock size={48} />
              </div>
            </div>
            <h2 className="mb-4 font-display text-3xl text-mystic-goldSoft">Acesso Restrito</h2>
            <p className="mb-8 text-amber-100/70">
              Esta área é exclusiva para nossos consultores. Se você é um tarólogo experiente, 
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
    transactions: [],
    withdrawals: [],
  }

  const pendingRequests = questionRequests.filter(
    (request) => request.consultantId === selectedConsultantId && request.status === 'pending',
  )
  const answeredRequests = questionRequests.filter(
    (request) => request.consultantId === selectedConsultantId && request.status === 'answered',
  )

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

  useEffect(() => {
    return () => {
      void availabilityService.goOffline()
    }
  }, [availabilityService])

  const handleSelectConsultant = async (consultantId) => {
    // Apenas permitir trocar se for admin
    if (!isAdmin) return

    const previousConsultantId = selectedConsultantId
    if (previousConsultantId && previousConsultantId !== consultantId) {
      const previousConsultant = consultants.find((item) => item.id === previousConsultantId)
      if (previousConsultant?.status === 'Online') {
        await availabilityService.goOffline()
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
      pricePerMinute: consultant.pricePerMinute,
      priceThreeQuestions: consultant.priceThreeQuestions,
      priceFiveQuestions: consultant.priceFiveQuestions,
    })
  }

  const handleToggleAvailability = async () => {
    if (!selectedConsultantId || !selectedConsultant) {
      return
    }

    try {
      if (isSelectedConsultantOnline) {
        await availabilityService.goOffline()
        updateConsultantAvailability(selectedConsultantId, false)
        setPanelNotice('Você ficou offline e não receberá novas chamadas.')
        return
      }

      await availabilityService.goOnline({
        consultantId: selectedConsultantId,
        consultantName: selectedConsultant.name,
        onIncomingCall: (payload) => {
          setPanelNotice(
            `Chamada recebida de ${payload?.callerName ?? 'cliente'}. Toque e notificação ativados.`,
          )
        },
        onError: (message) => {
          setPanelNotice(message)
        },
      })
      updateConsultantAvailability(selectedConsultantId, true)
      setPanelNotice('Você ficou online. Wake Lock e escuta de chamadas foram ativados.')
    } catch {
      await availabilityService.goOffline()
      updateConsultantAvailability(selectedConsultantId, false)
      setPanelNotice('Não foi possível ativar o modo online no momento.')
    }
  }

  const handleSilenceIncomingAlert = async () => {
    availabilityService.stopIncomingCallAlert()
    await availabilityService.closeIncomingNotifications()
    setPanelNotice('Alerta de chamada silenciado.')
  }

  const handleRespond = (requestId) => {
    const answerSummary = (responseDrafts[requestId] ?? '').trim()
    if (!answerSummary) {
      setPanelNotice('Preencha uma resposta antes de concluir o atendimento.')
      return
    }
    respondToQuestionRequest({
      requestId,
      consultantId: selectedConsultantId,
      answerSummary,
    })
    setResponseDrafts((prev) => ({ ...prev, [requestId]: '' }))
    setPanelNotice('Resposta enviada e valor líquido creditado na carteira do consultor.')
  }

  const handleSavePix = () => {
    if (!pixDraft.trim()) {
      setPanelNotice('Informe uma chave PIX válida.')
      return
    }
    setConsultantPixKey({ consultantId: selectedConsultantId, pixKey: pixDraft.trim() })
    setPixDraft('')
    setPanelNotice('Chave PIX salva com sucesso.')
  }

  const handleRequestWithdrawal = () => {
    const amount = Number(withdrawAmount)
    if (!amount || amount <= 0) {
      setPanelNotice('Informe um valor de saque válido.')
      return
    }
    const result = requestConsultantWithdrawal({ consultantId: selectedConsultantId, amount })
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
      setPanelNotice('Selecione um arquivo de imagem válido.')
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

  const handleSaveProfile = () => {
    if (!selectedConsultantId || !profileDraft) {
      return
    }
    updateConsultantByAdmin(selectedConsultantId, {
      name: profileDraft.name.trim(),
      email: profileDraft.email.trim().toLowerCase(),
      tagline: profileDraft.tagline.trim(),
      description: profileDraft.description.trim(),
      photo: profileDraft.photo.trim(),
      pricePerMinute: Number(profileDraft.pricePerMinute) || 0,
      priceThreeQuestions: Number(profileDraft.priceThreeQuestions) || 0,
      priceFiveQuestions: Number(profileDraft.priceFiveQuestions) || 0,
    })
    setPanelNotice('Perfil do consultor atualizado com sucesso.')
  }

  return (
    <PageShell
      title="Área do Consultor"
      subtitle="Atendimentos de perguntas, carteira e saques do consultor."
    >
      <GlassCard title="Atendimento do Consultor" subtitle="Visualize e responda cada item enviado pelo cliente.">
        <div className="mb-3 flex flex-wrap items-center gap-2">
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
          <span className="text-xs text-ethereal-silver/80">
            Pendentes: {pendingRequests.length} • Respondidas: {answeredRequests.length}
          </span>
          <span
            className={`rounded-full border px-2 py-1 text-[11px] ${
              isSelectedConsultantOnline
                ? 'border-emerald-400/65 bg-emerald-500/10 text-emerald-300'
                : 'border-zinc-400/55 bg-zinc-500/10 text-zinc-300'
            }`}
          >
            {isSelectedConsultantOnline ? 'Online' : 'Offline'}
          </span>
          <button
            onClick={() => {
              void handleToggleAvailability()
            }}
            className={`rounded-lg border px-3 py-2 text-xs transition ${
              isSelectedConsultantOnline
                ? 'border-red-400/60 bg-red-500/10 text-red-200 hover:bg-red-500/20'
                : 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
            }`}
          >
            {isSelectedConsultantOnline ? 'Ficar offline' : 'Ficar online'}
          </button>
          <button
            onClick={() => {
              void handleSilenceIncomingAlert()
            }}
            className="rounded-lg border border-mystic-gold/45 px-3 py-2 text-xs text-ethereal-silver/80 transition hover:bg-mystic-gold/10"
          >
            Silenciar alerta
          </button>
        </div>
        <div className="grid gap-3">
          {pendingRequests.length === 0 && (
            <p className="rounded-lg border border-mystic-gold/25 bg-black/30 p-3 text-sm text-ethereal-silver/80">
              Sem perguntas pendentes para {selectedConsultant?.name ?? 'consultor'}.
            </p>
          )}
          {pendingRequests.map((request) => (
            <article key={request.id} className="rounded-xl border border-mystic-gold/35 bg-black/30 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-amber-50">
                  Cliente: {request.customerName} • Pacote {request.questionCount} perguntas
                </p>
                <span className="text-xs text-mystic-goldSoft">Valor: R$ {request.packagePrice.toFixed(2)}</span>
              </div>
              <div className="grid gap-2">
                {request.entries.map((entry, index) => (
                  <div key={entry.id} className="rounded-lg border border-mystic-gold/20 bg-black/35 p-2">
                    <p className="text-xs text-ethereal-silver/70">Pergunta {index + 1}</p>
                    {entry.type === 'text' ? (
                      <p className="text-sm text-ethereal-silver/90">{entry.text}</p>
                    ) : (
                      <p className="text-sm text-ethereal-silver/90">
                        Áudio: {entry.fileName} ({Math.round(entry.durationSeconds)}s)
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <textarea
                rows={3}
                value={responseDrafts[request.id] ?? ''}
                onChange={(event) =>
                  setResponseDrafts((prev) => ({ ...prev, [request.id]: event.target.value }))
                }
                placeholder="Responder este atendimento..."
                className="mt-3 w-full rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              />
              <button
                onClick={() => handleRespond(request.id)}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-mystic-gold/70 bg-mystic-gold/15 px-3 py-2 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/25"
              >
                <SendHorizontal size={14} />
                Enviar resposta e concluir
              </button>
            </article>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Editar Meu Perfil" subtitle="Atualize dados públicos e preços do seu atendimento.">
        {profileDraft && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              Imagem de perfil
              <span className="text-[11px] text-ethereal-silver/65">Envie uma imagem do seu dispositivo para atualizar o card público.</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              />
              <div className="mt-1 flex items-center gap-3 rounded-lg border border-mystic-gold/20 bg-black/30 p-2">
                <img
                  src={profileDraft.photo || selectedConsultant?.photo}
                  alt="Prévia da foto do perfil"
                  className="h-14 w-14 rounded-full border border-mystic-gold/55 object-cover"
                />
                <p className="text-[11px] text-ethereal-silver/70">Prévia da imagem exibida para clientes.</p>
              </div>
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              Nome público
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
              <span className="text-[11px] text-ethereal-silver/65">Usado para identificação administrativa do consultor.</span>
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
              Descrição completa
              <span className="text-[11px] text-ethereal-silver/65">Explique sua abordagem, especialidades e diferenciais.</span>
              <textarea
                rows={3}
                value={profileDraft.description}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, description: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Descrição"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              Preço por minuto (R$)
              <span className="text-[11px] text-ethereal-silver/65">Valor cobrado no atendimento por vídeo.</span>
              <input
                type="number"
                min="1"
                step="0.5"
                value={profileDraft.pricePerMinute}
                onChange={(event) =>
                  setProfileDraft((prev) => ({ ...prev, pricePerMinute: event.target.value }))
                }
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Preço por minuto"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              Pacote 3 perguntas (R$)
              <span className="text-[11px] text-ethereal-silver/65">Valor fechado para responder 3 perguntas.</span>
              <input
                type="number"
                min="1"
                step="0.5"
                value={profileDraft.priceThreeQuestions}
                onChange={(event) =>
                  setProfileDraft((prev) => ({ ...prev, priceThreeQuestions: event.target.value }))
                }
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Preço 3 perguntas"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              Pacote 5 perguntas (R$)
              <span className="text-[11px] text-ethereal-silver/65">Valor fechado para responder 5 perguntas.</span>
              <input
                type="number"
                min="1"
                step="0.5"
                value={profileDraft.priceFiveQuestions}
                onChange={(event) =>
                  setProfileDraft((prev) => ({ ...prev, priceFiveQuestions: event.target.value }))
                }
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="Preço 5 perguntas"
              />
            </label>
            <button
              onClick={handleSaveProfile}
              className="rounded-lg border border-mystic-gold/70 bg-mystic-gold/15 px-3 py-2 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/25 md:col-span-2"
            >
              Salvar perfil
            </button>
          </div>
        )}
      </GlassCard>

      <GlassCard title="Carteira do Consultor" subtitle="Controle de ganhos, PIX e solicitação de saque.">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ethereal-silver/70">Saldo disponível</p>
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
            <button
              onClick={handleSavePix}
              className="mt-2 rounded-lg border border-mystic-gold/60 px-3 py-2 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/10"
            >
              Salvar chave PIX
            </button>
          </div>

          <div className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-sm text-ethereal-silver/85">Solicitar saque</p>
            <input
              type="number"
              min={minWithdrawalAmount}
              step="0.5"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              placeholder={`Mínimo R$ ${minWithdrawalAmount.toFixed(2)}`}
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
              {filter === 'daily' && 'Diário'}
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
      </GlassCard>
    </PageShell>
  )
}
