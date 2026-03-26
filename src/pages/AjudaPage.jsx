import { PageShell } from '../components/PageShell'
import { SacredGeometry } from '../components/SacredGeometry'
import { Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const faqCategories = [
  {
    category: 'Conta e Cadastro',
    faqList: [
      { q: 'Como faço para me cadastrar?', a: 'Acesse a página de cadastro, preencha seus dados e confirme seu email. Em segundos você estará pronto para usar!' },
      { q: 'Esqueci minha senha, como recupero?', a: 'Clique em "Esqueci minha senha" na tela de login e siga as instruções enviadas para seu email.' },
      { q: 'Posso usar mais de uma conta?', a: 'Cada pessoa pode ter apenas uma conta. Contas duplicadas serão removidas.' },
      { q: 'Como deleto minha conta?', a: 'Em configurações, procure por "Deletar conta" e siga as instruções. Seus dados serão permanentemente removidos.' },
    ]
  },
  {
    category: 'Pagamento e Recarga',
    faqList: [
      { q: 'Como recarrego meu saldo?', a: 'Vá para "Recarregar", escolha o valor e a forma de pagamento. A recarrega é instantânea!' },
      { q: 'Quais são as formas de pagamento?', a: 'Cartão de crédito, débito, PIX, transferência bancária e carteiras digitais.' },
      { q: 'Há limite de recarga?', a: 'Não há limite por transação, mas existem limites diários conforme sua institução bancária.' },
      { q: 'Como vejo meu histórico de transações?', a: 'Na aba "Carteira", você pode ver todas as recargas e gastos com consultas.' },
    ]
  },
  {
    category: 'Consultas e Serviços',
    faqList: [
      { q: 'Como faço uma consulta?', a: 'Escolha um consultor, selecione o serviço (perguntas ou vídeo) e confirme a transação.' },
      { q: 'Posso reagendar uma consulta?', a: 'Para video: até 2 horas antes. Para perguntas: após recebimento da primeira resposta.' },
      { q: 'O consultor pode recusar a sessão?', a: 'Consultores têm direito de recusar em casos extremos. Você receberá reembolso integral.' },
      { q: 'Quanto tempo leva para receber a resposta?', a: '3-5 horas para perguntas. Vídeo é em tempo real quando o consultor está online.' },
    ]
  },
  {
    category: 'Privacidade e Segurança',
    faqList: [
      { q: 'Meus dados são seguros?', a: 'Sim! Usamos criptografia SSL e não compartilhamos seus dados com terceiros.' },
      { q: 'As consultas são anônimas?', a: 'Sim, você pode usar um pseudônimo se desejar. O consultor não sabe seu nome real.' },
      { q: 'Posso denunciar um consultor?', a: 'Sim, use o botão "Denunciar" no perfil. Nossa equipe investigará imediatamente.' },
      { q: 'Como são armazenadas as gravações?', a: 'Não gravamos sessões de vídeo automaticamente. Ambos podem solicitar gravação por escrito.' },
    ]
  }
]

export function AjudaPage() {
  const [expanded, setExpanded] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  const toggleFAQ = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredCategories = faqCategories.map(cat => ({
    ...cat,
    faqList: cat.faqList.filter(faq => 
      faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.faqList.length > 0)

  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <SacredGeometry />

      <PageShell title="Central de Ajuda" subtitle="Encontre respostas para suas dúvidas">
        
        {/* Search Bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mystic-gold pointer-events-none" />
            <input
              type="text"
              placeholder="Busque sua dúvida..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 rounded-full border border-mystic-gold/50 bg-mystic-purple-dark/30 text-white placeholder-mystic-purple-light/50 focus:outline-none focus:border-mystic-gold backdrop-blur-sm"
            />
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {filteredCategories.map((section, sIdx) => (
            <div key={sIdx}>
              <h2 className="font-playfair text-3xl text-mystic-gold mb-6">{section.category}</h2>
              <div className="space-y-4">
                {section.faqList.map((faq, fIdx) => {
                  const id = `${sIdx}-${fIdx}`
                  const isOpen = expanded[id]
                  
                  return (
                    <div key={id} className="rounded-xl border border-mystic-purple-light/20 hover:border-mystic-gold/50 transition-all overflow-hidden glass-panel">
                      <button
                        onClick={() => toggleFAQ(id)}
                        className="w-full px-8 py-5 flex items-center justify-between text-left hover:bg-mystic-gold/5 transition-colors"
                      >
                        <h3 className="font-playfair text-lg text-white">{faq.q}</h3>
                        <ChevronDown className={`w-5 h-5 text-mystic-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isOpen && (
                        <div className="px-8 py-5 border-t border-mystic-purple-light/10 bg-mystic-purple-dark/20">
                          <p className="text-mystic-purple-light leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && searchTerm && (
          <div className="text-center py-16">
            <p className="text-mystic-purple-light text-lg mb-4">Nenhum resultado encontrado para "{searchTerm}"</p>
            <p className="text-mystic-purple-light/60">Tente usar diferentes palavras-chave</p>
          </div>
        )}

      </PageShell>
    </div>
  )
}
