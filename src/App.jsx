import { createElement, lazy, Suspense, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { usePlatformContext } from './context/platform-context'
import { PlatformProvider } from './context/PlatformContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SeoHead } from './components/SeoHead'
import { PageTransition } from './components/PageTransition'
import { PermissionPromptModal } from './components/PermissionPromptModal'
import { RouteLoader } from './components/RouteLoader'
import { getRouteSeo } from './data/siteConfig'
import { MobileBottomNav } from './components/MobileBottomNav'
import { NotificationToast } from './components/NotificationToast'
import { attachNativeAppUrlListener } from './services/nativeMobilePush'
import { useTranslation } from 'react-i18next'

import { isNativeAndroidApp } from './services/nativeMobilePush'

const lazyNamed = (factory, exportName) => lazy(() => factory().then((module) => ({ default: module[exportName] })))

const HomePage = lazyNamed(() => import('./pages/HomePage'), 'HomePage')
const ApkHomePage = lazyNamed(() => import('./pages/ApkHomePage'), 'ApkHomePage')
const PlatformPage = lazyNamed(() => import('./pages/PlatformPage'), 'PlatformPage')
const AdminPage = lazyNamed(() => import('./pages/AdminPage'), 'AdminPage')
const PerfilPage = lazyNamed(() => import('./pages/PerfilPage'), 'PerfilPage')
const CadastroPage = lazyNamed(() => import('./pages/CadastroPage'), 'CadastroPage')
const EntrarPage = lazyNamed(() => import('./pages/EntrarPage'), 'EntrarPage')
const ConsultoresPage = lazyNamed(() => import('./pages/ConsultoresPage'), 'ConsultoresPage')
const SejaConsultorPage = lazyNamed(() => import('./pages/SejaConsultorPage'), 'SejaConsultorPage')
const AreaConsultorPage = lazyNamed(() => import('./pages/AreaConsultorPage'), 'AreaConsultorPage')
const TermosPage = lazyNamed(() => import('./pages/TermosPage'), 'TermosPage')
const PrivacidadePage = lazyNamed(() => import('./pages/PrivacidadePage'), 'PrivacidadePage')
const RecarregarPage = lazyNamed(() => import('./pages/RecarregarPage'), 'RecarregarPage')
const VideoRoomPage = lazyNamed(() => import('./pages/VideoRoomPage'), 'VideoRoomPage')
const MagiasPage = lazyNamed(() => import('./pages/MagiasPage'), 'MagiasPage')
const MagiaProdutoPage = lazyNamed(() => import('./pages/MagiaProdutoPage'), 'MagiaProdutoPage')
const ComoFuncionaPage = lazyNamed(() => import('./pages/ComoFuncionaPage'), 'ComoFuncionaPage')
const SuportePage = lazyNamed(() => import('./pages/SuportePage'), 'SuportePage')
const BlogPage = lazyNamed(() => import('./pages/BlogPage'), 'BlogPage')
const BlogArticlePage = lazyNamed(() => import('./pages/BlogArticlePage'), 'BlogArticlePage')
const AjudaPage = lazyNamed(() => import('./pages/AjudaPage'), 'AjudaPage')
const ContatoPage = lazyNamed(() => import('./pages/ContatoPage'), 'ContatoPage')
const ConsultorPerfilPage = lazyNamed(() => import('./pages/ConsultorPerfilPage'), 'ConsultorPerfilPage')
const OraclePage = lazyNamed(() => import('./pages/OraclePage'), 'OraclePage')
const SincronicidadePage = lazyNamed(() => import('./pages/SincronicidadePage'), 'SincronicidadePage')
const RespostasPage = lazyNamed(() => import('./pages/RespostasPage'), 'RespostasPage')
const TarotDiaPage = lazyNamed(() => import('./pages/TarotDiaPage'), 'TarotDiaPage')
const NumerologiaPage = lazyNamed(() => import('./pages/NumerologiaPage'), 'NumerologiaPage')

function RouteFallback() {
  const { t } = useTranslation()
  return <RouteLoader message={t('app.loader.opening_portal', 'Abrindo portal...')} />
}

const wrapWithTransition = (Component) => (
  <Suspense fallback={<RouteFallback />}>
    <PageTransition>
      {createElement(Component)}
    </PageTransition>
  </Suspense>
)

function ProtectedRoute({ children, role }) {
  const { t } = useTranslation()
  const { profile, authLoading, isAuthenticated, isAdmin, isConsultant } = usePlatformContext()

  if (authLoading) {
    return <RouteLoader message={t('app.loader.syncing_account', 'Sincronizando conta...')} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace />
  }

  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (role === 'consultant' && !isConsultant && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { inAppNotifications, removeInAppNotification, isAuthenticated, authLoading, trackingCredentials } =
    usePlatformContext()
  const routeSeo = getRouteSeo(location.pathname)
  const facebookPixelId = (trackingCredentials?.facebookPixelId ?? '').trim()
  const lastFacebookPixelPageViewRef = useRef(null)

  useEffect(() => {
    // Evita variação /rota e /rota/ que pode causar inconsistências de navegação.
    if (location.pathname.length > 1 && location.pathname.endsWith('/')) {
      const normalizedPath = location.pathname.replace(/\/+$/, '') || '/'
      navigate(`${normalizedPath}${location.search}${location.hash}`, { replace: true })
    }
  }, [location.pathname, location.search, location.hash, navigate])

  useEffect(() => attachNativeAppUrlListener((route) => navigate(route)), [navigate])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  useEffect(() => {
    if (!facebookPixelId) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if (!window.fbq) {
      ;(function (f, b, e, v, n, t, s) {
        if (f.fbq) return
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        }
        if (!f._fbq) f._fbq = n
        n.push = n
        n.loaded = true
        n.version = '2.0'
        n.queue = []
        t = b.createElement(e)
        t.async = true
        t.src = v
        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    }

    try {
      window.fbq('init', facebookPixelId)
      const initialKey = `${window.location.pathname}${window.location.search}${window.location.hash}`
      lastFacebookPixelPageViewRef.current = initialKey
      window.fbq('track', 'PageView')
    } catch {}

    try {
      const existingNoScript = document.getElementById('facebook-pixel-noscript')
      if (!existingNoScript) {
        const noScript = document.createElement('noscript')
        noScript.id = 'facebook-pixel-noscript'
        const img = document.createElement('img')
        img.height = 1
        img.width = 1
        img.style.display = 'none'
        img.src = `https://www.facebook.com/tr?id=${encodeURIComponent(
          facebookPixelId,
        )}&ev=PageView&noscript=1`
        noScript.appendChild(img)
        document.body.appendChild(noScript)
      }
    } catch {}
  }, [facebookPixelId])

  useEffect(() => {
    if (!facebookPixelId || typeof window === 'undefined' || !window.fbq) {
      return
    }

    const currentKey = `${location.pathname}${location.search}${location.hash}`
    if (lastFacebookPixelPageViewRef.current === currentKey) {
      return
    }
    lastFacebookPixelPageViewRef.current = currentKey

    try {
      window.fbq('track', 'PageView')
    } catch {}
  }, [facebookPixelId, location.hash, location.pathname, location.search])

  const renderHome = () => {
    if (isNativeAndroidApp()) {
       if (authLoading) return <RouteFallback />
       if (!isAuthenticated) return <Navigate to="/entrar" replace />
       return wrapWithTransition(ApkHomePage)
    }
    return wrapWithTransition(HomePage)
  }

  return (
    <>
      <SeoHead
        title={routeSeo.title}
        description={routeSeo.description}
        keywords={routeSeo.keywords}
        noindex={routeSeo.noindex}
        type={routeSeo.type}
        path={location.pathname}
      />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={renderHome()} />
          <Route path="/oraculo" element={wrapWithTransition(OraclePage)} />
          <Route path="/mapa-astral" element={wrapWithTransition(OraclePage)} />
          <Route path="/oraculo-diario" element={wrapWithTransition(OraclePage)} />
          <Route path="/carta-do-dia" element={<ProtectedRoute>{wrapWithTransition(TarotDiaPage)}</ProtectedRoute>} />
          <Route path="/numerologia" element={<ProtectedRoute>{wrapWithTransition(NumerologiaPage)}</ProtectedRoute>} />
          <Route path="/sincronicidade" element={wrapWithTransition(SincronicidadePage)} />
          <Route path="/plataforma" element={wrapWithTransition(PlatformPage)} />
          <Route 
            path="/admin" 
            element={<ProtectedRoute role="admin">{wrapWithTransition(AdminPage)}</ProtectedRoute>} 
          />
          <Route path="/perfil" element={wrapWithTransition(PerfilPage)} />
          <Route path="/respostas" element={wrapWithTransition(RespostasPage)} />
          <Route path="/cadastro" element={wrapWithTransition(CadastroPage)} />
          <Route path="/entrar" element={wrapWithTransition(EntrarPage)} />
          <Route path="/consultores" element={wrapWithTransition(ConsultoresPage)} />
          <Route path="/consultor/:consultantId" element={wrapWithTransition(ConsultorPerfilPage)} />
          <Route path="/seja-consultor" element={wrapWithTransition(SejaConsultorPage)} />
          <Route path="/sala/:sessionId" element={wrapWithTransition(VideoRoomPage)} />
          <Route 
            path="/area-consultor" 
            element={<ProtectedRoute role="consultant">{wrapWithTransition(AreaConsultorPage)}</ProtectedRoute>} 
          />
          <Route 
            path="/recarregar" 
            element={<ProtectedRoute>{wrapWithTransition(RecarregarPage)}</ProtectedRoute>} 
          />
          <Route path="/termos" element={wrapWithTransition(TermosPage)} />
          <Route path="/privacidade" element={wrapWithTransition(PrivacidadePage)} />
          <Route path="/magias" element={wrapWithTransition(MagiasPage)} />
          <Route path="/magias/:spellId" element={wrapWithTransition(MagiaProdutoPage)} />
          <Route path="/como-funciona" element={wrapWithTransition(ComoFuncionaPage)} />
          <Route path="/suporte" element={wrapWithTransition(SuportePage)} />
          <Route path="/blog" element={wrapWithTransition(BlogPage)} />
          <Route path="/blog/:slug" element={wrapWithTransition(BlogArticlePage)} />
          <Route path="/ajuda" element={wrapWithTransition(AjudaPage)} />
          <Route path="/contato" element={wrapWithTransition(ContatoPage)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <MobileBottomNav />
      <NotificationToast 
        notifications={inAppNotifications}
        onClose={removeInAppNotification}
      />
      <PermissionPromptModal />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <PlatformProvider>
        <AppContent />
      </PlatformProvider>
    </ErrorBoundary>
  )
}

export default App
