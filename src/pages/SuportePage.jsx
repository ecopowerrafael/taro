import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { SacredGeometry } from '../components/SacredGeometry'
import { Mail, MessageSquare, Phone } from 'lucide-react'

export function SuportePage() {
  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <SacredGeometry />

      <PageShell title="Centro de Suporte" subtitle="Estamos aqui para ajudar você">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: Mail, title: 'Email', desc: 'suporte@astria.com.br', action: 'Enviar' },
            { icon: Phone, title: 'WhatsApp', desc: '+55 (11) 98765-4321', action: 'Chatear' },
            { icon: MessageSquare, title: 'Chat ao Vivo', desc: 'Disponível 24/7', action: 'Iniciar' },
          ].map((contact, idx) => {
            const Icon = contact.icon
            return (
              <div key={idx} className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-8 text-center hover:border-mystic-gold/50 transition-all">
                <Icon className="w-12 h-12 text-mystic-gold mx-auto mb-4" />
                <h3 className="font-playfair text-2xl text-white mb-2">{contact.title}</h3>
                <p className="text-mystic-purple-light mb-6">{contact.desc}</p>
                <button className="px-6 py-2 rounded-full bg-mystic-gold text-mystic-black font-bold text-sm hover:bg-mystic-gold-light transition-colors">
                  {contact.action}
                </button>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-12">
          <h2 className="font-playfair text-3xl text-white mb-6">Dúvidas Frequentes</h2>
          <div className="space-y-6">
            {['Qual é o horário de atendimento?', 'Como recupero minha senha?', 'Como cancelo uma sessão?'].map((q, idx) => (
              <div key={idx} className="pb-4 border-b border-mystic-purple-light/20 last:border-b-0">
                <p className="font-playfair text-lg text-mystic-gold">{q}</p>
                <p className="text-mystic-purple-light mt-2">Resposta disponível no nosso centro de ajuda.</p>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </div>
  )
}
