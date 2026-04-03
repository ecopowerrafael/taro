import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, RefreshCcw, Send, Smartphone, Star } from 'lucide-react'
import { ClientDashboard } from '../components/ClientDashboard'
import { AuthProfileForm } from '../components/AuthProfileForm'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'
import { ReviewModal } from '../components/ReviewModal'
import { usePlatformContext } from '../context/platform-context'

export function PerfilPage() {
  const {
    profile,
    sign,
    minutesBalance,
    dailyHoroscope,
    updateProfile,
    logout,
    authLoading,
    isAuthenticated,
    questionRequests,
    token,
    ensurePushSubscription,
    getMyPushStatus,
    sendMyPushTest,
  } = usePlatformContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('perfil')
  const [expandedAnswerId, setExpandedAnswerId] = useState(null)
  const [reviewModal, setReviewModal] = useState({ isOpen: false, consultantId: '', consultantName: '', referenceId: '' })
  const [reviewedIds, setReviewedIds] = useState(new Set())
  const [pushStatus, setPushStatus] = useState(null)
  const [pushTestResult, setPushTestResult] = useState(null)
  const [pushNotice, setPushNotice] = useState('')
  const [pushLoading, setPushLoading] = useState(false)
  const [pushTesting, setPushTesting] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/entrar')
    }
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    void refreshPushStatus()
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const refreshPushStatus = async ({ sync = false } = {}) => {
    setPushLoading(true)
    setPushNotice(sync ? 'Sincronizando token e consultando status do push...' : 'Consultando status do push...')

    try {
      if (sync) {
        const syncResult = await ensurePushSubscription()
        if (syncResult?.ok === false) {
          setPushNotice(syncResult.message || 'Falha ao sincronizar o token de push.')
        }
      }

      const status = await getMyPushStatus()
      setPushStatus(status)
      if (status?.ok === false) {
        setPushNotice(status.message || 'Não foi possível obter o status do push.')
      } else {
        setPushNotice('Status do push atualizado.')
      }
    } catch {
      setPushNotice('Erro ao consultar status do push.')
    } finally {
      setPushLoading(false)
    }
  }

  const handlePushTest = async () => {
    setPushTesting(true)
    setPushNotice('Enviando push de teste...')

    try {
      const result = await sendMyPushTest()
      setPushTestResult(result)
      if (result?.ok === false) {
        setPushNotice(result.message || 'Falha ao enviar push de teste.')
      } else {
        setPushNotice('Push de teste enviado. Confira se a notificação chegou no dispositivo.')
      }

      const status = await getMyPushStatus()
      setPushStatus(status)
    } catch {
      setPushNotice('Erro ao enviar push de teste.')
    } finally {
      setPushTesting(false)
    }
  }

  if (authLoading) {
    return (
      <PageShell title="Carregando..." subtitle="Aguarde um momento.">
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-mystic-gold border-t-transparent"></div>
        </div>
      </PageShell>
    )
  }

  if (!profile) return null

  // Filtrar respostas recebidas pelo cliente (status === 'answered')
  const myAnswers = questionRequests.filter(
    (request) => request.customerEmail === profile.email && request.status === 'answered'
  )

  const tabButtonClass = (tabId) =>
    `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
      activeTab === tabId
        ? 'border-mystic-gold/70 bg-mystic-gold/20 text-mystic-goldSoft'
        : 'border-mystic-gold/35 text-amber-100/80 hover:bg-mystic-gold/10'
    }`

  return (
    <PageShell title="Meu Perfil" subtitle="Acompanhe saldo, signo, perfil e respostas a suas consultas.">
      <ClientDashboard
        profile={profile}
        minutesBalance={minutesBalance}
        dailyHoroscope={dailyHoroscope}
        onRecharge={() => navigate('/recarregar')}
      />

      {/* Abas */}
      <div className="mb-6 flex gap-2">
        <button onClick={() => setActiveTab('perfil')} className={tabButtonClass('perfil')}>
          Perfil
        </button>
        <button onClick={() => setActiveTab('respostas')} className={tabButtonClass('respostas')}>
          Respostas ({myAnswers.length})
        </button>
        <button onClick={() => setActiveTab('push')} className={tabButtonClass('push')}>
          Push
        </button>
      </div>

      {/* Aba Perfil */}
      {activeTab === 'perfil' && (
        <div className="grid gap-6">
          <AuthProfileForm
            profile={profile}
            sign={sign}
            onUpdate={updateProfile}
            isRegister={false}
          />

          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-500/50 bg-red-500/10 px-6 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      )}

      {/* Aba Respostas a Consultas */}
      {activeTab === 'respostas' && (
        <GlassCard title="Respostas Recebidas" subtitle="Confira as respostas de seus consulentes.">
          {myAnswers.length === 0 ? (
            <p className="rounded-lg border border-mystic-gold/25 bg-black/30 p-3 text-sm text-ethereal-silver/80">
              Você ainda não recebeu respostas de consultas.
            </p>
          ) : (
            <div className="grid gap-3">
              {myAnswers.map((answer) => (
                <article
                  key={answer.id}
                  className="rounded-xl border border-mystic-gold/35 bg-black/30 p-4 cursor-pointer transition hover:bg-black/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-mystic-goldSoft">{answer.consultantName}</p>
                        <span className="text-xs text-ethereal-silver/70">
                          {new Date(answer.answeredAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(answer.answeredAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/70 mb-2">
                        Pacote: {answer.questionCount} pergunta(s) • R$ {answer.packagePrice.toFixed(2)}
                      </p>
                      {expandedAnswerId === answer.id ? (
                        <div className="mt-3 space-y-3">
                          {/* Mostra as perguntas */}
                          {Array.isArray(answer.entries) && answer.entries.length > 0 && (
                            <div className="rounded-lg bg-black/50 p-3 border border-mystic-gold/20 space-y-2">
                              <p className="text-xs font-semibold text-mystic-goldSoft mb-2">Suas perguntas:</p>
                              {answer.entries.map((entry, idx) => (
                                <div key={entry.id || idx} className="text-xs text-amber-100/80 pb-2 border-b border-mystic-gold/15 last:border-b-0">
                                  <span className="text-mystic-gold font-semibold">P{idx + 1}:</span>{' '}
                                  <span className="text-amber-50">{entry.question || entry.text || 'Pergunta não especificada'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Mostra a resposta */}
                          <div className="rounded-lg bg-black/50 p-3 border border-mystic-gold/20">
                            <p className="text-xs font-semibold text-mystic-goldSoft mb-2">Resposta do(a) {answer.consultantName}:</p>
                            <p className="text-xs text-amber-50 whitespace-pre-wrap">{answer.answerSummary}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-50 line-clamp-2 italic">
                          {answer.answerSummary.length > 100
                            ? answer.answerSummary.substring(0, 100) + '...'
                            : answer.answerSummary}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setExpandedAnswerId(expandedAnswerId === answer.id ? null : answer.id)
                      }
                      className="mt-1 text-mystic-gold transition hover:text-amber-500"
                    >
                      <ChevronDown
                        size={18}
                        className={`transform transition-transform ${
                          expandedAnswerId === answer.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                  {/* Botão de avaliação */}
                  {!reviewedIds.has(answer.id) && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() =>
                          setReviewModal({
                            isOpen: true,
                            consultantId: answer.consultantId,
                            consultantName: answer.consultantName,
                            referenceId: answer.id,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stardust-gold/40 bg-black/30 px-3 py-1.5 text-xs text-stardust-gold transition hover:bg-stardust-gold/10"
                      >
                        <Star size={12} /> Avaliar consultor
                      </button>
                    </div>
                  )}
                  {reviewedIds.has(answer.id) && (
                    <p className="mt-2 text-right text-xs text-emerald-400/80">✓ Avaliado</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'push' && (
        <GlassCard title="Diagnóstico de Push" subtitle="Valide o token salvo no backend e envie um push de teste.">
          <div className="grid gap-4">
            <div className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4 text-sm text-amber-50/90">
              <div className="mb-3 flex items-center gap-2 text-mystic-goldSoft">
                <Smartphone size={16} />
                <span className="font-semibold">Fluxo de push</span>
              </div>
              <p>
                Sincronize a inscrição deste usuário, consulte o que o backend conhece e envie um teste sem depender de log externo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void refreshPushStatus({ sync: true })}
                disabled={pushLoading || pushTesting}
                className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/45 bg-mystic-gold/10 px-4 py-2 text-sm text-mystic-goldSoft transition hover:bg-mystic-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw size={16} className={pushLoading ? 'animate-spin' : ''} />
                Sincronizar token
              </button>
              <button
                onClick={() => void refreshPushStatus()}
                disabled={pushLoading || pushTesting}
                className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/35 bg-black/30 px-4 py-2 text-sm text-amber-100/90 transition hover:bg-black/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw size={16} className={pushLoading ? 'animate-spin' : ''} />
                Consultar status
              </button>
              <button
                onClick={() => void handlePushTest()}
                disabled={pushLoading || pushTesting}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/45 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} className={pushTesting ? 'animate-pulse' : ''} />
                Enviar push de teste
              </button>
            </div>

            {pushNotice && (
              <p className="rounded-lg border border-mystic-gold/25 bg-black/40 px-3 py-2 text-xs text-amber-100/85">
                {pushNotice}
              </p>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-ethereal-silver/60">Resumo</p>
                <div className="mt-3 grid gap-2 text-sm text-amber-50/90">
                  <p>Servidor nativo: {pushStatus?.nativeConfigured ? 'ativo' : 'indisponível'}</p>
                  <p>Total de tokens nativos: {pushStatus?.totalNativeTokens ?? '-'}</p>
                  <p>Tokens nativos ativos: {pushStatus?.activeNativeTokens ?? '-'}</p>
                  <p>Total de subscriptions web: {pushStatus?.totalSubscriptions ?? '-'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-ethereal-silver/60">Último teste</p>
                <div className="mt-3 text-sm text-amber-50/90">
                  {!pushTestResult && <p>Nenhum teste enviado nesta sessão.</p>}
                  {pushTestResult && (
                    <>
                      <p>Resultado: {pushTestResult.ok === false ? 'falha' : 'enviado'}</p>
                      {pushTestResult.message && <p>Mensagem: {pushTestResult.message}</p>}
                      {typeof pushTestResult.successCount !== 'undefined' && (
                        <p>Sucessos: {pushTestResult.successCount} / {pushTestResult.totalSubscriptions ?? 0}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-mystic-gold/30 bg-black/30 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.24em] text-ethereal-silver/60">Tokens nativos</p>
              {!pushStatus?.nativeTokens?.length ? (
                <p className="text-sm text-amber-100/75">Nenhum token nativo encontrado para este usuário.</p>
              ) : (
                <div className="grid gap-2">
                  {pushStatus.nativeTokens.map((item, index) => (
                    <div key={`${item.tokenPreview}-${index}`} className="rounded-lg border border-mystic-gold/20 bg-black/40 p-3 text-xs text-amber-50/85">
                      <p>Token: {item.tokenPreview}</p>
                      <p>Plataforma: {item.platform} • Provedor: {item.provider}</p>
                      <p>Ativo: {Number(item.isActive) === 1 ? 'sim' : 'não'} • Falhas: {item.failureCount}</p>
                      <p>Atualizado em: {item.updatedAt ? new Date(item.updatedAt).toLocaleString('pt-BR') : '-'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      <ReviewModal
        isOpen={reviewModal.isOpen}
        consultantName={reviewModal.consultantName}
        consultantId={reviewModal.consultantId}
        referenceId={reviewModal.referenceId}
        sessionType="question"
        token={token}
        onClose={() => setReviewModal(r => ({ ...r, isOpen: false }))}
        onSubmitted={() => {
          setReviewedIds(prev => new Set([...prev, reviewModal.referenceId]))
        }}
      />
    </PageShell>
  )
}
