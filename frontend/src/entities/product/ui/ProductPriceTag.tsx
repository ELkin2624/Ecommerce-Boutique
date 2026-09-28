import { formatPrice } from '../model/types';

interface ProductPriceTagProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ProductPriceTag({
  price,
  originalPrice,
  size = 'md',
  className = '',
}: ProductPriceTagProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
    xl: 'text-xl font-bold',
  };

  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className={`text-foreground ${sizeClasses[size]}`}>
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <span className="text-xs text-muted-foreground line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  );
}
