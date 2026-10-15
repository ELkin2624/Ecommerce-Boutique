import { Component, type ReactNode, type ErrorInfo } from 'react';
import { WifiOff, RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Captura errores en la jerarquía de componentes, incluyendo fallos de carga
 * de módulos dinámicos (lazy import) cuando el usuario navega sin conexión a internet.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error capturado en render:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || '';
      const isChunkLoadError =
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('dynamically imported') ||
        errorMessage.includes('Loading chunk');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground select-none">
          <div className="max-w-md w-full rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl text-center backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
            {/* Icono */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 shadow-inner">
              {isChunkLoadError ? (
                <WifiOff className="h-8 w-8 text-amber-500 animate-pulse" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-destructive" />
              )}
            </div>

            {/* Título */}
            <h2 className="text-xl font-bold tracking-tight">
              {isChunkLoadError
                ? 'Módulo no disponible sin conexión'
                : 'Algo no salió como esperábamos'}
            </h2>

            {/* Descripción */}
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {isChunkLoadError
                ? 'Esta sección del sistema aún no se había descargado en tu equipo antes de activar el modo offline. Reconéctate una vez para guardarla en caché.'
                : 'Ocurrió un error inesperado al renderizar esta vista. Puedes recargar la página o volver a la tienda.'}
            </p>

            {/* Acciones */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-muted/50 hover:bg-muted text-foreground font-semibold text-xs transition-all active:scale-95 cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
