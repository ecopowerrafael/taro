import { useContext } from 'react'
import { Lock, AlertTriangle } from 'lucide-react'
import { PlatformContext } from '../context/platform-context'

export function PermissionPromptModal() {
  const { permissionPrompt, handlePermissionPromptConfirm, handlePermissionPromptCancel } = useContext(PlatformContext)

  if (!permissionPrompt?.active) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-mystic-gold/30 bg-gradient-to-br from-mystic-purple to-mystic-purple-dark p-6 shadow-2xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-mystic-gold/20 p-4">
            <AlertTriangle className="h-8 w-8 text-mystic-gold" />
          </div>
          <h2 className="text-center text-xl font-bold text-white">Permissões de Notificação</h2>
        </div>

        <div className="mb-6">
          <p className="text-center text-sm leading-relaxed text-mystic-purple-light/80">
            Para tocar como ligação telefônica e acender a tela automaticamente ao receber chamadas,
            a Astria precisa liberar tela cheia e bateria sem restrições.
          </p>

          <div className="mt-4 space-y-2">
            {permissionPrompt.warnings.includes('fullScreenIntent') && (
              <div className="flex items-center gap-2 text-sm text-mystic-purple-light/70">
                <Lock className="h-4 w-4 text-mystic-gold" />
                <span>Permitir notificações em tela cheia</span>
              </div>
            )}
            {permissionPrompt.warnings.includes('batteryOptimization') && (
              <div className="flex items-center gap-2 text-sm text-mystic-purple-light/70">
                <Lock className="h-4 w-4 text-mystic-gold" />
                <span>Remover restrição de bateria</span>
              </div>
            )}
            {permissionPrompt.warnings.includes('notificationsDisabled') && (
              <div className="flex items-center gap-2 text-sm text-mystic-purple-light/70">
                <Lock className="h-4 w-4 text-mystic-gold" />
                <span>Ativar notificações do app</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePermissionPromptCancel}
            className="flex-1 rounded-lg border border-mystic-purple-light/30 bg-mystic-purple-dark/50 px-4 py-3 font-medium text-mystic-purple-light transition-colors hover:border-mystic-purple-light/60"
          >
            Depois
          </button>
          <button
            onClick={handlePermissionPromptConfirm}
            className="flex-1 rounded-lg bg-gradient-to-r from-mystic-gold to-mystic-gold-bright px-4 py-3 font-bold text-mystic-black transition-all hover:shadow-lg hover:shadow-mystic-gold/50"
          >
            Abrir Config
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-mystic-purple-light/50">
          Você pode ajustar isso manualmente nas configurações do app.
        </p>
      </div>
    </div>
  )
}