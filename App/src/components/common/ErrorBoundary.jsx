import { Component } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-100 dark:border-red-950/60 shadow-xl rounded-3xl p-7 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 mx-auto flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                Ops! Ocorreu um erro nesta página
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Detectamos uma inconsistência temporária de carregamento. Você pode recarregar a página ou voltar para a página inicial com segurança.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl text-[11px] text-red-700 dark:text-red-300 text-left overflow-x-auto font-mono">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw size={14} /> Recarregar
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Home size={14} /> Página Inicial
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
