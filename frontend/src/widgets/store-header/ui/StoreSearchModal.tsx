import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { useTenantStore } from '@/app/store/tenant.store';
import type { Product } from '@/shared/types/api';

interface StoreSearchModalProps {
  products: Product[];
  onClose: () => void;
}

export function StoreSearchModal({ products, onClose }: StoreSearchModalProps) {
  const { currentTenant } = useTenantStore();
  const storeName = currentTenant?.name || 'Colección Oficial';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSearchResults = products.filter((p) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 px-4">
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl space-y-3 z-50 animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Input Bar */}
        <div className="flex items-center gap-3 p-2 rounded-full border border-border bg-card/95 shadow-2xl backdrop-blur-xl">
          <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 ml-1">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            autoFocus
            placeholder="Buscar por prenda, vestido, camisa, color o marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-2"
          />
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer mr-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resultados Instantáneos */}
        {searchQuery.trim() && (
          <div className="rounded-3xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl max-h-80 overflow-y-auto space-y-2">
            <div className="text-[10px] font-mono text-muted-foreground uppercase px-2 pb-1">
              Resultados encontrados ({filteredSearchResults.length})
            </div>

            {filteredSearchResults.length > 0 ? (
              filteredSearchResults.map((prod) => (
                <Link
                  key={prod.id}
                  to={`/products/${prod.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted text-foreground transition-all group border border-border/30"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">{prod.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {prod.brand || storeName} · {prod.category?.name || 'General'}
                    </p>
                  </div>
                  <div className="h-6 w-8 rounded-full border border-border bg-card flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6 font-mono">
                No se encontraron prendas con "{searchQuery}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
