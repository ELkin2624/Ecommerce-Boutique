import { Link } from 'react-router-dom';
import { useTenantStore } from '@/app/store/tenant.store';
import { BRAND_CONFIG } from '@/shared/config/brand.config';
import { AppLogo } from '@/shared/ui/AppLogo';

export function StoreHeaderLogo() {
  const { currentTenant } = useTenantStore();
  const name = currentTenant?.name || BRAND_CONFIG.name;
  const storeUrl = currentTenant?.slug ? `/store?tenant=${currentTenant.slug}` : '/store';

  return (
    <Link
      to={storeUrl}
      className="flex items-center gap-2.5 group shrink-0 select-none"
      title={`${name} — Tienda Oficial`}
    >
      <AppLogo
        size="sm"
        showText={false}
        title={name}
        logoUrl={currentTenant?.logoUrl}
        primaryColor={currentTenant?.primaryColor || '#1D8B94'}
        useMonogram={true}
        withContainer={true}
      />
      <div className="hidden sm:flex flex-col">
        <span className="font-extrabold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors truncate max-w-[180px]">
          {name}
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tienda Oficial • {currentTenant?.category || `Plan ${currentTenant?.plan || 'PRO'}`}
        </span>
      </div>
    </Link>
  );
}
