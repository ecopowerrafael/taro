import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { ClientDashboard } from '../components/ClientDashboard'
import { AuthProfileForm } from '../components/AuthProfileForm'
import { PageShell } from '../components/PageShell'
import { GlassCard } from '../components/GlassCard'
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
  } = usePlatformContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('perfil')
  const [expandedAnswerId, setExpandedAnswerId] = useState(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/entrar')
    }
  }, [authLoading, isAuthenticated, navigate])

  const handleLogout = () => {
    logout()
    navigate('/')
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
                        <div className="mt-3 rounded-lg bg-black/50 p-3 border border-mystic-gold/20">
                          <p className="text-xs text-amber-50 whitespace-pre-wrap">{answer.answerSummary}</p>
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
                </article>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </PageShell>
  )
}
