import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Store, Database, TrendingUp, Cpu, ShoppingBag,
  Zap, CheckCircle2, Lock,
} from 'lucide-react';
import { useTenantStore } from '@/app/store/tenant.store';

interface SaasHeroProps {
  onOpenRegister: (planId?: string) => void;
}

export const SaasHero: React.FC<SaasHeroProps> = ({ onOpenRegister }) => {
  const navigate = useNavigate();
  const { currentTenant, availableTenants } = useTenantStore();

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28 bg-saas-bg transition-colors duration-200">
      {/* Decorative Radial Ambient Glows using Holst Teal Tones */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] bg-gradient-to-b from-holst-400/15 via-holst-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -top-24 left-1/4 w-80 h-80 bg-holst-200/20 dark:bg-holst-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -top-20 right-1/4 w-96 h-96 bg-holst-600/10 dark:bg-holst-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Main Headline (Shopify Pricing Inspiration) */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-saas-text-primary leading-[1.12]">
            Encuentra el plan perfecto para{' '}
            <span className="bg-gradient-to-r from-holst-600 via-holst-400 to-holst-800 bg-clip-text text-transparent">
              escalar tu boutique
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-saas-text-dim leading-relaxed font-normal">
            Comercio unificado para marcas de moda: <strong className="text-saas-text-primary font-bold">E-Commerce</strong> de alta conversión, <strong className="text-saas-text-primary font-bold">Punto de Venta POS</strong> en mostrador, <strong className="text-saas-text-primary font-bold">Probador Físico Inteligente</strong> y <strong className="text-saas-text-primary font-bold">Probador Virtual con IA</strong>. Cada tienda blindada en su propio esquema de PostgreSQL.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenRegister('PRO')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-holst-600 hover:bg-holst-800 text-white font-extrabold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-holst-600/30 hover:shadow-holst-600/45 transition-all transform hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>Crear mi Tienda Gratis (14 Días)</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/store')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-saas-surface hover:bg-saas-surface-hover text-saas-text-primary font-bold text-base px-7 py-3.5 rounded-xl border border-saas-border hover:border-holst-600/60 shadow-sm transition-all"
            >
              <Store className="w-5 h-5 text-holst-600 dark:text-holst-400" />
              <span>Ver Tienda Demo ({currentTenant?.name || 'Boutique Elegance'})</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs text-saas-text-dim font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Aislamiento 100% por Esquema PostgreSQL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-holst-600 dark:text-holst-400" />
              <span>14 días de prueba gratis • Sin tarjeta requerida</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-holst-600 dark:text-holst-400" />
              <span>Aprovisionamiento automático en 10 segundos</span>
            </div>
          </div>
        </div>

        {/* Interactive Platform Mockup Showcase */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          <div className="rounded-2xl border border-saas-border bg-saas-surface shadow-2xl overflow-hidden backdrop-blur-xl transition-colors duration-200">
            {/* Mockup Header Bar */}
            <div className="bg-saas-bg-subtle px-4 py-3 border-b border-saas-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <div className="ml-3 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-saas-surface border border-saas-border text-xs font-mono text-saas-text-dim">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>https://{currentTenant?.slug || 'boutique-elegance'}.fashionstore.app/admin</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-holst-600 dark:text-holst-400 bg-holst-50 dark:bg-holst-900 px-2 py-0.5 rounded border border-holst-200 dark:border-holst-600/40">
                  SCHEMA: tenant_{currentTenant?.slug.replace(/-/g, '_') || 'boutique_elegance'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ESTADO: ACTIVO
                </span>
              </div>
            </div>

            {/* Mockup Content Grid */}
            <div className="p-6 sm:p-8 bg-saas-bg-canvas/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Card 1 */}
                <div className="p-5 rounded-xl border border-saas-border bg-saas-surface shadow-sm">
                  <div className="flex items-center justify-between text-xs text-saas-text-dim font-medium">
                    <span>Ventas Omnicanal (Hoy)</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-saas-text-primary">$4,850.00</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>+24.8% vs. semana anterior</span>
                  </div>
                  <div className="mt-3 text-[11px] text-saas-text-dim border-t border-saas-border pt-2 flex justify-between">
                    <span>Web: $3,120</span>
                    <span>POS Mostrador: $1,730</span>
                  </div>
                </div>

                {/* Metric Card 2 */}
                <div className="p-5 rounded-xl border border-saas-border bg-saas-surface shadow-sm">
                  <div className="flex items-center justify-between text-xs text-saas-text-dim font-medium">
                    <span>Probador Virtual & IA</span>
                    <Cpu className="w-4 h-4 text-holst-600 dark:text-holst-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-saas-text-primary">184 Fittings</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-holst-600 dark:text-holst-400 font-semibold">
                    <span>72% conversión a compra</span>
                  </div>
                  <div className="mt-3 text-[11px] text-saas-text-dim border-t border-saas-border pt-2 flex justify-between">
                    <span>Talla estimada con IA</span>
                    <span>Sin devoluciones</span>
                  </div>
                </div>

                {/* Metric Card 3 */}
                <div className="p-5 rounded-xl border border-saas-border bg-saas-surface shadow-sm">
                  <div className="flex items-center justify-between text-xs text-saas-text-dim font-medium">
                    <span>Inventario Centralizado</span>
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-saas-text-primary">3 Sucursales</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>100% Stock Sincronizado</span>
                  </div>
                  <div className="mt-3 text-[11px] text-saas-text-dim border-t border-saas-border pt-2 flex justify-between">
                    <span>Central: 850 u.</span>
                    <span>Norte: 410 u.</span>
                  </div>
                </div>
              </div>

              {/* Live Stores Carousel Footer in Mockup */}
              <div className="mt-6 pt-5 border-t border-saas-border flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-saas-text-secondary">Tiendas activas en el SaaS:</span>
                  <div className="flex -space-x-2">
                    {availableTenants.map((t) => (
                      <div
                        key={t.id}
                        title={t.name}
                        className="w-7 h-7 rounded-full bg-holst-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-saas-surface"
                      >
                        {t.name.substring(0, 1)}
                      </div>
                    ))}
                  </div>
                  <span className="text-saas-text-dim font-mono">
                    ({availableTenants.length} esquemas aislados en PostgreSQL)
                  </span>
                </div>

                <button
                  onClick={() => onOpenRegister('PRO')}
                  className="text-xs font-bold text-holst-600 dark:text-holst-400 hover:text-holst-800 dark:hover:text-holst-200 flex items-center gap-1 transition"
                >
                  <span>Añadir una nueva tienda ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
