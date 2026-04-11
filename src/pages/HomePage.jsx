import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Moon, ArrowRight, Sun, Eye, Menu, X } from 'lucide-react'
import { usePlatformContext } from '../context/platform-context'
import { DailyTarotCard } from '../components/DailyTarotCard'
import { SacredGeometry } from '../components/SacredGeometry'
import { FloatingCard } from '../components/FloatingCard'
import { buildHeaderLinks, publicNavLinks } from '../utils/navigation'

const benefits = [
  {
    title: 'Clareza Imediata',
    description: 'Respostas rápidas para dúvidas que tiram seu sono.',
    image: '/clareza-imediata.png',
  },
  {
    title: 'Especialistas Reais',
    description: 'Profissionais avaliados pela comunidade e pela plataforma.',
    image: '/especialistas-reais.png',
  },
  {
    title: 'Privacidade Total',
    description: 'Consultas 100% anônimas e seguras via vídeo.',
    image: '/privacidade-total.png',
  },
  {
    title: 'Economia',
    description: 'Você paga apenas pelos minutos que utilizar.',
    image: '/economia.png',
  },
]

const professionalBenefits = [
  { title: 'Flexibilidade Total', description: 'Trabalhe quando e onde quiser', image: '/flexibilidade-total.png' },
  { title: 'Pagamento Semanal', description: 'Receba via PIX toda semana', image: '/pagamento-semanal.png' },
  { title: 'Suporte Dedicado', description: 'Equipe pronta para te ajudar', image: '/suporte-dedicado.png' },
]

function useCountAnimation({ start, end, duration, shouldStart }) {
  const [value, setValue] = useState(start)

  useEffect(() => {
    if (!shouldStart) {
      return undefined
    }

    const startedAt = performance.now()
    const tickRate = 1000 / 30

    const timer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      const nextValue = Math.round(start + (end - start) * eased)
      setValue(nextValue)

      if (progress >= 1) {
        window.clearInterval(timer)
      }
    }, tickRate)

    return () => {
      window.clearInterval(timer)
    }
  }, [duration, end, shouldStart, start])

  return value
}

export function HomePage() {
  const statsSectionRef = useRef(null)
  const [shouldStartCounters, setShouldStartCounters] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useEffect(() => {
    const target = statsSectionRef.current
    if (!target || shouldStartCounters) {
      return
    }
    // ...restante do código do useEffect...
  }, [shouldStartCounters])

      {/* FOOTER */}
      <footer className="relative border-t border-mystic-gold/20 bg-mystic-black pt-20 pb-10 overflow-hidden">
        {/* Footer Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-mystic-purple-dark/40 blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Brand */}
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <img src="/logoastria.png" alt="Astria" className="w-8 h-8" />
                <span className="font-playfair text-3xl font-bold text-white">Astria</span>
              </div>
              <p className="text-mystic-purple-light text-sm leading-relaxed mb-6">
                A ponte entre o seu momento atual e o destino que o universo preparou para você.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-playfair text-lg text-white mb-6">Plataforma</h4>
              <ul className="space-y-4">
                {['Consultores', 'Serviços', 'Como Funciona', 'Blog'].map((link, i) => {
                  const paths = {
                    'Consultores': '/consultores',
                    'Serviços': '/magias',
                    'Como Funciona': '/como-funciona',
                    'Blog': '/blog'
                  }
                  return (
                    <li key={i}>
                      <a href={paths[link]} className="text-mystic-purple-light hover:text-mystic-gold text-sm transition-colors flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-mystic-gold/50" /> {link}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Para Consultores */}
            <div>
              <h4 className="font-playfair text-lg text-white mb-6">Para Consultores</h4>
              <ul className="space-y-4">
                {[
                  { name: 'Seja Consultor', path: '/seja-consultor' },
                  { name: 'Área do Consultor', path: '/area-consultor' },
                  { name: 'Suporte', path: '/suporte' }
                ].map((link, i) => (
                  <li key={i}>
                    <a href={link.path} className="text-mystic-purple-light hover:text-mystic-gold text-sm transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-playfair text-lg text-white mb-6">Legal</h4>
              <ul className="space-y-4">
                {[
                  { name: 'Termos de Uso', path: '/termos' },
                  { name: 'Privacidade', path: '/privacidade' },
                  { name: 'Central de Ajuda', path: '/ajuda' },
                  { name: 'Contato', path: '/contato' }
                ].map((link, i) => (
                  <li key={i}>
                    <a href={link.path} className="text-mystic-purple-light hover:text-mystic-gold text-sm transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Copyright & Security */}
          <div className="pt-8 border-t border-mystic-purple-light/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-mystic-purple-light/60 text-xs">
              © {new Date().getFullYear()} Astria. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-mystic-purple-light/60 text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Conexão Segura</span>
              <span className="text-mystic-purple-light/60 text-xs">SSL Criptografado</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
