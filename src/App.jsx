import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import { PageTransition } from './components/PageTransition'
import { MobileBottomNav } from './components/MobileBottomNav'

const wrapWithTransition = (element) => <PageTransition>{element}</PageTransition>

function App() {
  const location = useLocation()

  return (
    <PlatformProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={wrapWithTransition(<HomePage />)} />
          <Route path="/plataforma" element={wrapWithTransition(<PlatformPage />)} />
          <Route path="/admin" element={wrapWithTransition(<AdminPage />)} />
          <Route path="/perfil" element={wrapWithTransition(<PerfilPage />)} />
          <Route path="/cadastro" element={wrapWithTransition(<CadastroPage />)} />
          <Route path="/entrar" element={wrapWithTransition(<EntrarPage />)} />
          <Route path="/consultores" element={wrapWithTransition(<ConsultoresPage />)} />
          <Route path="/seja-consultor" element={wrapWithTransition(<SejaConsultorPage />)} />
          <Route path="/area-consultor" element={wrapWithTransition(<AreaConsultorPage />)} />
          <Route path="/recarregar" element={wrapWithTransition(<RecarregarPage />)} />
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
