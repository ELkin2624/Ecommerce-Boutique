import { Link } from 'react-router-dom';
import { useTenantStore } from '@/app/store/tenant.store';
import { BRAND_CONFIG } from '@/shared/config/brand.config';
import { Store } from 'lucide-react';

export function StoreHeaderLogo() {
  const { currentTenant } = useTenantStore();
  const name = currentTenant?.name || BRAND_CONFIG.name;

  return (
    <Link
      to="/store"
      className="flex items-center gap-2.5 group shrink-0"
      title={`${name} — Tienda Oficial`}
    >
      <div
        className="h-10 w-10 rounded-2xl text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform p-1.5 font-bold"
        style={{ backgroundColor: currentTenant?.primaryColor || '#ec4899' }}
      >
        <Store className="w-5 h-5 text-white" />
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="font-extrabold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
          {name}
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tienda Oficial • Plan {currentTenant?.plan || 'PRO'}
        </span>
      </div>
    </Link>
  );
}
