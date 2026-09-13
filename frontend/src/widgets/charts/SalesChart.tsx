import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Copy, Download, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { toast } from '@/shared/ui/Toast';
import type { ReportResponse } from '@/shared/types/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

interface SalesChartProps {
  report: ReportResponse;
}

export function SalesChart({ report }: SalesChartProps) {
  const [copied, setCopied] = React.useState(false);

  const { summary_text, chart_suggestion, data } = report;
  const meta = report.meta || {
    confidence: report.confidenceScore,
    metric: report.metric,
    groupBy: report.filtersApplied?.groupBy,
    period: report.dateRange?.start_date ? `${report.dateRange.start_date} - ${report.dateRange.end_date || ''}` : undefined,
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary_text || report.executiveSummary || '');
    setCopied(true);
    toast.success('Copiado', 'Resumen analítico copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((fieldName) => JSON.stringify(row[fieldName] ?? '')).join(','),
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Exportado', 'El archivo se ha descargado exitosamente');
  };

  // Determinar claves numéricas y categóricas para Recharts
  const keys = data && data.length > 0 ? Object.keys(data[0]) : [];
  const categoryKey =
    keys.find((k) => typeof data[0][k] === 'string') || keys[0] || 'name';
  const numericKey =
    keys.find((k) => typeof data[0][k] === 'number') || keys[1] || 'value';

  const isLowConfidence = meta?.confidence !== undefined && meta.confidence < 0.7;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Resumen Analítico Generado por IA */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/10 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-primary font-bold">
              Resumen Analítico (IA Generativa)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleCopySummary}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleExportCsv}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exportar CSV</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium leading-relaxed text-foreground/90">
            {summary_text}
          </p>

          {isLowConfidence && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-md border border-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                La consulta tiene un umbral de confianza moderado ({Math.round(meta!.confidence! * 100)}%). Si los resultados no son los esperados, intente especificar la sucursal o el rango de fechas.
              </span>
            </div>
          )}

          {meta && (
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground font-mono">
              {meta.metric && <span className="bg-muted px-2 py-0.5 rounded">Métrica: {meta.metric}</span>}
              {meta.groupBy && <span className="bg-muted px-2 py-0.5 rounded">Agrupado por: {meta.groupBy}</span>}
              {meta.period && <span className="bg-muted px-2 py-0.5 rounded">Período: {meta.period}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico Dinámico */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Visualización de Datos ({chart_suggestion})
          </CardTitle>
          <CardDescription className="text-xs">
            Renderizado automático según la sugerencia analítica estructurada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No se encontraron registros para graficar.
            </div>
          ) : chart_suggestion === 'PIE_CHART' ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey={numericKey}
                    nameKey={categoryKey}
                    label={(entry: any) => `${entry?.[categoryKey] ?? ''}: ${entry?.[numericKey] ?? ''}`}
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : chart_suggestion === 'LINE_CHART' ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey={categoryKey} angle={-25} textAnchor="end" height={50} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={numericKey} stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : chart_suggestion === 'AREA_CHART' ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey={categoryKey} angle={-25} textAnchor="end" height={50} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey={numericKey} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Default: BAR_CHART */
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey={categoryKey} angle={-20} textAnchor="end" height={50} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={numericKey} fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {data.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla Complementaria de Datos */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Datos Tabulares Detallados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {keys.map((k) => (
                  <TableHead key={k} className="capitalize text-xs">
                    {k}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  {keys.map((k) => (
                    <TableCell key={k} className="text-xs">
                      {typeof row[k] === 'number'
                        ? k.toLowerCase().includes('total') || k.toLowerCase().includes('monto') || k.toLowerCase().includes('revenue')
                          ? `$ ${row[k].toFixed(2)}`
                          : row[k]
                        : String(row[k] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
