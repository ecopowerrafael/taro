import { lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { usePlatformContext } from './context/platform-context'
import { PlatformProvider } from './context/PlatformContext'
import { SeoHead } from './components/SeoHead'
import { PageTransition } from './components/PageTransition'
import { getRouteSeo } from './data/siteConfig'
import { MobileBottomNav } from './components/MobileBottomNav'
import { NotificationToast } from './components/NotificationToast'

const lazyNamed = (factory, exportName) => lazy(() => factory().then((module) => ({ default: module[exportName] })))

const HomePage = lazyNamed(() => import('./pages/HomePage'), 'HomePage')
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

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mystic-purple text-mystic-gold">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-mystic-gold border-t-transparent"></div>
    </div>
  )
}

const wrapWithTransition = (Component) => (
  <Suspense fallback={<RouteFallback />}>
    <PageTransition>
      <Component />
    </PageTransition>
  </Suspense>
)

function ProtectedRoute({ children, role }) {
  const { profile, authLoading, isAuthenticated, isAdmin, isConsultant } = usePlatformContext()

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mystic-purple text-mystic-gold">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-mystic-gold border-t-transparent"></div>
      </div>
    )
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
  const { inAppNotifications, removeInAppNotification } = usePlatformContext()
  const routeSeo = getRouteSeo(location.pathname)

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
          <Route path="/" element={wrapWithTransition(HomePage)} />
          <Route path="/plataforma" element={wrapWithTransition(PlatformPage)} />
          <Route 
            path="/admin" 
            element={<ProtectedRoute role="admin">{wrapWithTransition(AdminPage)}</ProtectedRoute>} 
          />
          <Route path="/perfil" element={wrapWithTransition(PerfilPage)} />
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
    </>
  )
}

function App() {
  return (
    <PlatformProvider>
      <AppContent />
    </PlatformProvider>
  )
}

export default App
