import React from 'react';
import { Sparkles } from 'lucide-react';

export const SaasFooter: React.FC = () => {
  return (
    <footer className="bg-saas-surface border-t border-saas-border py-14 text-saas-text-dim text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-xl bg-holst-600 flex items-center justify-center text-white font-extrabold shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-black text-saas-text-primary text-base">
                FashionStore<span className="text-holst-600 dark:text-holst-400">.SaaS</span>
              </span>
            </div>
            <p className="text-xs text-saas-text-dim max-w-sm leading-relaxed">
              La plataforma de comercio unificado para marcas y boutiques de moda. Aislamiento físico en PostgreSQL por esquema, punto de venta en mostrador y probador virtual con Inteligencia Artificial.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Todos los servicios operativos • 99.98% uptime</span>
            </div>
          </div>

          {/* Navigation Col 1 */}
          <div>
            <h4 className="font-bold text-saas-text-primary uppercase tracking-wider text-[11px] mb-3">
              Plataforma
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#planes" className="hover:text-holst-600 dark:hover:text-holst-400 transition">
                  Planes & Precios
                </a>
              </li>
              <li>
                <a href="#siempre-incluido" className="hover:text-holst-600 dark:hover:text-holst-400 transition">
                  Beneficios Incluidos
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="hover:text-holst-600 dark:hover:text-holst-400 transition">
                  Punto de Venta (POS)
                </a>
              </li>
              <li>
                <a href="#comparativa" className="hover:text-holst-600 dark:hover:text-holst-400 transition">
                  Comparativa de Planes
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-saas-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-saas-text-dim text-[11px]">
            <span>© 2026 FashionStore Cloud</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
