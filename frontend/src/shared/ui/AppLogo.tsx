import React, { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { BRAND_CONFIG } from '@/shared/config/brand.config';
import { Sparkles, Store } from 'lucide-react';

export interface AppLogoProps {
  /** Tamaño del logo: 'xs' (24px), 'sm' (36px), 'md' (48px), 'lg' (64px), 'xl' (80px) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Si debe mostrar el texto de la marca junto al logo */
  showText?: boolean;
  /** Orientación de la composición (horizontal o vertical) */
  layout?: 'horizontal' | 'vertical';
  /** Título de marca personalizado */
  title?: string;
  /** Subtítulo descriptivo */
  subtitle?: string;
  /** Clases CSS adicionales para el contenedor principal */
  className?: string;
  /** Clases CSS adicionales para la imagen del logo */
  imageClassName?: string;
  /** Si debe incluir un contenedor con fondo/borde estilizado */
  withContainer?: boolean;
  /** URL de logo personalizado del tenant */
  logoUrl?: string | null;
  /** Color primario de la tienda para monograma o acentos */
  primaryColor?: string;
  /** Forzar monograma cuando no haya logoUrl */
  useMonogram?: boolean;
}

const sizeMap = {
  xs: { img: 'h-6 w-6', text: 'text-xs', sub: 'text-[9px]', box: 'h-8 w-8', font: 'text-[10px]' },
  sm: { img: 'h-8 w-8', text: 'text-sm', sub: 'text-[10px]', box: 'h-10 w-10', font: 'text-xs' },
  md: { img: 'h-10 w-10', text: 'text-base', sub: 'text-xs', box: 'h-12 w-12', font: 'text-sm' },
  lg: { img: 'h-14 w-14', text: 'text-xl', sub: 'text-xs', box: 'h-16 w-16', font: 'text-lg' },
  xl: { img: 'h-20 w-20', text: 'text-2xl', sub: 'text-sm', box: 'h-24 w-24', font: 'text-2xl' },
};

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = false,
  layout = 'horizontal',
  title = BRAND_CONFIG.name,
  subtitle,
  className,
  imageClassName,
  withContainer = false,
  logoUrl,
  primaryColor = '#1D8B94',
  useMonogram = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const dims = sizeMap[size];

  // Calcular iniciales para el monograma
  const initials = title
    ? title
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')
    : 'FS';

  // Si tiene logo personalizado y no dio error, se renderiza la imagen
  const hasCustomLogo = Boolean(logoUrl && !hasError);

  const logoImg = (
    <div
      className={cn(
        'relative flex items-center justify-center shrink-0 transition-transform duration-200 select-none',
        withContainer && [
          dims.box,
          'rounded-2xl bg-white/95 dark:bg-card/95 shadow-sm border border-border/60 p-1.5',
        ],
      )}
    >
      {hasCustomLogo ? (
        <img
          src={logoUrl!}
          alt={title}
          onError={() => setHasError(true)}
          className={cn(
            dims.img,
            'object-contain drop-shadow-sm transition-all duration-300 group-hover:scale-105 rounded-lg',
            imageClassName,
          )}
        />
      ) : useMonogram || (title && title !== BRAND_CONFIG.name) ? (
        // Monograma estilizado de alta gama con el color del comercio
        <div
          className={cn(
            dims.img,
            'rounded-xl text-white font-black tracking-wider flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-105 select-none',
            dims.font,
            imageClassName,
          )}
          style={{
            backgroundColor: primaryColor,
            backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, rgba(0,0,0,0.18) 100%)`,
          }}
          title={title}
        >
          {initials}
        </div>
      ) : hasError ? (
        <div
          className={cn(
            dims.img,
            'rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm',
          )}
        >
          <Sparkles className="h-4 w-4" />
        </div>
      ) : (
        // Fallback a FashionStore SaaS logo
        <img
          src="/logo/logo-fashion.svg"
          alt={title}
          onError={() => setHasError(true)}
          className={cn(
            dims.img,
            'object-contain drop-shadow-sm transition-all duration-300 group-hover:scale-105',
            imageClassName,
          )}
        />
      )}
    </div>
  );

  if (!showText) {
    return <div className={cn('inline-flex items-center', className)}>{logoImg}</div>;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 overflow-hidden group select-none',
        layout === 'vertical' && 'flex-col text-center gap-2',
        className,
      )}
    >
      {logoImg}
      <div className={cn('flex flex-col overflow-hidden', layout === 'vertical' && 'items-center')}>
        <span className={cn('font-bold leading-tight tracking-tight text-foreground truncate', dims.text)}>
          {title}
        </span>
        {subtitle !== undefined ? (
          subtitle ? (
            <span className={cn('text-muted-foreground font-medium truncate', dims.sub)}>
              {subtitle}
            </span>
          ) : null
        ) : (
          <span
            className={cn(
              'text-muted-foreground uppercase font-semibold tracking-wider truncate',
              dims.sub,
            )}
          >
            {BRAND_CONFIG.subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
