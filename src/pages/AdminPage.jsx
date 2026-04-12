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
    resetUserOracleData,
    adminDashboardStats,
    fetchAdminDashboardStats,
    spells,
    pendingSpellOrders,
    adminSpellOrders,
    pendingAstralReadingOrders,
    adminAstralReadingOrders,
    saveSpell,
    deleteSpell,
    fetchPendingSpellOrders,
    fetchAdminSpellOrders,
    fetchPendingAstralReadingOrders,
    fetchAdminAstralReadingOrders,
    processSpellOrderAction,
    processAstralReadingOrderAction,
    token,
    adminNumerologyOrders,
    fetchAdminNumerologyOrders,
  } = usePlatformContext()

  useEffect(() => {
    fetchPendingRecharges()
    fetchPendingSpellOrders()
    fetchAdminSpellOrders()
    fetchPendingAstralReadingOrders()
    fetchAdminAstralReadingOrders()
    fetchAdminUsers()
    fetchAdminDashboardStats()
  }, [])

  // Filtra pendentes corretamente
  const realPendingConsultants = Array.isArray(consultants)
    ? consultants.filter(c => (c.status === 'Pendente' || c.status === 'pending'))
    : [];
  const realApprovedConsultants = Array.isArray(consultants)
    ? consultants.filter(c => c.status !== 'Pendente' && c.status !== 'pending')
    : [];

  return (
    <PageShell title="Painel Administrativo" subtitle="Gestão de consultores, finanças e plataforma.">
      <AdminPanel
        consultants={realApprovedConsultants}
        pendingConsultants={realPendingConsultants}
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
        onResetUserOracle={resetUserOracleData}
        onSendPushBroadcast={sendAdminPushBroadcast}
        onUpdateAdminUser={updateAdminUser}
        adminDashboardStats={adminDashboardStats}
        onRefreshAdminDashboard={fetchAdminDashboardStats}
        token={token}
        spells={spells}
        pendingSpellOrders={pendingSpellOrders}
        adminSpellOrders={adminSpellOrders}
        pendingAstralReadingOrders={pendingAstralReadingOrders}
        adminAstralReadingOrders={adminAstralReadingOrders}
        onSaveSpell={saveSpell}
        onDeleteSpell={deleteSpell}
        onSpellOrderAction={processSpellOrderAction}
        onAstralReadingOrderAction={processAstralReadingOrderAction}
        adminNumerologyOrders={adminNumerologyOrders}
        fetchAdminNumerologyOrders={fetchAdminNumerologyOrders}
      />
    </PageShell>
  )
}
