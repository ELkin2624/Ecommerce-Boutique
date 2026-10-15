import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const SaasFaq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: '¿Qué significa que mi tienda tenga su propio esquema en PostgreSQL?',
      answer:
        'A diferencia de otros SaaS donde miles de tiendas comparten una única tabla mezclando datos y arriesgando fugas, en FashionStore cada boutique recibe su propio esquema de base de datos blindado (ej. tenant_mimarca). Esto garantiza privacidad física de grado bancario, copias de seguridad aisladas y cero lentitud por tráfico de otros comercios.',
    },
    {
      question: '¿Puedo usar mi propio dominio personalizado (ej. www.mimarca.com)?',
      answer:
        '¡Por supuesto! Al registrarte obtienes inmediatamente un subdominio seguro (mimarca.fashionstore.app) con certificado SSL ya activo. En los planes Pro y Enterprise puedes vincular tu propio dominio personalizado con solo apuntar los registros DNS.',
    },
    {
      question: '¿Cómo funciona la prueba gratuita de 14 días?',
      answer:
        'Puedes crear tu tienda en 10 segundos y probar el catálogo, el Punto de Venta y las funciones de IA sin necesidad de ingresar ninguna tarjeta de crédito. Tu tienda estará 100% operativa desde el primer minuto.',
    },
    {
      question: '¿Puedo cambiar de plan o cancelar cuando lo desee?',
      answer:
        'Sí. No tenemos contratos forzosos ni plazos de permanencia obligatoria. Puedes subir de plan para temporadas altas (ej. Black Friday o Navidad) y volver a un plan menor después, o cancelar tu suscripción con un solo clic desde tu panel.',
    },
    {
      question: '¿Cómo funciona el Punto de Venta (POS) si se corta internet en mi tienda?',
      answer:
        'El Punto de Venta está construido con tecnología Progressive Web App (PWA) y base de datos local Dexie. Si el internet falla en tu centro comercial o local físico, puedes continuar buscando prendas, cobrando y emitiendo tickets. En cuanto regrese la conexión, las ventas se sincronizan solas con la nube.',
    },
    {
      question: '¿Qué pasarelas de pago están integradas?',
      answer:
        'El sistema viene preconfigurado con Stripe para procesar tarjetas Visa, Mastercard y American Express de forma segura, además de soporte para códigos QR Simple para cobros inmediatos bancarios y registro de pagos en efectivo en mostrador.',
    },
  ];

  return (
    <section id="faqs" className="py-20 lg:py-28 bg-saas-bg transition-colors duration-200 border-t border-saas-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-holst-50 dark:bg-holst-900 border border-holst-200 dark:border-holst-600/40 text-xs font-bold text-holst-600 dark:text-holst-400 mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Respuestas Claras & Sin Rodeos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-saas-text-primary">
            Preguntas Frecuentes
          </h2>
          <p className="mt-3 text-sm sm:text-base text-saas-text-dim">
            Todo lo que necesitas saber antes de lanzar tu boutique en nuestro SaaS.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-saas-border bg-saas-surface overflow-hidden transition-all duration-200 shadow-sm"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left gap-4 hover:bg-saas-bg-subtle/50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-saas-text-primary">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-holst-600 text-white rotate-180'
                        : 'bg-saas-bg-subtle text-saas-text-dim'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-saas-text-dim leading-relaxed border-t border-saas-border/40 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
