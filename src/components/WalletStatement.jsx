import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react'

export function WalletStatement({ consultantId, token }) {
  const [movements, setMovements] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasMore: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMovements(1)
  }, [consultantId, token])

  const fetchMovements = async (page) => {
    if (!consultantId || !token) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/wallets/transactions/statement?consultantId=${consultantId}&page=${page}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const data = await response.json()

      if (data.ok) {
        setMovements(data.movements || [])
        setPagination(data.pagination || {})
      } else {
        setError(data.message || 'Erro ao buscar extrato')
      }
    } catch (err) {
      console.error('Erro ao buscar movimentações:', err)
      setError('Falha na conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMovements(newPage)
      window.scrollTo(0, 0)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Entrada':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'Saque':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'Saída':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Entrada':
        return <TrendingUp size={16} />
      case 'Saque':
      case 'Saída':
        return <TrendingDown size={16} />
      default:
        return <DollarSign size={16} />
    }
  }

  const totalIncome = movements
    .filter(m => m.category === 'Entrada')
    .reduce((sum, m) => sum + m.amount, 0)

  const totalWithdrawals = movements
    .filter(m => m.category === 'Saque')
    .reduce((sum, m) => sum + m.amount, 0)

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-mystic-gold/20 bg-green-500/5 p-4">
          <div className="text-xs text-gray-400">Entradas</div>
          <div className="mt-2 text-lg font-semibold text-green-400">
            {formatCurrency(totalIncome)}
          </div>
        </div>
        <div className="rounded-lg border border-mystic-gold/20 bg-blue-500/5 p-4">
          <div className="text-xs text-gray-400">Saques</div>
          <div className="mt-2 text-lg font-semibold text-blue-400">
            {formatCurrency(totalWithdrawals)}
          </div>
        </div>
        <div className="rounded-lg border border-mystic-gold/20 bg-mystic-gold/5 p-4 md:col-span-1">
          <div className="text-xs text-gray-400">Total</div>
          <div className="mt-2 text-lg font-semibold text-mystic-gold">
            {formatCurrency(totalIncome - totalWithdrawals)}
          </div>
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className="rounded-lg border border-mystic-gold/20 bg-black/40 backdrop-blur-sm">
        <div className="border-b border-mystic-gold/10 p-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-mystic-gold">
            <Download size={20} />
            Extrato de Movimentação
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            {pagination.totalItems} movimentação(ões) encontrada(s)
          </p>
        </div>

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin">
              <div className="h-8 w-8 border-2 border-mystic-gold/30 border-t-mystic-gold rounded-full" />
            </div>
          </div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Nenhuma movimentação registrada
          </div>
        ) : (
          <div className="divide-y divide-mystic-gold/10">
            {movements.map((movement) => (
              <div
                key={`${movement.type}-${movement.id}`}
                className="border-b border-mystic-gold/5 p-4 hover:bg-mystic-gold/5 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Ícone e Descrição */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`mt-1 rounded-lg border p-2 ${getCategoryColor(
                        movement.category
                      )}`}
                    >
                      {getCategoryIcon(movement.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-amber-50">
                          {movement.category}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getCategoryColor(
                            movement.category
                          )}`}
                        >
                          {movement.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400 truncate">
                        {movement.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(movement.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="text-right">
                    <div
                      className={`text-lg font-semibold ${
                        movement.category === 'Entrada'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {movement.category === 'Entrada' ? '+' : '-'}
                      {formatCurrency(movement.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-mystic-gold/10 flex items-center justify-between p-4">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/20 px-3 py-2 text-sm font-medium text-amber-50 hover:bg-mystic-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }).map(
                (_, i) => {
                  const startPage = Math.max(
                    1,
                    pagination.currentPage - 2
                  )
                  const pageNum = startPage + i

                  if (pageNum > pagination.totalPages) return null

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === pagination.currentPage
                          ? 'bg-mystic-gold text-black'
                          : 'border border-mystic-gold/20 text-amber-50 hover:bg-mystic-gold/10'
                      } disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  )
                }
              )}
            </div>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasMore || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-mystic-gold/20 px-3 py-2 text-sm font-medium text-amber-50 hover:bg-mystic-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Info de Paginação */}
        <div className="border-t border-mystic-gold/10 px-4 py-2 text-center text-xs text-gray-400">
          Página {pagination.currentPage} de {pagination.totalPages}
        </div>
      </div>
    </div>
  )
}
