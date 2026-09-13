import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/Badge';

export interface SubNavigationItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';
}

interface SubNavigationProps {
  items: SubNavigationItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pills' | 'underline';
}

export function SubNavigation({
  items,
  activeId,
  onChange,
  className,
  variant = 'pills',
}: SubNavigationProps) {
  if (variant === 'underline') {
    return (
      <div className={cn('border-b border-border flex space-x-6 overflow-x-auto no-scrollbar', className)}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                'flex items-center gap-2 py-3 px-1 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{item.label}</span>
              {typeof item.count === 'number' && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none',
                    isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: 'pills' (Segmented Control / modern chips)
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 border border-border/80 rounded-xl overflow-x-auto max-w-full no-scrollbar shadow-inner',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap focus:outline-none',
              isActive
                ? 'bg-background text-foreground font-semibold shadow-sm border border-border/50 dark:bg-slate-900'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'h-3.5 w-3.5 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            )}
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <Badge
                variant={isActive ? (item.badgeVariant || 'default') : 'outline'}
                className={cn(
                  'text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-bold',
                  !isActive && 'text-muted-foreground border-muted-foreground/30',
                )}
              >
                {item.count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
