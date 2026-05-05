import { useEffect, useMemo, useState } from 'react'
import { SendHorizontal, Wallet, Lock, UserPlus, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'
import { AudioRecorder } from '../components/AudioRecorder'
import { usePlatformContext } from '../context/platform-context'
import { ConsultantAvailabilityService } from '../services/consultantAvailabilityService'
import { useTranslation } from 'react-i18next'

export function AreaConsultorPage() {
  const { t } = useTranslation()
  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      if (!blob) {
        resolve('')
        return
      }
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error(t('consultant_area.errors.audio_process', 'Não foi possível processar o áudio da resposta.')))
      reader.readAsDataURL(blob)
    })

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
    token,
  } = usePlatformContext()

  const [selectedConsultantId, setSelectedConsultantId] = useState('')
  const [gainFilter, setGainFilter] = useState('total')
  const [pixDraft, setPixDraft] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [panelNotice, setPanelNotice] = useState('')
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)
  const [responseDrafts, setResponseDrafts] = useState({})
  const [profileDraft, setProfileDraft] = useState(null)
  const [pendingVideoSessions, setPendingVideoSessions] = useState([])

  // Polling para novas chamadas de v\u00eddeo
  useEffect(() => {
    if (!token || isAdmin) return

    const fetchPendingVideo = async () => {
      try {
        const res = await fetch('/api/video-sessions/pending', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setPendingVideoSessions(data)
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
  const availabilityService = useMemo(() => new ConsultantAvailabilityService(), [])

  const formatInitialCurrency = (val) => {
    const num = Number(val) || 0
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
      // Se for admin mas não tiver perfil de consultor, mostra o primeiro da lista
      setSelectedConsultantId(consultants[0].id)
    }
  }, [userConsultantProfile, isAdmin, consultants])

  const selectedConsultant = consultants.find((consultant) => consultant.id === selectedConsultantId)

  // Renderização condicional para quem não é consultor
  if (!authLoading && !isConsultant && !isAdmin) {
    return (
      <PageShell title={t('consultant_area.page.title', 'Área do Consultor')} subtitle={t('consultant_area.restricted.subtitle', 'Painel Restrito')}>
        <div className="flex flex-col items-center justify-center py-12">
          <GlassCard className="max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-mystic-gold/10 p-6 text-mystic-gold">
                <Lock size={48} />
              </div>
            </div>
            <h2 className="mb-4 font-display text-3xl text-mystic-goldSoft">{t('consultant_area.restricted.title', 'Acesso Restrito')}</h2>
            <p className="mb-8 text-amber-100/70">
              {t('consultant_area.restricted.description', 'Esta área é exclusiva para nossos consultores. Se você é um tarólogo experiente, venha fazer parte do nosso time!')}
            </p>
            <div className="flex flex-col gap-4">
              <Link
                to="/seja-consultor"
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mystic-gold to-amber-500 px-8 py-3 font-bold text-black transition hover:brightness-110"
              >
                <UserPlus size={20} />
                {t('consultant_area.restricted.become_consultant', 'Torne-se um Consultor')}
              </Link>
              <Link
                to="/"
                className="text-sm text-amber-100/50 hover:text-mystic-goldSoft transition"
              >
                {t('consultant_area.restricted.back_home', 'Voltar para a Home')}
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
      pricePerMinute: formatInitialCurrency(consultant.pricePerMinute),
      priceThreeQuestions: formatInitialCurrency(consultant.priceThreeQuestions),
      priceFiveQuestions: formatInitialCurrency(consultant.priceFiveQuestions),
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
        setPanelNotice(t('consultant_area.notices.went_offline', 'Você ficou offline e não receberá novas chamadas.'))
        return
      }

      await availabilityService.goOnline({
        consultantId: selectedConsultantId,
        consultantName: selectedConsultant.name,
        onIncomingCall: (payload) => {
          setPanelNotice(
            `${t('consultant_area.notices.incoming_call_prefix', 'Chamada recebida de')} ${payload?.callerName ?? t('consultant_area.notices.customer', 'cliente')}. ${t('consultant_area.notices.incoming_call_suffix', 'Toque e notificação ativados.')}`,
          )
        },
        onError: (message) => {
          setPanelNotice(message)
        },
      })
      updateConsultantAvailability(selectedConsultantId, true)
      setPanelNotice(t('consultant_area.notices.went_online', 'Você ficou online. Wake Lock e escuta de chamadas foram ativados.'))
    } catch {
      await availabilityService.goOffline()
      updateConsultantAvailability(selectedConsultantId, false)
      setPanelNotice(t('consultant_area.notices.cannot_go_online', 'Não foi possível ativar o modo online no momento.'))
    }
  }

  const handleSilenceIncomingAlert = async () => {
    availabilityService.stopIncomingCallAlert()
    await availabilityService.closeIncomingNotifications()
    setPanelNotice(t('consultant_area.notices.alert_silenced', 'Alerta de chamada silenciado.'))
  }

  const getResponseEntryDraft = (requestId, questionIndex) => {
    const currentAnswers = Array.isArray(responseDrafts[requestId]) ? responseDrafts[requestId] : []
    const currentEntry = currentAnswers[questionIndex]

    if (typeof currentEntry === 'string') {
      return {
        type: 'text',
        text: currentEntry,
        audioDataUrl: '',
        durationSeconds: 0,
      }
    }

    return {
      type: currentEntry?.type === 'audio' ? 'audio' : 'text',
      text: currentEntry?.text ?? '',
      audioDataUrl: currentEntry?.audioDataUrl ?? '',
      durationSeconds: Number(currentEntry?.durationSeconds) || 0,
    }
  }

  const setResponseEntryDraft = (requestId, questionIndex, updater) => {
    setResponseDrafts((prev) => {
      const currentAnswers = Array.isArray(prev[requestId]) ? prev[requestId] : []
      const nextAnswers = [...currentAnswers]
      const rawCurrentEntry = currentAnswers[questionIndex]
      const currentEntry =
        typeof rawCurrentEntry === 'string'
          ? { type: 'text', text: rawCurrentEntry, audioDataUrl: '', durationSeconds: 0 }
          : {
              type: rawCurrentEntry?.type === 'audio' ? 'audio' : 'text',
              text: rawCurrentEntry?.text ?? '',
              audioDataUrl: rawCurrentEntry?.audioDataUrl ?? '',
              durationSeconds: Number(rawCurrentEntry?.durationSeconds) || 0,
            }
      const nextEntry =
        typeof updater === 'function' ? updater(currentEntry) : { ...currentEntry, ...updater }
      nextAnswers[questionIndex] = nextEntry
      return { ...prev, [requestId]: nextAnswers }
    })
  }

  const handleResponseTypeChange = (requestId, questionIndex, type) => {
    if (type === 'audio') {
      setResponseEntryDraft(requestId, questionIndex, {
        type: 'audio',
        text: '',
        audioDataUrl: '',
        durationSeconds: 0,
      })
      return
    }
    setResponseEntryDraft(requestId, questionIndex, {
      type: 'text',
      audioDataUrl: '',
      durationSeconds: 0,
    })
  }

  const handleResponseChange = (requestId, questionIndex, value) => {
    setResponseEntryDraft(requestId, questionIndex, (prevEntry) => ({
      ...prevEntry,
      type: 'text',
      text: value,
      audioDataUrl: '',
      durationSeconds: 0,
    }))
  }

  const handleResponseAudioRecorded = async (requestId, questionIndex, blob, duration) => {
    try {
      const audioDataUrl = await blobToDataUrl(blob)
      setResponseEntryDraft(requestId, questionIndex, {
        type: 'audio',
        text: '',
        audioDataUrl,
        durationSeconds: duration,
      })
    } catch (error) {
      setPanelNotice(error.message || t('consultant_area.errors.audio_prepare', 'Erro ao preparar áudio da resposta.'))
    }
  }

  const handleResponseAudioSave = async (requestId, questionIndex, blob, duration) => {
    await handleResponseAudioRecorded(requestId, questionIndex, blob, duration)
    setPanelNotice(`${t('consultant_area.notices.audio_saved_prefix', 'Áudio da resposta')} ${questionIndex + 1} ${t('consultant_area.notices.audio_saved_suffix', 'salvo.')}`)
  }

  const handleSubmitResponse = async (requestId) => {
    if (isSubmittingResponse) {
      return
    }
    const request = pendingRequests.find((item) => item.id === requestId)
    if (!request) {
      setPanelNotice(t('consultant_area.errors.request_not_found', 'Atendimento não encontrado ou já respondido.'))
      return
    }

    const answers = Array.isArray(responseDrafts[requestId]) ? responseDrafts[requestId] : []
    const normalizedAnswers = request.entries.map((_, index) => {
      const answer = answers[index]
      if (typeof answer === 'string') {
        return {
          type: 'text',
          text: answer,
          audioDataUrl: '',
          durationSeconds: 0,
        }
      }
      return {
        type: answer?.type === 'audio' ? 'audio' : 'text',
        text: answer?.text ?? '',
        audioDataUrl: answer?.audioDataUrl ?? '',
        durationSeconds: Number(answer?.durationSeconds) || 0,
      }
    })

    const missingAnswer = normalizedAnswers.some(
      (entry) =>
        (entry.type === 'text' && !String(entry.text || '').trim()) ||
        (entry.type === 'audio' && !entry.audioDataUrl),
    )
    if (missingAnswer) {
      setPanelNotice(t('consultant_area.errors.answer_all_required', 'Responda todas as perguntas antes de enviar.'))
      return
    }

    const answeredEntries = request.entries.map((entry, index) => ({
      ...entry,
      answerType: normalizedAnswers[index].type,
      answer:
        normalizedAnswers[index].type === 'text'
          ? String(normalizedAnswers[index].text || '').trim()
          : '',
      answerAudioDataUrl:
        normalizedAnswers[index].type === 'audio' ? normalizedAnswers[index].audioDataUrl : '',
      answerDurationSeconds:
        normalizedAnswers[index].type === 'audio' ? normalizedAnswers[index].durationSeconds : 0,
    }))
    const answerSummary = answeredEntries
      .map((entry, index) =>
        entry.answerType === 'audio' ? `P${index + 1}: Resposta em áudio` : `P${index + 1}: ${entry.answer}`,
      )
      .join('\n')

    setIsSubmittingResponse(true)
    try {
      const result = await respondToQuestionRequest({
        requestId,
        consultantId: selectedConsultantId,
        answerSummary,
        answeredEntries,
      })

      if (result?.ok === false) {
        setPanelNotice(result.message || t('consultant_area.errors.send_failed', 'Não foi possível enviar a resposta.'))
        return
      }

      setResponseDrafts((prev) => ({ ...prev, [requestId]: [] }))
      setPanelNotice(t('consultant_area.notices.response_sent', 'Resposta enviada e valor líquido creditado na carteira do consultor.'))
    } catch (error) {
      setPanelNotice(error?.message || t('consultant_area.errors.send_retry', 'Erro ao enviar resposta. Tente novamente.'))
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  const handleSavePix = () => {
    if (!pixDraft.trim()) {
      setPanelNotice(t('consultant_area.errors.invalid_pix', 'Informe uma chave PIX válida.'))
      return
    }
    setConsultantPixKey({ consultantId: selectedConsultantId, pixKey: pixDraft.trim() })
    setPixDraft('')
    setPanelNotice(t('consultant_area.notices.pix_saved', 'Chave PIX salva com sucesso.'))
  }

  const handleRequestWithdrawal = () => {
    const amount = Number(withdrawAmount)
    if (!amount || amount <= 0) {
      setPanelNotice(t('consultant_area.errors.invalid_withdrawal', 'Informe um valor de saque válido.'))
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
      setPanelNotice(t('consultant_area.errors.invalid_image', 'Selecione um arquivo de imagem válido.'))
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
      setPanelNotice(t('consultant_area.notices.profile_image_loaded', 'Imagem de perfil carregada. Clique em Salvar perfil para confirmar.'))
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
      pricePerMinute: parseCurrency(profileDraft.pricePerMinute),
      priceThreeQuestions: parseCurrency(profileDraft.priceThreeQuestions),
      priceFiveQuestions: parseCurrency(profileDraft.priceFiveQuestions),
    })
    setPanelNotice(t('consultant_area.notices.profile_saved', 'Perfil do consultor atualizado com sucesso.'))
  }

  return (
    <PageShell
      title={t('consultant_area.page.title', 'Área do Consultor')}
      subtitle={t('consultant_area.page.subtitle', 'Atendimentos de perguntas, vídeo e carteira do consultor.')}
    >
      {pendingVideoSessions.length > 0 && !isAdmin && (
        <GlassCard title={t('consultant_area.video_pending.title', 'Chamadas de Vídeo Pendentes')} subtitle={t('consultant_area.video_pending.subtitle', 'Clientes aguardando você entrar na sala.')}>
          <div className="grid gap-3">
            {pendingVideoSessions.map((session) => (
              <article key={session.id} className="flex items-center justify-between rounded-xl border border-mystic-gold/35 bg-black/30 p-4">
                <div>
                  <p className="text-sm text-amber-50">{t('consultant_area.video_pending.client', 'Cliente')}: <strong className="text-mystic-goldSoft">{session.userName}</strong></p>
                  <p className="text-xs text-ethereal-silver/80">{t('consultant_area.video_pending.requested_recently', 'Solicitado agora pouco')}</p>
                </div>
                <button
                  onClick={() => window.open(`/sala/${session.id}`, '_blank')}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
                >
                  {t('consultant_area.video_pending.enter_room', 'Entrar na Sala')}
                </button>
              </article>
            ))}
          </div>
        </GlassCard>
      )}

      <GlassCard title={t('consultant_area.questions.title', 'Atendimento de Perguntas')} subtitle={t('consultant_area.questions.subtitle', 'Visualize e responda cada item enviado pelo cliente.')}>
        {panelNotice && (
          <p className="mb-3 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {panelNotice}
          </p>
        )}
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
            {t('consultant_area.questions.pending', 'Pendentes')}: {pendingRequests.length} • {t('consultant_area.questions.answered', 'Respondidas')}: {answeredRequests.length}
          </span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold ${isSelectedConsultantOnline ? 'text-emerald-400' : 'text-ethereal-silver/60'}`}>
              {isSelectedConsultantOnline ? t('consultant_area.status.online', 'ONLINE') : t('consultant_area.status.offline', 'OFFLINE')}
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
        <div className="grid gap-3">
          {pendingRequests.length === 0 && (
            <p className="rounded-lg border border-mystic-gold/25 bg-black/30 p-3 text-sm text-ethereal-silver/80">
              {t('consultant_area.questions.no_pending', 'Você não possui mensagens pendentes.')}
            </p>
          )}
          {pendingRequests.map((request) => (
            <article key={request.id} className="rounded-xl border border-mystic-gold/35 bg-black/30 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-amber-50">
                  {t('consultant_area.questions.client', 'Cliente')}: {request.customerName} • {t('consultant_area.questions.package', 'Pacote')} {request.questionCount} {t('consultant_area.questions.questions', 'perguntas')}
                </p>
                <span className="text-xs text-mystic-goldSoft">{t('consultant_area.questions.estimated_commission', 'Comissão estimada')}: R$ {(request.packagePrice * 0.7).toFixed(2)}</span>
              </div>
              <div className="mt-2 text-xs text-amber-100/70">
                <p>{t('consultant_area.questions.birth', 'Nascimento')}: {request.customerBirthDate || t('consultant_area.questions.not_informed', 'Não informado')} • {t('consultant_area.questions.zodiac', 'Signo')}: {request.customerZodiac || t('consultant_area.questions.not_informed', 'Não informado')}</p>
              </div>
              <div className="mt-4 grid gap-4 border-t border-mystic-gold/20 pt-4">
                {request.entries.map((entry, index) => (
                  <div key={index} className="grid gap-2">
                    <p className="text-sm text-amber-50">
                      <span className="font-bold text-mystic-goldSoft">P{index + 1}: </span>
                      {entry.question}
                    </p>
                    {entry.type === 'audio' && entry.audioDataUrl && (
                      <audio
                        controls
                        src={entry.audioDataUrl}
                        className="w-full"
                        controlsList="nodownload"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResponseTypeChange(request.id, index, 'text')}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                          getResponseEntryDraft(request.id, index).type === 'text'
                            ? 'border-mystic-gold/70 bg-mystic-gold/20 text-mystic-goldSoft'
                            : 'border-mystic-gold/35 text-ethereal-silver/80 hover:bg-mystic-gold/10'
                        }`}
                      >
                        {t('consultant_area.questions.reply_text', 'Responder em texto')}
                      </button>
                      <button
                        onClick={() => handleResponseTypeChange(request.id, index, 'audio')}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                          getResponseEntryDraft(request.id, index).type === 'audio'
                            ? 'border-mystic-gold/70 bg-mystic-gold/20 text-mystic-goldSoft'
                            : 'border-mystic-gold/35 text-ethereal-silver/80 hover:bg-mystic-gold/10'
                        }`}
                      >
                        {t('consultant_area.questions.reply_audio', 'Responder em áudio')}
                      </button>
                    </div>
                    {getResponseEntryDraft(request.id, index).type === 'text' ? (
                      <textarea
                        placeholder={`${t('consultant_area.questions.answer_placeholder_prefix', 'Digite a resposta para a Pergunta')} ${index + 1}...`}
                        value={getResponseEntryDraft(request.id, index).text}
                        onChange={(event) =>
                          handleResponseChange(request.id, index, event.target.value)
                        }
                        className="min-h-[80px] w-full resize-y rounded-lg border border-mystic-gold/35 bg-black/35 p-3 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                      />
                    ) : (
                      <AudioRecorder
                        onAudioRecorded={() => {}}
                        onSave={(blob, duration) => {
                          void handleResponseAudioSave(request.id, index, blob, duration)
                        }}
                        maxDurationSeconds={120}
                        autoSaveOnStop={false}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    void handleSubmitResponse(request.id)
                  }}
                  disabled={isSubmittingResponse}
                  className="flex items-center gap-2 rounded-lg bg-mystic-gold/90 px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
                >
                  <SendHorizontal size={16} />
                  {isSubmittingResponse ? t('consultant_area.questions.sending', 'Enviando...') : t('consultant_area.questions.send_response', 'Enviar Resposta')}
                </button>
              </div>
            </article>
          ))}
        </div>
      </GlassCard>

      <GlassCard title={t('consultant_area.profile.title', 'Editar Meu Perfil')} subtitle={t('consultant_area.profile.subtitle', 'Atualize dados públicos e preços do seu atendimento.')}>
        {profileDraft && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              {t('consultant_area.profile.image_label', 'Imagem de perfil')}
              <span className="text-[11px] text-ethereal-silver/65">{t('consultant_area.profile.image_help', 'Envie uma imagem do seu dispositivo para atualizar o card público.')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
              />
              <div className="mt-1 flex items-center gap-3 rounded-lg border border-mystic-gold/20 bg-black/30 p-2">
                <img
                  src={profileDraft.photo || selectedConsultant?.photo}
                  alt={t('consultant_area.profile.image_preview_alt', 'Prévia da foto do perfil')}
                  className="h-14 w-14 rounded-full border border-mystic-gold/55 object-cover"
                />
                <p className="text-[11px] text-ethereal-silver/70">{t('consultant_area.profile.image_preview_help', 'Prévia da imagem exibida para clientes.')}</p>
              </div>
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              {t('consultant_area.profile.public_name', 'Nome público')}
              <span className="text-[11px] text-ethereal-silver/65">{t('consultant_area.profile.public_name_help', 'Nome exibido para os clientes no card e perfil.')}</span>
              <input
                value={profileDraft.name}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder={t('consultant_area.profile.name_placeholder', 'Nome')}
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              {t('consultant_area.profile.contact_email', 'E-mail de contato')}
              <span className="text-[11px] text-ethereal-silver/65">{t('consultant_area.profile.contact_email_help', 'Usado para identificação administrativa do consultor.')}</span>
              <input
                value={profileDraft.email}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder={t('consultant_area.profile.email_placeholder', 'E-mail')}
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              {t('consultant_area.profile.tagline_label', 'Tagline do perfil')}
              <span className="text-[11px] text-ethereal-silver/65">{t('consultant_area.profile.tagline_help', 'Frase curta que aparece abaixo do seu nome.')}</span>
              <input
                value={profileDraft.tagline}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, tagline: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder={t('consultant_area.profile.tagline_placeholder', 'Tagline')}
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              {t('consultant_area.profile.full_description', 'Descrição completa')}
              <span className="text-[11px] text-ethereal-silver/65">{t('consultant_area.profile.full_description_help', 'Explique sua abordagem, especialidades e diferenciais.')}</span>
              <textarea
                rows={3}
                value={profileDraft.description}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, description: event.target.value }))}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder={t('consultant_area.profile.description_placeholder', 'Descrição')}
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              {t('consultant_area.profile.price_per_minute', 'Preço por minuto (R$)')}
              <span className="text-[11px] text-ethereal-silver/65">{t('consultant_area.profile.price_per_minute_help', 'Valor cobrado no atendimento por vídeo.')}</span>
              <input
                type="text"
                value={profileDraft.pricePerMinute}
                onChange={handleCurrencyInput(setProfileDraft, 'pricePerMinute')}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="0,00"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75">
              {t('consultant_area.profile.package_three', 'Pacote 3 perguntas (R$)')}
              <span className="text-[11px] text-ethereal-silver/65">{t('consultant_area.profile.package_three_help', 'Valor fechado para responder 3 perguntas.')}</span>
              <input
                type="text"
                value={profileDraft.priceThreeQuestions}
                onChange={handleCurrencyInput(setProfileDraft, 'priceThreeQuestions')}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
                placeholder="0,00"
              />
            </label>
            <label className="grid gap-1 text-xs text-amber-100/75 md:col-span-2">
              {t('consultant_area.profile.package_five', 'Pacote 5 perguntas (R$)')}
              <span className="text-[11px] text-ethereal-silver/65">{t('consultant_area.profile.package_five_help', 'Valor fechado para responder 5 perguntas.')}</span>
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
              {t('consultant_area.profile.save', 'Salvar perfil')}
            </button>
          </div>
        )}
      </GlassCard>

      <GlassCard title={t('consultant_area.wallet.title', 'Carteira do Consultor')} subtitle={t('consultant_area.wallet.subtitle', 'Controle de ganhos, PIX e solicitação de saque.')}>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ethereal-silver/70">{t('consultant_area.wallet.available_balance', 'Saldo disponível')}</p>
            <p className="mt-2 font-display text-3xl text-mystic-goldSoft">
              R$ {wallet.availableBalance.toFixed(2)}
            </p>
          </article>
          <article className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ethereal-silver/70">{t('consultant_area.wallet.filtered_earnings', 'Ganhos filtrados')}</p>
            <p className="mt-2 font-display text-3xl text-mystic-goldSoft">R$ {filteredEarnings.toFixed(2)}</p>
          </article>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-sm text-ethereal-silver/85">{t('consultant_area.wallet.add_pix_key', 'Adicionar chave PIX para recebimento')}</p>
            <input
              value={pixDraft}
              onChange={(event) => setPixDraft(event.target.value)}
              placeholder={wallet.pixKey ? `${t('consultant_area.wallet.current_pix', 'Atual')}: ${wallet.pixKey}` : t('consultant_area.wallet.pix_placeholder', 'Digite a chave PIX')}
              className="mt-2 w-full rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
            <button
              onClick={handleSavePix}
              className="mt-2 rounded-lg border border-mystic-gold/60 px-3 py-2 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/10"
            >
              {t('consultant_area.wallet.save_pix_key', 'Salvar chave PIX')}
            </button>
          </div>

          <div className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
            <p className="text-sm text-ethereal-silver/85">{t('consultant_area.wallet.request_withdrawal', 'Solicitar saque')}</p>
            <input
              type="number"
              min={minWithdrawalAmount}
              step="0.5"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              placeholder={`${t('consultant_area.wallet.minimum', 'Mínimo')} R$ ${minWithdrawalAmount.toFixed(2)}`}
              className="mt-2 w-full rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
            <button
              onClick={handleRequestWithdrawal}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-mystic-gold/70 bg-mystic-gold/15 px-3 py-2 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/25"
            >
              <Wallet size={14} />
              {t('consultant_area.wallet.request_withdrawal', 'Solicitar saque')}
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
              {filter === 'total' && t('consultant_area.filters.total', 'Total')}
              {filter === 'daily' && t('consultant_area.filters.daily', 'Diário')}
              {filter === 'weekly' && t('consultant_area.filters.weekly', 'Semanal')}
              {filter === 'monthly' && t('consultant_area.filters.monthly', 'Mensal')}
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
