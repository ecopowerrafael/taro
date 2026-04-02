import { useState, useMemo } from 'react'
import { Star, ChevronLeft, ChevronRight, ArrowUpDown, MessageCircle, Eye, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard } from './GlassCard'

const statusStyles = {
  Online: 'border-emerald-400/70 bg-emerald-500/15 text-emerald-300',
  Ocupado: 'border-amber-400/70 bg-amber-500/10 text-amber-300',
  Offline: 'border-zinc-400/70 bg-zinc-500/10 text-zinc-300',
}

export function ConsultantMarketplaceNew({
  consultants,
  statusFilter,
  onStatusFilterChange,
  onChooseService,
  onSelectConsultant,
}) {
  const [sortOrder, setSortOrder] = useState('none')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const itemsPerPage = 8

  const filteredConsultants = useMemo(() => {
    let result =
      statusFilter === 'Todos'
        ? consultants.filter(c => c.status !== 'pending' && c.status !== 'Pendente')
        : consultants.filter((consultant) => consultant.status === statusFilter && consultant.status !== 'pending' && consultant.status !== 'Pendente')

    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.tagline && c.tagline.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => a.pricePerMinute - b.pricePerMinute)
    } else if (sortOrder === 'desc') {
      result = [...result].sort((a, b) => b.pricePerMinute - a.pricePerMinute)
    }

    return result
  }, [consultants, statusFilter, sortOrder, searchQuery])

  const totalPages = Math.ceil(filteredConsultants.length / itemsPerPage)
  const currentConsultants = filteredConsultants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleStatusChange = (e) => {
    onStatusFilterChange(e.target.value)
    setCurrentPage(1)
  }

  const toggleSortOrder = () => {
    setSortOrder((prev) => {
      if (prev === 'none') return 'asc'
      if (prev === 'asc') return 'desc'
      return 'none'
    })
    setCurrentPage(1)
  }

  return (
    <div className="w-full">
      {/* FILTERS BAR */}
      <div className="glass-panel rounded-2xl p-4 md:p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mystic-purple-light" />
          <input 
            type="text" 
            placeholder="Busque por nome, especialidade..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full bg-mystic-black/50 border border-mystic-purple-light/30 rounded-full py-3 pl-12 pr-4 text-white placeholder:text-mystic-purple-light/60 focus:outline-none focus:border-mystic-gold transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex overflow-x-auto w-full md:w-auto gap-3 pb-2 md:pb-0 hide-scrollbar items-center">
          <select 
            value={statusFilter}
            onChange={handleStatusChange}
            className="flex-shrink-0 px-5 py-2.5 rounded-full border border-mystic-gold/30 bg-mystic-purple-dark/30 hover:bg-mystic-purple-dark/80 text-mystic-purple-light hover:text-mystic-gold hover:border-mystic-gold transition-all text-sm whitespace-nowrap"
          >
            <option>Todos</option>
            <option>Online</option>
            <option>Ocupado</option>
            <option>Offline</option>
          </select>

          <button 
            onClick={toggleSortOrder}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border border-mystic-gold/30 bg-mystic-purple-dark/30 hover:bg-mystic-purple-dark/80 text-mystic-purple-light hover:text-mystic-gold hover:border-mystic-gold transition-all text-sm whitespace-nowrap"
          >
            <ArrowUpDown className="w-4 h-4" />
            Preço
            {sortOrder !== 'none' && (
              <span className="ml-1 text-[10px]">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONSULTANTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mb-12">
        {currentConsultants.map((consultant) => (
          <div 
            key={consultant.id} 
            className="group relative rounded-2xl glass-panel p-6 border border-mystic-purple-light/20 hover:border-mystic-gold/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col cursor-pointer"
            onClick={() => onSelectConsultant && onSelectConsultant(consultant)}
          >
            
            {/* Background Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-mystic-gold/0 to-mystic-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Status & Tag */}
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {consultant.status === 'Online' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    consultant.status === 'Online' ? 'bg-green-500' : 'bg-gray-500'
                  }`}></span>
                </span>
                <span className="text-xs text-mystic-purple-light uppercase tracking-wider">
                  {consultant.status || 'Offline'}
                </span>
              </div>
              {consultant.isPremium && (
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-mystic-gold to-mystic-gold-light text-mystic-black text-[10px] font-bold uppercase tracking-widest shadow-gold-glow">
                  Premium
                </span>
              )}
            </div>

            {/* Avatar */}
            <div className="relative w-24 h-24 mx-auto mb-4 z-10">
              <div className="absolute inset-0 rounded-full border-2 border-mystic-gold animate-[spin_10s_linear_infinite] group-hover:border-dashed" />
              <img 
                src={consultant.photo || 'https://via.placeholder.com/150'} 
                alt={consultant.name} 
                className="w-full h-full object-cover rounded-full p-1 bg-mystic-purple-dark" 
              />
            </div>

            {/* Info */}
            <div className="text-center relative z-10 flex-1">
              <Link
                to={`/consultor/${consultant.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-playfair text-2xl text-white mb-1 group-hover:text-mystic-gold transition-colors line-clamp-2 hover:underline decoration-mystic-gold/40"
              >
                {consultant.name}
              </Link>
              
              <div className="flex items-center justify-center gap-1 mb-3">
                <Star className="w-3.5 h-3.5 fill-mystic-gold text-mystic-gold" />
                <span className="text-sm font-bold text-white">
                  {(consultant.ratingAverage || 5).toFixed(1)}
                </span>
                <span className="text-xs text-mystic-purple-light">
                  ({consultant.baseConsultations || 0})
                </span>
              </div>
              
              {consultant.tagline && (
                <p className="text-xs text-mystic-purple-light mb-4 line-clamp-2">
                  {consultant.tagline}
                </p>
              )}
            </div>

            {/* Pricing Section */}
            <div className="relative z-10 pt-4 border-t border-mystic-purple-light/20 mt-auto">
              <div className="flex flex-col gap-3">
                {/* Destaque: Chamada ao Vivo */}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onChooseService && onChooseService(consultant, 'video')
                }}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold tracking-wide text-sm uppercase hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-shadow"
              >
                Vídeo • R$ {consultant.pricePerMinute.toFixed(2)}/min
              </button>
              
              {/* 3 Perguntas */}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onChooseService && onChooseService(consultant, '3-questions')
                }}
                className="w-full rounded-lg border border-mystic-gold/50 bg-mystic-gold/10 px-2 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-mystic-gold transition-colors hover:bg-mystic-gold/20 sm:text-xs sm:tracking-[0.12em]"
              >
                3 Perguntas • R$ {consultant.priceThreeQuestions.toFixed(0)}
              </button>
              
              {/* 5 Perguntas */}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onChooseService && onChooseService(consultant, '5-questions')
                }}
                className="w-full rounded-lg border border-mystic-gold/50 bg-mystic-gold/10 px-2 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-mystic-gold transition-colors hover:bg-mystic-gold/20 sm:text-xs sm:tracking-[0.12em]"
              >
                5 Perguntas • R$ {consultant.priceFiveQuestions.toFixed(0)}
              </button>
            </div>
          </div>

          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-3 rounded-full border border-mystic-gold/30 text-mystic-purple-light hover:text-mystic-gold hover:border-mystic-gold disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  currentPage === i + 1
                    ? 'bg-gradient-to-r from-mystic-gold to-mystic-gold-light text-mystic-black shadow-gold-glow'
                    : 'border border-mystic-gold/30 text-mystic-purple-light hover:border-mystic-gold'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-3 rounded-full border border-mystic-gold/30 text-mystic-purple-light hover:text-mystic-gold hover:border-mystic-gold disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {currentConsultants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-mystic-purple-light text-lg">Nenhum consultor encontrado com esses filtros.</p>
        </div>
      )}
    </div>
  )
}

export default ConsultantMarketplaceNew
