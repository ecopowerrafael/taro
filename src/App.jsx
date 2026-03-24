import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { usePlatformContext } from './context/platform-context'
import { HomePage } from './pages/HomePage'
import { PlatformPage } from './pages/PlatformPage'
import { PlatformProvider } from './context/PlatformContext'
import { AdminPage } from './pages/AdminPage'
import { PerfilPage } from './pages/PerfilPage'
import { CadastroPage } from './pages/CadastroPage'
import { EntrarPage } from './pages/EntrarPage'
import { ConsultoresPage } from './pages/ConsultoresPage'
import { SejaConsultorPage } from './pages/SejaConsultorPage'
import { AreaConsultorPage } from './pages/AreaConsultorPage'
import { TermosPage } from './pages/TermosPage'
import { PrivacidadePage } from './pages/PrivacidadePage'
import { RecarregarPage } from './pages/RecarregarPage'
import { VideoRoomPage } from './pages/VideoRoomPage'
import { PageTransition } from './components/PageTransition'
import { MobileBottomNav } from './components/MobileBottomNav'

const wrapWithTransition = (element) => <PageTransition>{element}</PageTransition>

function ProtectedRoute({ children, role }) {
  const { authLoading, isAuthenticated, isAdmin, isConsultant } = usePlatformContext()

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

function App() {
  const location = useLocation()

  return (
    <PlatformProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={wrapWithTransition(<HomePage />)} />
          <Route path="/plataforma" element={wrapWithTransition(<PlatformPage />)} />
          <Route 
            path="/admin" 
            element={<ProtectedRoute role="admin">{wrapWithTransition(<AdminPage />)}</ProtectedRoute>} 
          />
          <Route path="/perfil" element={wrapWithTransition(<PerfilPage />)} />
          <Route path="/cadastro" element={wrapWithTransition(<CadastroPage />)} />
          <Route path="/entrar" element={wrapWithTransition(<EntrarPage />)} />
          <Route path="/consultores" element={wrapWithTransition(<ConsultoresPage />)} />
          <Route path="/seja-consultor" element={wrapWithTransition(<SejaConsultorPage />)} />
          <Route path="/sala/:sessionId" element={wrapWithTransition(<VideoRoomPage />)} />
          <Route 
            path="/area-consultor" 
            element={<ProtectedRoute role="consultant">{wrapWithTransition(<AreaConsultorPage />)}</ProtectedRoute>} 
          />
          <Route 
            path="/recarregar" 
            element={<ProtectedRoute>{wrapWithTransition(<RecarregarPage />)}</ProtectedRoute>} 
          />
          <Route path="/termos" element={wrapWithTransition(<TermosPage />)} />
          <Route path="/privacidade" element={wrapWithTransition(<PrivacidadePage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <MobileBottomNav />
    </PlatformProvider>
  )
}

export default App
