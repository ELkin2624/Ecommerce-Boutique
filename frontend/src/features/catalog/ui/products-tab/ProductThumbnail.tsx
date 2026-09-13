import { useState } from 'react';
import { Shirt } from 'lucide-react';

interface ProductThumbnailProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ProductThumbnail({
  src,
  alt,
  size = 'md',
  className = '',
}: ProductThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9 min-w-[36px] rounded-lg',
    md: 'w-12 h-12 min-w-[48px] rounded-xl',
    lg: 'w-16 h-16 min-w-[64px] rounded-xl',
    xl: 'w-24 h-24 min-w-[96px] rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  };

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted border border-border/60 text-muted-foreground/60 shadow-inner ${sizeClasses[size]} ${className}`}
        title={alt}
      >
        <Shirt className={iconSizes[size]} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-muted/40 border border-border/80 shadow-sm group ${sizeClasses[size]} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}
