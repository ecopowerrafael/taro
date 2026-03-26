import { useEffect } from 'react'
import { AdminPanel } from '../components/AdminPanel'
import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function AdminPage() {
  const {
    consultants,
    pendingConsultants,
    minutePackages,
    updateMinutePackage,
    setFeaturedPackage,
    updateConsultantBaseConsultations,
    consultantWallets,
    questionRequests,
    globalCommission,
    setGlobalCommission,
    approveConsultant,
    rejectConsultant,
    upsertConsultant,
    mpCredentials,
    savePlatformCredentials,
    dailyCredentials,
    rechargeRequests,
    fetchPendingRecharges,
    processRechargeAction,
  } = usePlatformContext()

  useEffect(() => {
    fetchPendingRecharges()
  }, [])

  return (
    <PageShell title="Painel Administrativo" subtitle="Gestão de consultores, finanças e plataforma.">
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
        onApprove={approveConsultant}
        onBlock={rejectConsultant}
        onSaveConsultant={updateConsultantByAdmin}
        mpCredentials={mpCredentials}
        onMpCredentialsChange={savePlatformCredentials}
        dailyCredentials={dailyCredentials}
        onDailyCredentialsChange={savePlatformCredentials}
        rechargeRequests={rechargeRequests}
        onRechargeAction={processRechargeAction}
      />
    </PageShell>
  )
}
