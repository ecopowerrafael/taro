import { useNavigate } from 'react-router-dom'
import { AuthProfileForm } from '../components/AuthProfileForm'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'

export function CadastroPage() {
  const navigate = useNavigate()
  const { profile, sign, register, setSystemNotice } = usePlatformContext()

  const handleRegister = async (formData) => {
    const result = await register(formData)
    if (result.ok) {
      setSystemNotice('Conta criada com sucesso!')
      navigate('/perfil')
    } else {
      setSystemNotice(result.message || 'Erro ao criar conta.')
    }
  }

  return (
    <PageShell
      title="Criar Conta"
      subtitle="Complete seu cadastro com dados essenciais para personalizar suas consultas."
    >
      <AuthProfileForm profile={profile} sign={sign} onRegister={handleRegister} isRegister={true} />
    </PageShell>
  )
}
