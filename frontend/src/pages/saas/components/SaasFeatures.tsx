import React from 'react';
import {
  ShoppingBag, Store, Cpu,Truck
} from 'lucide-react';

export const SaasFeatures: React.FC = () => {
  const spotlights = [
    {
      id: 'ecommerce',
      badge: 'STOREFRONT OMNICANAL',
      title: 'Tu boutique online con catálogo de alta costura',
      description:
        'Ofrece una experiencia de compra rápida y visual. Filtros avanzados por talla, colección, material y color. Soporte integrado para precios mayoristas y minoristas con cálculo automático de márgenes.',
      highlights: ['Catálogo con variantes dinámicas', 'Carrito persistente y checkout veloz', 'Diseño optimizado para compras móviles'],
      icon: ShoppingBag,
    },
    {
      id: 'pos',
      badge: 'PUNTO DE VENTA POS',
      title: 'Ventas en mostrador con modo 100% offline',
      description:
        'Cobra en segundos en tu tienda física con cualquier tablet o laptop. Lee códigos de barras con la cámara o pistola USB, emite tickets y haz arqueos de caja sin temerle a las caídas de internet gracias a Dexie IndexedDB.',
      highlights: ['Funciona sin conexión a internet', 'Arqueo de caja y control de turnos', 'Sincronización automática al reconectar'],
      icon: Store,
    },
    {
      id: 'fitting',
      badge: 'INNOVACIÓN EN MODA',
      title: 'Probador Físico Inteligente + Probador Virtual IA',
      description:
        'Permite a tus clientas reservar prendas online para probarse en tienda con apartado temporal de stock, o usar el probador virtual con Inteligencia Artificial que estima la talla perfecta según medidas corporales.',
      highlights: ['Reserva web con retención de stock', 'Estimador anatómico de tallas con IA', 'Reducción del 65% en devoluciones'],
      icon: Cpu,
    },
    {
      id: 'inventory',
      badge: 'GESTIÓN LOGÍSTICA',
      title: 'Control multi-sucursal y transferencias entre tiendas',
      description:
        'Monitorea el inventario de todas tus sedes y almacenes centrales en una sola pantalla. Realiza traslados de mercancía entre boutiques con kardex auditable y alertas automáticas de reposición.',
      highlights: ['Kardex de movimientos en tiempo real', 'Guías de transferencia inter-sucursal', 'Alertas inteligentes de stock mínimo'],
      icon: Truck,
    },
  ];

  return (
    <section id="productos" className="py-24 bg-saas-bg transition-colors duration-200 border-t border-saas-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-saas-text-primary">
            Todo lo que tu boutique necesita para dominar el retail
          </h2>

          <p className="mt-4 text-base sm:text-lg text-saas-text-dim">
            Deja atrás sistemas fragmentados y hojas de cálculo. Nuestro SaaS unifica cada punto de contacto de tu marca de moda.
          </p>
        </div>

        {/* 2x2 Feature Spotlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {spotlights.map((spotlight) => {
            const Icon = spotlight.icon;
            return (
              <div
                key={spotlight.id}
                className="rounded-3xl p-8 border border-saas-border bg-saas-surface hover:border-holst-600/40 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-holst-50 dark:bg-holst-900 text-holst-600 dark:text-holst-400 border border-holst-200 dark:border-holst-600/40">
                      {spotlight.badge}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-holst-50 dark:bg-holst-900 text-holst-600 dark:text-holst-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-saas-text-primary tracking-tight">
                    {spotlight.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-saas-text-dim leading-relaxed">
                    {spotlight.description}
                  </p>

                  <div className="mt-6 pt-5 border-t border-saas-border space-y-2">
                    {spotlight.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-saas-text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-holst-600 dark:bg-holst-400" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
