import React from 'react';
import { Quote, Star, HeartHandshake } from 'lucide-react';

export const SaasTestimonials: React.FC = () => {
  const metrics = [
    { value: '+48%', label: 'Crecimiento en Ventas', sublabel: 'Al unificar mostrador físico con tienda online' },
    { value: '65%', label: 'Menos Devoluciones', sublabel: 'Gracias al probador virtual y recomendador de tallas IA' },
    { value: '0 Errores', label: 'Descuadre de Stock', sublabel: 'Sincronización multi-sucursal en milisegundos' },
    { value: '99.98%', label: 'Disponibilidad Cloud', sublabel: 'Aislamiento de alto tráfico por esquema PostgreSQL' },
  ];

  const stories = [
    {
      name: 'Boutique Elegance',
      founder: 'Camila Restrepo',
      role: 'Directora Creativa & Fundadora',
      avatar: 'CE',
      quote:
        'Antes perdíamos ventas porque una prenda se vendía en la tienda física mientras alguien la compraba en la web. Con el esquema dedicado y el POS unificado de FashionStore, nuestro inventario está 100% blindado y sincronizado.',
      plan: 'PLAN PRO OMNICANAL',
    },
    {
      name: 'Urban Chic Atelier',
      founder: 'Sebastián Morales',
      role: 'Gerente de Operaciones',
      avatar: 'SM',
      quote:
        'En plena feria de moda se cayó la conexión WiFi del recinto. El POS siguió cobrando sin pestañear en modo offline y al llegar al hotel todo se sincronizó a la perfección. Es la herramienta más confiable que hemos tenido.',
      plan: 'PLAN PRO OMNICANAL',
    },
    {
      name: 'Boho Chic Franquicias',
      founder: 'Valentina Silva',
      role: 'CEO & Co-fundadora',
      avatar: 'VS',
      quote:
        'Poder gestionar 3 franquicias en ciudades distintas, cada una con su caja y personal, pero con un inventario y catálogo centralizado ha sido clave para expandirnos este año sin contratar un equipo gigante de TI.',
      plan: 'PLAN ENTERPRISE',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-saas-bg-subtle transition-colors duration-200 border-t border-saas-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Metrics Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-saas-surface border border-saas-border text-center shadow-sm"
            >
              <div className="text-3xl sm:text-4xl font-black text-holst-600 dark:text-holst-400">
                {m.value}
              </div>
              <div className="mt-1 text-sm font-bold text-saas-text-primary">
                {m.label}
              </div>
              <div className="mt-1 text-xs text-saas-text-dim">
                {m.sublabel}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-holst-50 dark:bg-holst-900 border border-holst-200 dark:border-holst-600/40 text-xs font-bold text-holst-600 dark:text-holst-400 mb-3">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Historias de Éxito de Boutiques Reales</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-saas-text-primary">
            La plataforma en la que confían las mejores marcas de moda
          </h2>
        </div>

        {/* Stories Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-saas-surface border border-saas-border shadow-md hover:shadow-xl hover:border-holst-600/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-holst-50 dark:bg-holst-900 text-holst-600 dark:text-holst-400 border border-holst-200 dark:border-holst-600/40">
                    {story.plan}
                  </span>
                </div>

                <Quote className="w-8 h-8 text-holst-400/40 mb-3" />
                <p className="text-xs sm:text-sm text-saas-text-secondary leading-relaxed italic">
                  "{story.quote}"
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-saas-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-holst-600 text-white font-black text-xs flex items-center justify-center">
                  {story.avatar}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-saas-text-primary">
                    {story.founder}
                  </div>
                  <div className="text-[11px] text-saas-text-dim">
                    {story.role} • <strong className="text-holst-600 dark:text-holst-400">{story.name}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
