import React, { useState } from 'react';
import {
  Check, Sparkles, ArrowRight, ShieldCheck, Store, Crown,
} from 'lucide-react';

interface SaasPricingProps {
  onSelectPlan: (planId: string) => void;
}

export const SaasPricing: React.FC<SaasPricingProps> = ({ onSelectPlan }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      id: 'STARTER',
      name: 'Starter Boutique',
      tagline: 'Ideal para boutiques emergentes y tiendas de moda independientes',
      monthlyPrice: 29,
      annualPrice: 23,
      popular: false,
      badge: null,
      icon: Store,
      features: [
        '1 Tienda online con catálogo completo',
        '1 Esquema PostgreSQL dedicado e independiente',
        'Punto de Venta POS en mostrador (1 terminal)',
        'Modo Offline para POS con sincronización',
        'Hasta 500 prendas y variantes',
        'Cobro con Stripe, Tarjetas y QR Simple',
        'Subdominio seguro (mitienda.fashionstore.app)',
        'Soporte estándar por email en 24h',
      ],
      ctaText: 'Comenzar con Starter',
      ctaStyle:
        'bg-saas-surface hover:bg-saas-surface-hover text-saas-text-primary border border-saas-border hover:border-holst-600/60 shadow-sm',
    },
    {
      id: 'PRO',
      name: 'Pro Omnicanal',
      tagline: 'Para boutiques en expansión con tienda física, catálogo amplio y sucursales',
      monthlyPrice: 79,
      annualPrice: 63,
      popular: true,
      badge: 'MÁS ELEGIDO',
      icon: Sparkles,
      features: [
        'Todo lo de Starter, más:',
        'Hasta 5 Sucursales y Almacenes sincronizados',
        'POS Pro con arqueo de caja y control de turnos',
        'Probador Físico Inteligente (Reserva web)',
        'Probador Virtual e IA Estilista de tallas',
        'Prendas y variantes ilimitadas',
        'Kardex y transferencias de stock entre tiendas',
        'Perfiles de cajeros, supervisores y administradores',
        'Soporte prioritario 24/7 por WhatsApp & Chat',
      ],
      ctaText: 'Comenzar Prueba Gratis (14 Días)',
      ctaStyle:
        'bg-holst-600 hover:bg-holst-800 text-white shadow-lg shadow-holst-600/35 hover:shadow-holst-600/50',
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise Franquicias',
      tagline: 'Para cadenas departamentales, marcas de moda mayoristas y franquicias',
      monthlyPrice: 199,
      annualPrice: 159,
      popular: false,
      badge: 'MÁXIMA ESCALA',
      icon: Crown,
      features: [
        'Todo lo de Pro, más:',
        'Sucursales y Depósitos centrales ilimitados',
        'Dominio 100% personalizado (ej. tu-marca.com)',
        'IA Generativa: Remoción de fondos de prendas',
        'Reportes Inteligentes por Voz (Whisper IA)',
        'Pool dedicado de conexiones PostgreSQL',
        'Acceso completo a API REST & Webhooks para ERP',
        'SLA del 99.99% y copias de seguridad automáticas',
        'Gerente de cuenta y migración asistida gratuita',
      ],
      ctaText: 'Comenzar con Enterprise',
      ctaStyle:
        'bg-saas-surface hover:bg-saas-surface-hover text-saas-text-primary border border-saas-border hover:border-holst-600/60 shadow-sm',
    },
  ];

  return (
    <section id="planes" className="py-20 lg:py-28 bg-saas-bg-subtle transition-colors duration-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header (Shopify Layout) */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-saas-text-primary">
            Planes diseñados para cada etapa de tu negocio
          </h2>

          <p className="mt-4 text-base sm:text-lg text-saas-text-dim">
            Prueba cualquier plan gratis durante 14 días. Puedes cambiar o cancelar tu suscripción en cualquier momento.
          </p>

          {/* Billing Cycle Switcher (Monthly vs Annual - Shopify Style) */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-saas-surface border border-saas-border shadow-sm">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                !isAnnual
                  ? 'bg-holst-600 text-white shadow-md'
                  : 'text-saas-text-secondary hover:text-saas-text-primary'
              }`}
            >
              Facturación Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isAnnual
                  ? 'bg-holst-600 text-white shadow-md'
                  : 'text-saas-text-secondary hover:text-saas-text-primary'
              }`}
            >
              <span>Facturación Anual</span>
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm animate-pulse">
                Ahorra 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3-Column Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 ${
                  plan.popular
                    ? 'bg-saas-surface border-2 border-holst-600 dark:border-holst-400 shadow-2xl scale-100 lg:-translate-y-2 ring-4 ring-holst-600/10'
                    : 'bg-saas-surface border border-saas-border shadow-md hover:shadow-xl hover:border-holst-600/40'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-holst-600 to-holst-400 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                    ★ {plan.badge} ★
                  </div>
                )}

                <div>
                  {/* Plan Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-holst-50 dark:bg-holst-900 border border-holst-200 dark:border-holst-600/40 text-holst-600 dark:text-holst-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    {!plan.popular && plan.badge && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-saas-bg-subtle text-saas-text-dim border border-saas-border">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-saas-text-primary tracking-tight">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-saas-text-dim min-h-[40px] leading-relaxed">
                    {plan.tagline}
                  </p>

                  {/* Pricing Display */}
                  <div className="mt-6 pt-6 border-t border-saas-border">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight text-saas-text-primary">
                        ${price}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-saas-text-dim">
                        USD / mes
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-saas-text-dim">
                      {isAnnual ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Facturado anualmente ($
                          {price * 12}/año) • 2 meses gratis
                        </span>
                      ) : (
                        <span>Facturado mes a mes</span>
                      )}
                    </div>
                  </div>

                  {/* Guarantee Line */}
                  <div className="mt-3 py-1.5 px-3 rounded-lg bg-saas-bg-canvas/50 border border-saas-border text-[11px] font-medium text-saas-text-secondary flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Prueba gratis de 14 días • Sin tarjeta requerida</span>
                  </div>

                  {/* Plan Features Checklist */}
                  <div className="mt-8">
                    <div className="text-xs font-bold uppercase tracking-wider text-saas-text-secondary mb-4">
                      ¿Qué incluye este plan?
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-saas-text-secondary">
                          <div className="mt-0.5 p-0.5 rounded-full bg-holst-50 dark:bg-holst-900 border border-holst-200 dark:border-holst-600/40 text-holst-600 dark:text-holst-400 flex-shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <div className="mt-8 pt-6 border-t border-saas-border">
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 ${plan.ctaStyle}`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="mt-2 text-[11px] text-center text-saas-text-dim">
                    Configuración guiada en menos de 2 minutos
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compare All Features Link to scroll to detailed table */}
        <div className="mt-14 text-center">
          <a
            href="#comparativa"
            className="inline-flex items-center gap-2 text-sm font-bold text-holst-600 dark:text-holst-400 hover:text-holst-800 dark:hover:text-holst-200 transition underline underline-offset-4"
          >
            <span>Ver tabla comparativa detallada de todas las funciones</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
