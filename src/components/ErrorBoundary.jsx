import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    // Força reload da página para limpar estado inconsistente
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(77,39,122,0.45),rgba(5,0,10,0.98)_58%)] px-6 py-12 text-mystic-gold">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.12),transparent_42%)]" />
          <div className="relative z-10 max-w-md rounded-2xl border border-mystic-gold/40 bg-mystic-purple/40 p-8 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="font-display text-2xl text-mystic-goldSoft">Oops!</h1>
            <p className="mt-2 text-sm text-amber-100/80">
              Encontramos um problema ao carregar esta página. Não se preocupe, vamos resolver isso.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 max-h-48 overflow-auto rounded-lg border border-red-500/40 bg-red-900/20 p-3 text-left text-xs text-red-200">
                <p className="font-bold">Erro: {this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-mystic-gold/90 to-amber-500/85 py-3 font-bold text-black transition hover:brightness-110"
            >
              Voltar ao Início
            </button>

            <button
              onClick={() => window.location.reload()}
              className="mt-2 w-full rounded-lg border border-mystic-gold/30 bg-black/30 py-2 font-medium text-amber-50 transition hover:bg-black/50"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
