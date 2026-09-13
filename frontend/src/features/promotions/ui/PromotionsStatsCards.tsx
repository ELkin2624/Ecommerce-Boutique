import { Sparkles, TrendingDown, Percent } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import type { PromotionStats } from '../model/types';

interface PromotionsStatsCardsProps {
  stats: PromotionStats;
}

export function PromotionsStatsCards({ stats }: PromotionsStatsCardsProps) {
  const { activeCount, maxDiscount, totalCount } = stats;

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      {/* Promociones Activas */}
      <Card className="shadow-xs border-border/80">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Promociones Activas</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{activeCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Mayor Descuento Vigente */}
      <Card className="shadow-xs border-border/80">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Mayor Descuento Vigente</p>
            <p className="text-2xl font-bold mt-1 text-primary">{maxDiscount}% OFF</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <TrendingDown className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Total Campañas Creadas */}
      <Card className="shadow-xs border-border/80">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Total Campañas Creadas</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{totalCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Percent className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
