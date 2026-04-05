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
    saveMinutePackages,
    updateConsultantBaseConsultations,
    consultantWallets,
    questionRequests,
    globalCommission,
    setGlobalCommission,
    approveConsultant,
    rejectConsultant,
    updateConsultantByAdmin,
    mpCredentials,
    savePlatformCredentials,
    dailyCredentials,
    stripeCredentials,
    oracleCredentials,
    rechargeRequests,
    fetchPendingRecharges,
    processRechargeAction,
    updateWithdrawalStatus,
    adminUsers,
    fetchAdminUsers,
    sendAdminPushBroadcast,
    updateAdminUser,
    adminDashboardStats,
    fetchAdminDashboardStats,
    spells,
    pendingSpellOrders,
    adminSpellOrders,
    saveSpell,
    deleteSpell,
    fetchPendingSpellOrders,
    fetchAdminSpellOrders,
    processSpellOrderAction,
    token,
  } = usePlatformContext()

  useEffect(() => {
    fetchPendingRecharges()
    fetchPendingSpellOrders()
    fetchAdminSpellOrders()
    fetchAdminUsers()
    fetchAdminDashboardStats()
  }, [])

  return (
    <PageShell title="Painel Administrativo" subtitle="Gestão de consultores, finanças e plataforma.">
      <AdminPanel
        consultants={consultants}
        pendingConsultants={pendingConsultants}
        minutePackages={minutePackages}
        updateMinutePackage={updateMinutePackage}
        setFeaturedPackage={setFeaturedPackage}
        onSaveMinutePackages={saveMinutePackages}
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
        stripeCredentials={stripeCredentials}
        onStripeCredentialsChange={savePlatformCredentials}
        oracleCredentials={oracleCredentials}
        onOracleCredentialsChange={savePlatformCredentials}
        rechargeRequests={rechargeRequests}
        onRechargeAction={processRechargeAction}
        updateWithdrawalStatus={updateWithdrawalStatus}
        adminUsers={adminUsers}
        onRefreshAdminUsers={fetchAdminUsers}
        onSendPushBroadcast={sendAdminPushBroadcast}
        onUpdateAdminUser={updateAdminUser}
        adminDashboardStats={adminDashboardStats}
        onRefreshAdminDashboard={fetchAdminDashboardStats}
        token={token}
        spells={spells}
        pendingSpellOrders={pendingSpellOrders}
        adminSpellOrders={adminSpellOrders}
        onSaveSpell={saveSpell}
        onDeleteSpell={deleteSpell}
        onSpellOrderAction={processSpellOrderAction}
      />
    </PageShell>
  )
}
