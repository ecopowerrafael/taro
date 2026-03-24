import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClientDashboard } from '../components/ClientDashboard'
import { AuthProfileForm } from '../components/AuthProfileForm'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function PerfilPage() {
  const { profile, sign, minutesBalance, dailyHoroscope, updateProfile, logout, authLoading, isAuthenticated } = usePlatformContext()
  const navigate = useNavigate()

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

  return (
    <PageShell title="Meu Perfil" subtitle="Acompanhe saldo, signo e resumo pessoal da sua conta.">
      <ClientDashboard
        profile={profile}
        minutesBalance={minutesBalance}
        dailyHoroscope={dailyHoroscope}
        onRecharge={() => navigate('/recarregar')}
      />
      
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
    </PageShell>
  )
}
