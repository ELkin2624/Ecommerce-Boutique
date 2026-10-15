import React from 'react';
import {
  Database,
  Store,
  ShieldCheck,
  Cloud,
  RefreshCw,
  CreditCard,
  Sparkles,
} from 'lucide-react';

export const SaasAlwaysIncluded: React.FC = () => {
  const foundationalBenefits = [
    {
      icon: Database,
      title: 'Aislamiento por Esquema PostgreSQL',
      description:
        'Cada boutique recibe su propio esquema de base de datos blindado (tenant_slug). Cero riesgo de mezcla de datos, máxima privacidad y consultas ultrarrápidas.',
    },
    {
      icon: Store,
      title: 'Punto de Venta (POS) en Mostrador',
      description:
        'Vende en tienda física con interfaz táctil fluida, compatible con lectores de código de barras, tickets e impresoras térmicas. Funciona incluso si se cae internet.',
    },
    {
      icon: RefreshCw,
      title: 'Sincronización de Stock en Tiempo Real',
      description:
        'Se acabó el sobre-vender: una prenda vendida en mostrador se descuenta instantáneamente de la tienda online y de tus sucursales sin demoras.',
    },
    {
      icon: ShieldCheck,
      title: 'Seguridad y Certificados SSL Gratuitos',
      description:
        'Cifrado HTTPS y TLS de grado bancario para tu subdominio y dominios propios. Cumplimiento con estándares de protección de datos de pago.',
    },
    {
      icon: CreditCard,
      title: 'Pasarelas de Pago Preintegradas',
      description:
        'Comienza a cobrar el día 1 con Stripe (tarjetas de crédito/débito internacionales) y pagos instantáneos con QR Simple sin complejas configuraciones.',
    },
    {
      icon: Cloud,
      title: 'Nube sin Mantenimiento ni Servidores',
      description:
        'Nos encargamos del hosting, copias de seguridad continuas y nuevas actualizaciones automáticas. Concéntrate en vender moda, nosotros en la tecnología.',
    },
  ];

  return (
    <section id="siempre-incluido" className="py-20 bg-saas-bg transition-colors duration-200 border-t border-saas-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-holst-50 dark:bg-holst-900 border border-holst-200 dark:border-holst-600/40 text-xs font-bold text-holst-600 dark:text-holst-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fundamentos de Grado Enterprise</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-saas-text-primary">
            Siempre incluido en cada uno de nuestros planes
          </h2>

          <p className="mt-3 text-base sm:text-lg text-saas-text-dim">
            Sin importar si eres una boutique que da sus primeros pasos o una gran franquicia, cuentas con la misma infraestructura robusta y segura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foundationalBenefits.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div
                key={idx}
                className="p-7 rounded-2xl border border-saas-border bg-saas-surface hover:border-holst-600/40 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-holst-50 dark:bg-holst-900 border border-holst-200 dark:border-holst-600/40 text-holst-600 dark:text-holst-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-saas-text-primary tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-saas-text-dim leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-saas-border text-[11px] font-semibold text-holst-600 dark:text-holst-400 flex items-center gap-1">
                  <span>✓ Incluido sin costo adicional</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
