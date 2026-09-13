import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Clock, Sparkles, ArrowRight, RotateCcw,
} from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/shared/lib/utils';

export interface DateRangePickerProps {
  startDate: string; // Formato 'YYYY-MM-DD'
  endDate: string; // Formato 'YYYY-MM-DD'
  onChange: (startDate: string, endDate: string) => void;
  className?: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/* Formatea 'YYYY-MM-DD' de forma segura sin desfasajes de zona horaria UTC */
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'Sin seleccionar';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString('es-BO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Convierte un objeto Date a string 'YYYY-MM-DD'
 */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
}: DateRangePickerProps) {
  // Estado para el mes visual del calendario
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    if (startDate) {
      const parts = startDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date();
  });

  const [selectingStep, setSelectingStep] = useState<'start' | 'end'>('start');

  const currentYear = currentMonthDate.getFullYear();
  const currentMonthIndex = currentMonthDate.getMonth();

  // Cálculo de días de vigencia
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const [y1, m1, d1] = startDate.split('-').map(Number);
    const [y2, m2, d2] = endDate.split('-').map(Number);
    const startMs = new Date(y1, m1 - 1, d1).getTime();
    const endMs = new Date(y2, m2 - 1, d2).getTime();
    const diff = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1); // Contar días inclusivos
  }, [startDate, endDate]);

  // Generador de la cuadrícula mensual
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonthIndex + 1, 0);

    const totalDays = lastDayOfMonth.getDate();
    // Ajustar para que la semana empiece en Lunes (0=Lu ... 6=Do)
    const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = toDateString(new Date());

    // Días del mes anterior para rellenar
    const prevMonthLastDay = new Date(currentYear, currentMonthIndex, 0).getDate();
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonthIndex - 1, d);
      days.push({
        dateStr: toDateString(prevDate),
        dayNumber: d,
        isCurrentMonth: false,
        isToday: toDateString(prevDate) === todayStr,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(currentYear, currentMonthIndex, d);
      const str = toDateString(curDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Días del mes siguiente para completar 35 o 42 celdas
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonthIndex + 1, d);
      days.push({
        dateStr: toDateString(nextDate),
        dayNumber: d,
        isCurrentMonth: false,
        isToday: toDateString(nextDate) === todayStr,
      });
    }

    return days;
  }, [currentYear, currentMonthIndex]);

  // Navegación de mes
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Clic en un día del calendario
  const handleDayClick = (dateStr: string) => {
    if (selectingStep === 'start') {
      onChange(dateStr, dateStr > endDate ? dateStr : endDate);
      setSelectingStep('end');
    } else {
      if (dateStr < startDate) {
        onChange(dateStr, startDate);
      } else {
        onChange(startDate, dateStr);
      }
      setSelectingStep('start');
    }
  };

  // Presets rápidos de fechas
  const applyPreset = (daysCount: number) => {
    const start = new Date();
    const end = new Date(Date.now() + (daysCount - 1) * 24 * 60 * 60 * 1000);
    const startStr = toDateString(start);
    const endStr = toDateString(end);
    onChange(startStr, endStr);
    setCurrentMonthDate(new Date(start.getFullYear(), start.getMonth(), 1));
  };

  const applyWeekendPreset = () => {
    const today = new Date();
    const day = today.getDay(); // 0 Dom, 5 Vie, 6 Sab
    const daysUntilFriday = (5 - day + 7) % 7;
    const friday = new Date(today);
    friday.setDate(today.getDate() + (daysUntilFriday === 0 ? 0 : daysUntilFriday));

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);

    const startStr = toDateString(friday);
    const endStr = toDateString(sunday);
    onChange(startStr, endStr);
    setCurrentMonthDate(new Date(friday.getFullYear(), friday.getMonth(), 1));
  };

  const applyEndOfMonthPreset = () => {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startStr = toDateString(today);
    const endStr = toDateString(endOfMonth);
    onChange(startStr, endStr);
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
    <div className={cn('space-y-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs', className)}>
      {/* 1. Barra de Resumen Visual de Fechas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground">Vigencia de la Promoción</span>
            <p className="text-[10px] text-muted-foreground">
              Define el período en el cual este cupón o descuento estará activo
            </p>
          </div>
        </div>

        <Badge
          variant="secondary"
          className="self-start sm:self-auto gap-1 text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
        >
          <Clock className="h-3 w-3" />
          <span>{durationDays} {durationDays === 1 ? 'día activo' : 'días activos'}</span>
        </Badge>
      </div>

      {/* 2. Tarjetas de Rango Inicio → Fin */}
      <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2 rounded-xl border border-border/50">
        <div
          onClick={() => setSelectingStep('start')}
          className={cn(
            'p-2 rounded-lg border transition-all cursor-pointer text-left',
            selectingStep === 'start'
              ? 'bg-background border-primary shadow-xs ring-1 ring-primary/30'
              : 'bg-background/60 border-transparent hover:bg-background'
          )}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Fecha Inicio
          </span>
          <span className="text-xs font-bold text-foreground capitalize block truncate mt-0.5">
            {formatDisplayDate(startDate)}
          </span>
        </div>

        <div
          onClick={() => setSelectingStep('end')}
          className={cn(
            'p-2 rounded-lg border transition-all cursor-pointer text-left',
            selectingStep === 'end'
              ? 'bg-background border-primary shadow-xs ring-1 ring-primary/30'
              : 'bg-background/60 border-transparent hover:bg-background'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fecha Cierre
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
          </div>
          <span className="text-xs font-bold text-foreground capitalize block truncate mt-0.5">
            {formatDisplayDate(endDate)}
          </span>
        </div>
      </div>

      {/* 3. Atajos Rápidos (Presets) */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Atajos de campaña recomendados:</span>
        </span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={applyWeekendPreset}
            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
          >
            Fin de semana (Vie-Dom)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(7)}
            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
          >
            1 Semana (7d)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(15)}
            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
          >
            Quincena (15d)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(30)}
            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
          >
            1 Mes (30d)
          </button>
          <button
            type="button"
            onClick={applyEndOfMonthPreset}
            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
          >
            Hasta Fin de Mes
          </button>
          <button
            type="button"
            onClick={() => applyPreset(90)}
            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
          >
            Temporada (90d)
          </button>
        </div>
      </div>

      {/* 4. Calendario Visual Mensual */}
      <div className="p-2.5 rounded-xl border bg-background/80 space-y-2">
        {/* Cabecera del Mes y Flechas */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-foreground">
            {MONTH_NAMES[currentMonthIndex]} {currentYear}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonthDate(new Date())}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Mes actual"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nombres de Días de la Semana */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_NAMES.map((name, idx) => (
            <span
              key={name}
              className={cn(
                'text-[10px] font-semibold py-0.5',
                idx >= 5 ? 'text-primary/70' : 'text-muted-foreground'
              )}
            >
              {name}
            </span>
          ))}
        </div>

        {/* Días del Mes */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
          {calendarGrid.map((day) => {
            const isStart = day.dateStr === startDate;
            const isEnd = day.dateStr === endDate;
            const isBetween = day.dateStr > startDate && day.dateStr < endDate;

            const isSelected = isStart || isEnd;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => handleDayClick(day.dateStr)}
                className={cn(
                  'relative h-7 w-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center rounded-md',
                  !day.isCurrentMonth && 'text-muted-foreground/30 hover:text-muted-foreground/60',
                  day.isCurrentMonth && !isSelected && !isBetween && 'text-foreground hover:bg-muted',
                  isBetween && 'bg-primary/15 text-primary font-semibold rounded-none',
                  isStart && 'bg-primary text-primary-foreground font-bold shadow-xs rounded-l-md rounded-r-none z-10',
                  isEnd && 'bg-primary text-primary-foreground font-bold shadow-xs rounded-r-md rounded-l-none z-10',
                  isStart && isEnd && 'rounded-md',
                  day.isToday && !isSelected && 'ring-1 ring-primary/50 font-bold'
                )}
              >
                <span>{day.dayNumber}</span>
                {day.isToday && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Inputs nativos accesibles como fallback secundario sincronizado */}
      <div className="pt-1 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>O ajusta las fechas con selector estándar:</span>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange(e.target.value, e.target.value > endDate ? e.target.value : endDate)}
            className="text-[11px] px-2 py-0.5 rounded border border-border bg-background text-foreground"
          />
          <span>a</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => onChange(startDate, e.target.value)}
            className="text-[11px] px-2 py-0.5 rounded border border-border bg-background text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
