import { PageShell } from '../components/PageShell'
import { SacredGeometry } from '../components/SacredGeometry'
import { Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const FAQ_STRUCTURE = [
  { key: 'account', count: 4 },
  { key: 'payment', count: 4 },
  { key: 'consultations', count: 4 },
  { key: 'privacy', count: 4 },
]

export function AjudaPage() {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  const toggleFAQ = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const faqCategories = FAQ_STRUCTURE.map((section) => ({
    category: t(`help_center.faq.${section.key}.title`),
    faqList: Array.from({ length: section.count }, (_, idx) => ({
      q: t(`help_center.faq.${section.key}.q${idx + 1}`),
      a: t(`help_center.faq.${section.key}.a${idx + 1}`),
    })),
  }))

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

      <PageShell title={t('help_center.title')} subtitle={t('help_center.subtitle')}>
        
        {/* Search Bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mystic-gold pointer-events-none" />
            <input
              type="text"
              placeholder={t('help_center.search_placeholder')}
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
            <p className="text-mystic-purple-light text-lg mb-4">{t('help_center.no_results_prefix')} "{searchTerm}"</p>
            <p className="text-mystic-purple-light/60">{t('help_center.try_other_keywords')}</p>
          </div>
        )}

      </PageShell>
    </div>
  )
}
