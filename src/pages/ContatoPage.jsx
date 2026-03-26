import { PageShell } from '../components/PageShell'
import { SacredGeometry } from '../components/SacredGeometry'
import { Mail, MapPin, Phone, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'

export function ContatoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <SacredGeometry />

      <PageShell title="Entre em Contato" subtitle="Conversar com nossa equipe">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Contact Info */}
          <div>
            <h2 className="font-playfair text-3xl text-white mb-8">Informações de Contato</h2>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-mystic-gold/20 border border-mystic-gold/50">
                    <Mail className="w-6 h-6 text-mystic-gold" />
                  </div>
                </div>
                <div>
                  <h3 className="font-playfair text-lg text-white mb-1">Email</h3>
                  <p className="text-mystic-purple-light">contato@astria.com.br</p>
                  <p className="text-mystic-purple-light/60 text-sm">Resposta em até 24 horas</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-mystic-gold/20 border border-mystic-gold/50">
                    <Phone className="w-6 h-6 text-mystic-gold" />
                  </div>
                </div>
                <div>
                  <h3 className="font-playfair text-lg text-white mb-1">WhatsApp</h3>
                  <p className="text-mystic-purple-light">+55 (11) 98765-4321</p>
                  <p className="text-mystic-purple-light/60 text-sm">Seg-Dom: 9h às 22h</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-mystic-gold/20 border border-mystic-gold/50">
                    <MapPin className="w-6 h-6 text-mystic-gold" />
                  </div>
                </div>
                <div>
                  <h3 className="font-playfair text-lg text-white mb-1">Endereço</h3>
                  <p className="text-mystic-purple-light">São Paulo, SP</p>
                  <p className="text-mystic-purple-light/60 text-sm">Brasil</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-8 md:p-12">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-mystic-gold" />
                <span className="text-xs uppercase tracking-widest text-mystic-purple-light">Enviar Mensagem</span>
              </div>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✨</div>
                  <p className="font-playfair text-2xl text-mystic-gold mb-2">Mensagem Enviada!</p>
                  <p className="text-mystic-purple-light">Obrigado por entrar em contato. Nossa equipe responderá em breve.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-mystic-gold mb-2">Seu Nome</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-mystic-purple-light/30 bg-mystic-purple-dark/30 text-white placeholder-mystic-purple-light/40 focus:outline-none focus:border-mystic-gold transition-colors"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-mystic-gold mb-2">Seu Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-mystic-purple-light/30 bg-mystic-purple-dark/30 text-white placeholder-mystic-purple-light/40 focus:outline-none focus:border-mystic-gold transition-colors"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-mystic-gold mb-2">Assunto</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-mystic-purple-light/30 bg-mystic-purple-dark/30 text-white placeholder-mystic-purple-light/40 focus:outline-none focus:border-mystic-gold transition-colors"
                      placeholder="Assunto da mensagem"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-mystic-gold mb-2">Mensagem</label>
                    <textarea
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-mystic-purple-light/30 bg-mystic-purple-dark/30 text-white placeholder-mystic-purple-light/40 focus:outline-none focus:border-mystic-gold transition-colors resize-none"
                      placeholder="Sua mensagem aqui..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-mystic-gold to-mystic-gold-light text-mystic-black font-bold py-3 hover:shadow-gold-glow transition-all flex items-center justify-center gap-2 group"
                  >
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Enviar Mensagem
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Map or additional info */}
        <div className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-8 text-center">
          <h3 className="font-playfair text-2xl text-white mb-4">Horário de Funcionamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { day: 'Segunda a Sexta', time: '9h às 18h' },
              { day: 'Sábado', time: '10h às 16h' },
              { day: 'Domingo', time: 'Fechado' },
            ].map((schedule, idx) => (
              <div key={idx} className="p-4">
                <p className="text-mystic-gold font-semibold mb-1">{schedule.day}</p>
                <p className="text-mystic-purple-light">{schedule.time}</p>
              </div>
            ))}
          </div>
        </div>

      </PageShell>
    </div>
  )
}
