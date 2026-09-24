import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  Mic,
  Layers,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { useUiStore } from '@/app/store/ui.store';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

interface EmbedConfig {
  token: string;
  embedUrl: string;
  expiresAt: string;
  dataSourceId: string;
}

export function ReportsPage() {
  const { theme } = useUiStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. Obtener Token y Configuración Embebible desde el Backend de Fashion Store
  const fetchEmbedConfig = useCallback(async () => {
    setLoadingConfig(true);
    setIframeLoaded(false);
    setError(null);

    try {
      const response = await apiClient.get<EmbedConfig>('/reports/embed-config');
      setConfig(response.data);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo conectar con el motor de Reportes ReportIQ.';
      setError(errorMsg);
      toast.error('Error al inicializar ReportIQ', errorMsg);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchEmbedConfig();
  }, [fetchEmbedConfig]);

  // 2. Sincronizar Tema en tiempo real con el iframe mediante postMessage
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_THEME', theme },
        '*'
      );
    }
  }, [theme]);

  // 3. Escuchar Eventos del Iframe (Ej: Reportes generados, errores, etc.)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REPORTIQ_REPORT_GENERATED') {
        const rowCount = event.data?.payload?.rowCount ?? 0;
        toast.success(
          'Reporte Analítico Generado',
          `Se estructuraron ${rowCount} registros a partir de su consulta.`
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Construir la URL del iframe con token y tema actual
  const iframeSrc = config
    ? `${config.embedUrl}${config.embedUrl.includes('?') ? '&' : '?'}theme=${theme}`
    : '';

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4 flex flex-col' : ''}`}>
      {/* Barra de Encabezado Superior y Métricas de Conexión */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Reportes & Analítica IA
            </h1>
            <Badge variant="outline" className="gap-1.5 text-xs font-semibold py-0.5 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Conexión Segura Multitenant</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Genera reportes por voz (Whisper) o texto en lenguaje natural, y crea consultas complejas en el editor visual QBE.
          </p>
        </div>

        {/* Acciones de Control */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Badges de Capacidades */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium">
              <Mic className="w-3 h-3 text-indigo-500" /> Voz
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium">
              <Layers className="w-3 h-3 text-cyan-500" /> QBE
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium">
              <BarChart3 className="w-3 h-3 text-amber-500" /> Gráficos
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmbedConfig}
            disabled={loadingConfig}
            className="h-8 gap-1.5 text-xs"
            title="Recargar Módulo de Reportes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingConfig ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Recargar</span>
          </Button>

          {config && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(iframeSrc, '_blank')}
              className="h-8 gap-1.5 text-xs"
              title="Abrir en pestaña independiente"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant={isFullscreen ? 'default' : 'outline'}
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 gap-1.5 text-xs"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restaurar</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Maximizar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Contenedor Principal del Módulo Embebido */}
      <div
        className={`relative w-full rounded-2xl border border-border bg-card shadow-md overflow-hidden transition-all ${
          isFullscreen ? 'flex-1 min-h-0' : 'h-[calc(100vh-140px)] min-h-[680px]'
        }`}
      >
        {/* Estado: Cargando Configuración Inicial */}
        {loadingConfig && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm p-6 text-center space-y-3">
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Iniciando Módulo ReportIQ
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Autenticando tenant y sincronizando esquemas de datos...
              </p>
            </div>
          </div>
        )}

        {/* Estado: Error de Conexión */}
        {error && !loadingConfig && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card p-6 text-center space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-semibold text-foreground">
                No se pudo cargar el módulo de reportes
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {error}
              </p>
            </div>
            <Button onClick={fetchEmbedConfig} size="sm" className="gap-2 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar Conexión
            </Button>
          </div>
        )}

        {/* Iframe Embebido de ReportIQ */}
        {config && (
          <div className="relative w-full h-full">
            {/* Loader mientras el iframe procesa su primer render */}
            {!iframeLoaded && !error && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/80 backdrop-blur-xs space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  Cargando interfaz analítica...
                </span>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={iframeSrc}
              title="ReportIQ AI Analytics"
              onLoad={() => setIframeLoaded(true)}
              allow="microphone; clipboard-write; display-capture"
              className="w-full h-full border-none bg-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
}
