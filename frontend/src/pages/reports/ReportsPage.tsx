import { useState, useEffect } from 'react';
import { Sparkles, History, Bot } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import type { ReportResponse } from '@/shared/types/api';
import { VoiceQueryInput, type ReportProcessingState } from '@/features/reports/ui/VoiceQueryInput';
import { SalesChart } from '@/widgets/charts/SalesChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { toast } from '@/shared/ui/Toast';

const STORAGE_KEY = 'fashionstore_report_history';

export function ReportsPage() {
  const [status, setStatus] = useState<ReportProcessingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<ReportResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Ignorar errores de storage
    }
  }, []);

  const saveToHistory = (queryText: string) => {
    setHistory((prev) => {
      const updated = [queryText, ...prev.filter((q) => q !== queryText)].slice(0, 8);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar
      }
      return updated;
    });
  };

  const handleQuery = async (queryText: string) => {
    setStatus('querying');
    setErrorMessage(null);

    try {
      // Envía la consulta en lenguaje natural a NestJS (/reports/query)
      // NestJS se comunica con FastAPI para interpretar la consulta y ejecuta Prisma de forma segura
      const response = await apiClient.post('/reports/query', {
        queryText,
      });

      const reportData: ReportResponse = response.data;
      setStatus('rendering');
      setCurrentReport(reportData);
      saveToHistory(queryText);
      toast.success('Reporte Generado', 'La consulta fue interpretada con éxito por la IA');
    } catch (err: any) {
      setStatus('error');
      const msg = err.message || 'No se pudo generar el reporte. Intente reformular su consulta.';
      setErrorMessage(msg);
      toast.error('Error al generar reporte', msg);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Reportes Inteligentes (IA)</h1>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Bot className="h-3.5 w-3.5 text-purple-600" />
            <span>FastAPI + NestJS Pipeline</span>
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Realice consultas de ventas, catálogo o inventario por voz o texto en lenguaje natural.
        </p>
      </div>

      {/* Voice & Text Query Panel */}
      <Card className="shadow-md border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Asistente Analítico de Negocios</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Hable por micrófono o escriba su pregunta. El modelo estructurará los datos y sugerirá el gráfico óptimo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceQueryInput
            onSearch={handleQuery}
            status={status}
            errorMessage={errorMessage}
          />
        </CardContent>
      </Card>

      {/* Query History */}
      {history.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-muted-foreground">
          <History className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold shrink-0">Recientes:</span>
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => handleQuery(h)}
              className="px-2.5 py-1 rounded bg-muted/50 hover:bg-muted border text-foreground/80 hover:text-foreground text-[11px] truncate max-w-xs transition-colors shrink-0"
              title={h}
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Render Report Results */}
      {currentReport && <SalesChart report={currentReport} />}
    </div>
  );
}
