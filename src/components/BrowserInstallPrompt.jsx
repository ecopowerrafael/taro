import { useEffect, useMemo, useState } from 'react'
import { Download, Smartphone, X } from 'lucide-react'
import { isNativeAndroidApp } from '../services/nativeMobilePush'

const APK_URL = 'https://appastria.online/app-astria.apk'

function detectMobileOs() {
  if (typeof navigator === 'undefined') {
    return null
  }

  const ua = navigator.userAgent || navigator.vendor || ''
  const isAndroid = /Android/i.test(ua)
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  if (isAndroid) return 'android'
  if (isIOS) return 'ios'
  return null
}

export function BrowserInstallPrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [deferredInstall, setDeferredInstall] = useState(null)
  const mobileOs = useMemo(() => detectMobileOs(), [])

  useEffect(() => {
    if (!mobileOs || isNativeAndroidApp()) {
      return
    }

    setIsOpen(true)
  }, [mobileOs])

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredInstall(event)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  if (!isOpen || !mobileOs) {
    return null
  }

  const handleInstall = async () => {
    if (mobileOs === 'android') {
      window.location.href = APK_URL
      return
    }

    if (deferredInstall) {
      deferredInstall.prompt()
      try {
        await deferredInstall.userChoice
      } finally {
        setDeferredInstall(null)
      }
      return
    }

    setShowIosGuide(true)
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-mystic-gold/30 bg-[linear-gradient(180deg,rgba(33,18,54,0.98),rgba(10,7,18,0.96))] p-6 text-amber-50 shadow-[0_35px_90px_rgba(0,0,0,0.55)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-mystic-gold/45 bg-mystic-gold/10 p-3">
              <Smartphone className="h-5 w-5 text-mystic-goldSoft" />
            </div>
            <p className="font-display text-2xl text-mystic-goldSoft">Melhor no App</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-mystic-gold/25 p-2 text-mystic-goldSoft transition hover:bg-mystic-gold/10"
            aria-label="Fechar aviso"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-amber-100/85">
          Para uma melhor experiencia experimente baixar nosso aplicativo:
        </p>

        {showIosGuide ? (
          <div className="mt-4 rounded-2xl border border-mystic-gold/20 bg-black/25 p-4 text-sm text-amber-100/80">
            No iOS: toque em <strong>Compartilhar</strong> no navegador e depois em <strong>Adicionar a Tela de Inicio</strong> para instalar o PWA.
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleInstall}
            className="flex-1 rounded-xl bg-mystic-gold px-4 py-3 font-bold text-mystic-dark transition hover:brightness-110"
          >
            <span className="inline-flex items-center gap-2">
              <Download size={16} />
              Baixar
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-xl border border-mystic-gold/35 px-4 py-3 text-mystic-goldSoft transition hover:bg-mystic-gold/10"
          >
            Agora nao
          </button>
        </div>
      </div>
    </div>
  )
}