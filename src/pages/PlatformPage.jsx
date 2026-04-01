import { AlertTriangle, MoonStar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AuthProfileForm } from '../components/AuthProfileForm'
import { ClientDashboard } from '../components/ClientDashboard'
import { ConsultantMarketplace } from '../components/ConsultantMarketplace'
import { VideoConsultationRoom } from '../components/VideoConsultationRoom'
import { AdminPanel } from '../components/AdminPanel'
import { usePlatformContext } from '../context/platform-context'

export function PlatformPage() {
  const {
    profile,
    sign,
    minutesBalance,
    dailyHoroscope,
    register,
    consultants,
    pendingConsultants,
    statusFilter,
    setStatusFilter,
    selectedConsultant,
    billing,
    roomUrl,
    minutePackages,
    updateMinutePackage,
    setFeaturedPackage,
    updateConsultantBaseConsultations,
    consultantWallets,
    questionRequests,
    globalCommission,
    setGlobalCommission,
    spells,
    pendingSpellOrders,
    adminSpellOrders,
    saveSpell,
    deleteSpell,
    processSpellOrderAction,
    approveConsultant,
    blockConsultant,
    updateConsultantByAdmin,
    mpCredentials,
    setMpCredentials,
    dailyCredentials,
    setDailyCredentials,
    systemNotice,
    selectConsultant,
    connectSession,
    disconnectSession,
  } = usePlatformContext()
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-mystic-gradient px-4 py-8 text-left text-amber-50 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-xl2 border border-mystic-gold/40 bg-mystic-purple/55 px-6 py-5 shadow-glow backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-100/60">Astria</p>
              <h1 className="font-display text-4xl text-mystic-goldSoft md:text-5xl">
                Plataforma de Consultas em Tempo Real
              </h1>
            </div>
            <MoonStar className="text-mystic-goldSoft" size={34} />
          </div>
        </header>

        {systemNotice && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            <AlertTriangle size={16} />
            {systemNotice}
          </div>
        )}

        <AuthProfileForm profile={profile} sign={sign} onRegister={register} />
        <ClientDashboard
          profile={profile}
          minutesBalance={minutesBalance}
          dailyHoroscope={dailyHoroscope}
          onRecharge={() => navigate('/recarregar')}
        />
        <ConsultantMarketplace
          consultants={consultants}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onChooseService={(consultant, mode) => {
            if (mode === 'video') {
              selectConsultant(consultant)
            }
          }}
        />
        <VideoConsultationRoom
          roomUrl={roomUrl}
          selectedConsultant={selectedConsultant}
          billing={billing}
          onConnect={connectSession}
          onDisconnect={disconnectSession}
        />
        <AdminPanel
          consultants={consultants}
          pendingConsultants={pendingConsultants}
          minutePackages={minutePackages}
          updateMinutePackage={updateMinutePackage}
          setFeaturedPackage={setFeaturedPackage}
          updateConsultantBaseConsultations={updateConsultantBaseConsultations}
          consultantWallets={consultantWallets}
          questionRequests={questionRequests}
          globalCommission={globalCommission}
          onGlobalCommissionChange={setGlobalCommission}
          spells={spells}
          pendingSpellOrders={pendingSpellOrders}
          adminSpellOrders={adminSpellOrders}
          onSaveSpell={saveSpell}
          onDeleteSpell={deleteSpell}
          onSpellOrderAction={processSpellOrderAction}
          onApprove={approveConsultant}
          onBlock={blockConsultant}
          onSaveConsultant={updateConsultantByAdmin}
          mpCredentials={mpCredentials}
          onMpCredentialsChange={setMpCredentials}
          dailyCredentials={dailyCredentials}
          onDailyCredentialsChange={setDailyCredentials}
        />
      </div>
    </main>
  )
}
