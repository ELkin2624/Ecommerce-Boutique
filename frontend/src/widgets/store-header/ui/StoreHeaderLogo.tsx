import { Link } from 'react-router-dom';
import { BRAND_CONFIG } from '@/shared/config/brand.config';

export function StoreHeaderLogo() {
  return (
    <Link
      to="/"
      className="h-11 w-11 rounded-full bg-card/85 hover:bg-card border border-border/80 backdrop-blur-xl flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95 group shrink-0 overflow-hidden p-1.5"
      title={`${BRAND_CONFIG.name} — Inicio`}
    >
      <img
        src={BRAND_CONFIG.logo.default}
        alt={BRAND_CONFIG.name}
        className="h-full w-full object-contain drop-shadow-xs group-hover:rotate-6 transition-transform duration-300"
        onError={(e) => {
          (e.target as HTMLImageElement).src = BRAND_CONFIG.logo.png;
        }}
      />
    </Link>
  );
}
