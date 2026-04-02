import { useEffect, useState } from 'react'
import { Sparkles, Wallet, Users, MessageSquare, Video, Wand2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { SacredGeometry } from '../components/SacredGeometry'

const steps = [
  {
    icon: Users,
    title: 'Cadastro',
    description: 'Crie sua conta em poucos minutos com seus dados e escolha uma senha segura.',
    number: '01'
  },
  {
    icon: Wallet,
    title: 'Recarga de Saldo',
    description: 'Recarregue sua carteira digital com o valor desejado para iniciar consultas.',
    number: '02'
  },
  {
    icon: Eye,
    title: 'Escolher Consultor',
    description: 'Navegue pela plataforma e escolha o consultor ideal para suas necessidades.',
    number: '03'
  },
  {
    icon: MessageSquare,
    title: 'Fazer Pergunta',
    description: 'Envie suas perguntas em pacotes de 3 ou 5 questões para resposta do especialista.',
    number: '04'
  },
  {
    icon: Video,
    title: 'Chamada ao Vivo',
    description: 'Conecte-se em tempo real via vídeo seguro para consulta imediata do especialista.',
    number: '05'
  },
  {
    icon: Wand2,
    title: 'Contrate Serviços',
    description: 'Escolha entre agendamento de rituais mágicos executados por profissionais especializados.',
    number: '06'
  },
]

export function ComoFuncionaPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato selection:bg-mystic-gold/30 selection:text-mystic-gold">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
      <SacredGeometry />

      {/* PAGE SHELL */}
      <PageShell title="Como Funciona" subtitle="Guia completo para usar a plataforma Astria">
        
        {/* INTRO SECTION */}
        <section className="mb-20 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-mystic-purple-light/30 bg-mystic-purple-light/10 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-mystic-gold" />
            <span className="text-xs uppercase tracking-widest text-mystic-purple-light">Seu Caminho até as Respostas</span>
          </div>
          
          <h1 className="font-playfair text-5xl md:text-6xl leading-[1.1] mb-6 drop-shadow-2xl">
            6 Passos Simples <br/>
            <span className="text-gradient-gold italic">para Transformação</span>
          </h1>
          
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed font-light text-mystic-purple-light md:text-xl">
            A plataforma Astria foi desenvolvida para ser intuitiva e acessível. Em apenas 6 passos, você terá acesso a consultas personalizadas, leituras de tarot, rituais mágicos e muito mais.
          </p>
        </section>

        {/* STEPS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={idx} className="group relative overflow-hidden rounded-2xl border border-mystic-purple-light/20 glass-panel p-8 text-center transition-all duration-500 hover:-translate-y-2 hover:border-mystic-gold/50">
                
                {/* Background Accent */}
                <div className="absolute inset-0 bg-gradient-to-b from-mystic-gold/0 to-mystic-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Number Badge */}
                <div className="relative z-10 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-mystic-gold/50 bg-mystic-gold/10 transition-all duration-500 group-hover:scale-110 group-hover:border-mystic-gold">
                  <span className="font-playfair text-2xl text-mystic-gold font-bold">{step.number}</span>
                </div>
                
                {/* Icon */}
                <div className="relative z-10 mb-4 flex justify-center">
                  <Icon className="w-10 h-10 text-mystic-gold group-hover:scale-125 transition-transform duration-500" />
                </div>
                
                {/* Title */}
                <h3 className="relative mb-3 font-playfair text-2xl text-white transition-colors group-hover:text-mystic-gold">
                  {step.title}
                </h3>
                
                {/* Description */}
                <p className="relative text-sm leading-relaxed text-mystic-purple-light">
                  {step.description}
                </p>
              </div>
            )
          })}
        </section>

        {/* FEATURES SECTION */}
        <section className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-12 mb-20">
          <h2 className="font-playfair text-4xl text-white mb-12 text-center">
            O que você pode fazer em <span className="text-gradient-gold italic">Astria</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Consultas com Tarólogos',
                items: [
                  '✨ Leitura de tarot presencial',
                  '💭 Pacotes de perguntas (3 ou 5)',
                  '📞 Chamadas ao vivo em vídeo',
                  '⭐ Avaliação e histórico de consultas'
                ]
              },
              {
                title: 'Serviços Mágicos',
                items: [
                  '🔮 Ritua Personalizados',
                  '💝 Trabalhos de Amarração',
                  '🪙 Rituais de Prosperidade',
                  '🛡️ Proteção Espiritual'
                ]
              },
              {
                title: 'Segurança e Privacidade',
                items: [
                  '🔒 Consultações 100% anônimas',
                  '🔐 Criptografia SSL',
                  '🛡️ Proteção de dados pessoais',
                  '✅ Garantia de confidencialidade'
                ]
              },
              {
                title: 'Pagamento Flexível',
                items: [
                  '💳 Múltiplas formas de pagamento',
                  '⏱️ Cobrança por minuto em vídeo',
                  '📊 Saldo sempre disponível',
                  '🔄 Recargas rápidas e seguras'
                ]
              }
            ].map((section, idx) => (
              <div key={idx} className="rounded-xl border border-mystic-gold/30 bg-mystic-purple-dark/30 p-8 text-center">
                <h3 className="mb-6 font-playfair text-2xl text-mystic-gold">{section.title}</h3>
                <ul className="space-y-4">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-center justify-center gap-3 text-mystic-purple-light">
                      <span className="text-mystic-gold">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="mb-20">
          <h2 className="font-playfair text-4xl text-white mb-12 text-center">
            Perguntas Frequentes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: 'Como faço para recarregar meu saldo?',
                a: 'Acesse a seção "Recarregar" na sua área do cliente. Escolha o valor e a forma de pagamento. A recarrega é processada instantaneamente.'
              },
              {
                q: 'Posso confiar na privacidade das consultas?',
                a: 'Sim! Todas as consultas são 100% anônimas e protegidas por criptografia SSL. Seus dados nunca são compartilhados.'
              },
              {
                q: 'Como os consultores são selecionados?',
                a: 'Todos os consultores passam por um rigoroso processo de verificação. Avaliações e histórico de clientes garantem qualidade.'
              },
              {
                q: 'Posso fazer chamadas de vídeo com qualquer consultor?',
                a: 'Sim, desde que o consultor esteja online ou você possa agendar uma chamada. Consultores oferecem diferentes disponibilidades.'
              },
              {
                q: 'O que fazer se não estiver satisfeito?',
                a: 'Temos política de satisfação do cliente. Entre em contato com nosso suporte para resolução de qualquer problema.'
              },
              {
                q: 'Quais são as opções de pagamento?',
                a: 'Aceitamos cartões de crédito, débito, PIX, transferência bancária e várias carteiras digitais para sua comodidade.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-mystic-purple-light/20 bg-mystic-purple/10 p-6 text-center transition-all hover:border-mystic-gold/50">
                <h3 className="mb-3 font-playfair text-lg text-mystic-gold">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-mystic-purple-light">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="text-center bg-gradient-to-r from-mystic-purple-dark/40 to-mystic-purple-dark/20 rounded-2xl p-12">
          <h2 className="font-playfair text-4xl text-white mb-4">Pronto para Começar?</h2>
          <p className="text-mystic-purple-light text-lg mb-8 max-w-2xl mx-auto">
            Faça seu cadastro em poucos minutos e acesse imediatamente os melhores especialistas espirituais.
          </p>
          <Link
            to="/cadastro"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-mystic-gold to-mystic-gold-light text-mystic-black font-bold uppercase tracking-widest text-sm hover:shadow-gold-glow-lg transition-shadow"
          >
            Criar Minha Conta Agora
          </Link>
        </section>

      </PageShell>
    </div>
  )
}
