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
    blockConsultant,
    updateConsultantByAdmin,
    mpCredentials,
    setMpCredentials,
    dailyCredentials,
    setDailyCredentials,
    adminDashboardStats,
  } = usePlatformContext()

  return (
    <PageShell title="Área Admin" subtitle="Gerencie operação, consultores e monetização da plataforma.">
      <GlassCard title="Resumo Operacional">
        <div className="grid gap-3 md:grid-cols-4">
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Total Faturado</p>
            <p className="mt-2 font-display text-3xl text-mystic-goldSoft">
              R$ {adminDashboardStats.totalBilled.toFixed(2)}
            </p>
            <p className="text-xs text-ethereal-silver/70">Todas as sessões</p>
          </article>
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Comissão Total</p>
            <p className="mt-2 font-display text-3xl text-mystic-goldSoft">
              R$ {adminDashboardStats.totalCommission.toFixed(2)}
            </p>
            <p className="text-xs text-ethereal-silver/70">20% do faturamento</p>
          </article>
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Ganhos Astrólogos</p>
            <p className="mt-2 font-display text-3xl text-mystic-goldSoft">
              R$ {adminDashboardStats.consultantEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-ethereal-silver/70">80% do faturamento</p>
          </article>
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Comissão Global</p>
            <p className="mt-2 font-display text-3xl text-mystic-goldSoft">{globalCommission}%</p>
          </article>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Hoje</p>
            <p className="mt-1 text-sm text-ethereal-silver/85">R$ {adminDashboardStats.todayRevenue.toFixed(2)}</p>
            <p className="text-xs text-ethereal-silver/65">
              Comissão: R$ {adminDashboardStats.todayCommission.toFixed(2)}
            </p>
          </article>
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Este Mês</p>
            <p className="mt-1 text-sm text-ethereal-silver/85">R$ {adminDashboardStats.monthRevenue.toFixed(2)}</p>
            <p className="text-xs text-ethereal-silver/65">
              Comissão: R$ {adminDashboardStats.monthCommission.toFixed(2)}
            </p>
          </article>
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Sessões</p>
            <p className="mt-1 font-display text-3xl text-mystic-goldSoft">{adminDashboardStats.totalSessions}</p>
            <p className="text-xs text-ethereal-silver/65">Sessões realizadas</p>
          </article>
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Usuários</p>
            <p className="mt-1 font-display text-3xl text-mystic-goldSoft">{adminDashboardStats.totalUsers}</p>
            <p className="text-xs text-ethereal-silver/65">
              {adminDashboardStats.astrologersCount} astrólogos, {adminDashboardStats.clientsCount} clientes
            </p>
          </article>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Distribuição de Receita</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full bg-stardust-gold"
                style={{
                  width: `${(adminDashboardStats.totalCommission / adminDashboardStats.totalBilled) * 100}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-ethereal-silver/70">Comissão vs repasse para astrólogos</p>
          </article>
          <article className="rounded-lg border border-mystic-gold/25 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Status de Base</p>
            <div className="mt-3 grid gap-2 text-xs text-ethereal-silver/80">
              <p>Pendentes de aprovação: {pendingConsultants.length}</p>
              <p>Aprovados ativos: {consultants.length}</p>
              <p>Pacotes de recarga ativos: {minutePackages.length}</p>
            </div>
          </article>
        </div>
      </GlassCard>
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
        onBlock={blockConsultant}
        onSaveConsultant={updateConsultantByAdmin}
        mpCredentials={mpCredentials}
        onMpCredentialsChange={setMpCredentials}
        dailyCredentials={dailyCredentials}
        onDailyCredentialsChange={setDailyCredentials}
      />
    </PageShell>
  )
}
