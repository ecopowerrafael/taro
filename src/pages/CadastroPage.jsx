import { AuthProfileForm } from '../components/AuthProfileForm'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function CadastroPage() {
  const { profile, sign, register } = usePlatformContext()

  return (
    <PageShell
      title="Criar Conta"
      subtitle="Complete seu cadastro com dados essenciais para personalizar suas consultas."
    >
      <AuthProfileForm profile={profile} sign={sign} onRegister={register} />
    </PageShell>
  )
}
