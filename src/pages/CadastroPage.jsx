import { useNavigate } from 'react-router-dom'
import { AuthProfileForm } from '../components/AuthProfileForm'
import { PageShell } from '../components/PageShell'
import { usePlatformContext } from '../context/platform-context'
import { useTranslation } from 'react-i18next'

export function CadastroPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile, sign, register, setSystemNotice } = usePlatformContext()

  const handleRegister = async (formData) => {
    const result = await register(formData)
    if (result.ok) {
      setSystemNotice(t('register.notices.created', 'Conta criada com sucesso!'))
      navigate('/perfil')
    } else {
      setSystemNotice(result.message || t('register.errors.create_failed', 'Erro ao criar conta.'))
    }
  }

  return (
    <PageShell
      title={t('register.page_title', 'Criar Conta')}
      subtitle={t('register.page_subtitle', 'Complete seu cadastro com dados essenciais para personalizar suas consultas.')}
    >
      <AuthProfileForm profile={profile} sign={sign} onRegister={handleRegister} isRegister={true} />
    </PageShell>
  )
}
