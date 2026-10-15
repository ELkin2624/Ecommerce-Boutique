import React, { useState } from 'react';
import {
  Check,
  Minus,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SaasComparisonTableProps {
  onSelectPlan: (planId: string) => void;
}

export const SaasComparisonTable: React.FC<SaasComparisonTableProps> = ({
  onSelectPlan,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const categories = [
    {
      name: 'Capacidad & Tienda Online',
      features: [
        { name: 'Catálogo de Prendas', starter: 'Hasta 500 prendas', pro: 'Ilimitado', enterprise: 'Ilimitado' },
        { name: 'Variantes de Talla y Color', starter: 'Hasta 5 por producto', pro: 'Ilimitadas', enterprise: 'Ilimitadas' },
        { name: 'Subdominio propio (.fashionstore.app)', starter: true, pro: true, enterprise: true },
        { name: 'Dominio personalizado (mimarca.com)', starter: false, pro: 'Opcional', enterprise: 'Incluido gratuito' },
        { name: 'Almacenamiento de Fotos HD', starter: '5 GB', pro: '50 GB', enterprise: '500 GB dedicados' },
        { name: 'Precios Minoristas y Mayoristas', starter: true, pro: true, enterprise: true },
      ],
    },
    {
      name: 'Punto de Venta (POS) en Sucursales',
      features: [
        { name: 'Terminales de Caja POS Web', starter: '1 Terminal', pro: 'Hasta 5 Cajas', enterprise: 'Cajas ilimitadas' },
        { name: 'Modo Offline (Vender sin internet)', starter: true, pro: true, enterprise: true },
        { name: 'Arqueo de Caja y Control de Turnos', starter: 'Básico', pro: 'Avanzado', enterprise: 'Avanzado multi-cajero' },
        { name: 'Lector de Código de Barras (Cámara/USB)', starter: true, pro: true, enterprise: true },
        { name: 'Impresión de Tickets Térmicos', starter: true, pro: true, enterprise: true },
      ],
    },
    {
      name: 'Inteligencia Artificial para Moda',
      features: [
        { name: 'Probador Físico Inteligente (Reserva web)', starter: false, pro: true, enterprise: true },
        { name: 'Probador Virtual con IA', starter: false, pro: true, enterprise: true },
        { name: 'Asesor Anatómico de Tallas (Gemini)', starter: false, pro: true, enterprise: true },
        { name: 'Remoción Automática de Fondo en Prendas', starter: false, pro: 'Hasta 50 fotos/mes', enterprise: 'Ilimitado' },
        { name: 'Reportes por Voz con IA (Whisper)', starter: false, pro: false, enterprise: true },
      ],
    },
    {
      name: 'Inventario & Multi-Sucursales',
      features: [
        { name: 'Sucursales Físicas Gestionadas', starter: '1 Sucursal', pro: 'Hasta 5 Sucursales', enterprise: 'Ilimitadas' },
        { name: 'Almacenes y Depósitos Centrales', starter: '1 Almacén', pro: 'Hasta 5 Almacenes', enterprise: 'Ilimitados' },
        { name: 'Transferencias de Stock inter-tiendas', starter: false, pro: true, enterprise: true },
        { name: 'Kardex de Auditoría y Movimientos', starter: 'Últimos 30 días', pro: 'Histórico 1 año', enterprise: 'Histórico ilimitado' },
        { name: 'Alertas Inteligentes de Reabastecimiento', starter: true, pro: true, enterprise: true },
      ],
    },
    {
      name: 'Infraestructura & Datos Aislados',
      features: [
        { name: 'Esquema PostgreSQL Independiente', starter: true, pro: true, enterprise: true },
        { name: 'Certificado SSL / Cifrado TLS', starter: true, pro: true, enterprise: true },
        { name: 'Copias de Seguridad (Backups)', starter: 'Semanales', pro: 'Diarias automáticas', enterprise: 'Continuas en tiempo real' },
        { name: 'API REST & Webhooks para ERPs', starter: false, pro: 'Lectura', enterprise: 'Acceso total bi-direccional' },
        { name: 'Disponibilidad SLA Garantizada', starter: '99.5%', pro: '99.9%', enterprise: '99.99% con contrato' },
      ],
    },
    {
      name: 'Soporte & Acompañamiento',
      features: [
        { name: 'Canales de Atención', starter: 'Email (24h)', pro: 'WhatsApp y Chat 24/7', enterprise: 'Gerente VIP Dedicado' },
        { name: 'Capacitación a Personal de Mostrador', starter: 'Tutoriales en video', pro: 'Sesión 1 a 1 guiada', enterprise: 'Onboarding in-situ' },
        { name: 'Migración Gratuita de Datos Anteriores', starter: false, pro: true, enterprise: true },
      ],
    },
  ];

  const renderValue = (val: any) => {
    if (val === true) {
      return (
        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      );
    }
    if (val === false) {
      return (
        <div className="inline-flex items-center justify-center w-6 h-6 text-saas-text-dim/40">
          <Minus className="w-4 h-4 stroke-[2]" />
        </div>
      );
    }
    return <span className="text-xs sm:text-sm font-semibold text-saas-text-primary">{val}</span>;
  };

  return (
    <section id="comparativa" className="py-20 lg:py-28 bg-saas-bg transition-colors duration-200 border-t border-saas-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-holst-50 dark:bg-holst-900 border border-holst-200 dark:border-holst-600/40 text-xs font-bold text-holst-600 dark:text-holst-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparencia Total de Capacidades</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-saas-text-primary">
            Comparativa detallada de todas las funciones
          </h2>
          <p className="mt-3 text-sm sm:text-base text-saas-text-dim">
            Compara de cerca las especificaciones y elige la opción que mejor se adapte al volumen de tu boutique.
          </p>
        </div>

        {/* Collapsible Trigger for Mobile or Quick View */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-bold text-holst-600 dark:text-holst-400 hover:text-holst-800 transition px-3 py-1.5 rounded-lg border border-saas-border bg-saas-surface"
          >
            <span>{isExpanded ? 'Contraer tabla' : 'Expandir tabla completa'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="rounded-3xl border border-saas-border bg-saas-surface shadow-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              {/* Sticky Table Header */}
              <thead>
                <tr className="border-b border-saas-border bg-saas-bg-subtle">
                  <th className="py-6 px-6 text-sm font-bold text-saas-text-primary w-2/5">
                    Funcionalidades de la Plataforma
                  </th>
                  <th className="py-6 px-6 text-center w-1/5">
                    <div className="font-black text-base text-saas-text-primary">Starter</div>
                    <div className="text-xs text-saas-text-dim font-medium mt-0.5">$29 / mes</div>
                    <button
                      onClick={() => onSelectPlan('STARTER')}
                      className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold border border-saas-border bg-saas-surface hover:border-holst-600 text-saas-text-primary transition"
                    >
                      Elegir Starter
                    </button>
                  </th>
                  <th className="py-6 px-6 text-center w-1/5 bg-holst-50/50 dark:bg-holst-900/30 border-x border-holst-600/30">
                    <div className="inline-block px-2 py-0.5 rounded-full bg-holst-600 text-white text-[10px] font-black uppercase mb-1">
                      Más Elegido
                    </div>
                    <div className="font-black text-base text-saas-text-primary">Pro Omnicanal</div>
                    <div className="text-xs text-holst-600 dark:text-holst-400 font-bold mt-0.5">$79 / mes</div>
                    <button
                      onClick={() => onSelectPlan('PRO')}
                      className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-holst-600 text-white hover:bg-holst-800 shadow-sm transition"
                    >
                      Probar Pro Gratis
                    </button>
                  </th>
                  <th className="py-6 px-6 text-center w-1/5">
                    <div className="font-black text-base text-saas-text-primary">Enterprise</div>
                    <div className="text-xs text-saas-text-dim font-medium mt-0.5">$199 / mes</div>
                    <button
                      onClick={() => onSelectPlan('ENTERPRISE')}
                      className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold border border-saas-border bg-saas-surface hover:border-holst-600 text-saas-text-primary transition"
                    >
                      Elegir Enterprise
                    </button>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-saas-border text-xs sm:text-sm">
                {categories.map((cat, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-saas-bg-canvas/40">
                      <td
                        colSpan={4}
                        className="py-3 px-6 text-xs font-black uppercase tracking-wider text-holst-600 dark:text-holst-400"
                      >
                        {cat.name}
                      </td>
                    </tr>
                    {cat.features.map((feat, featIdx) => (
                      <tr
                        key={featIdx}
                        className="hover:bg-saas-bg-subtle/60 transition-colors"
                      >
                        <td className="py-4 px-6 text-saas-text-secondary font-medium">
                          {feat.name}
                        </td>
                        <td className="py-4 px-6 text-center">{renderValue(feat.starter)}</td>
                        <td className="py-4 px-6 text-center bg-holst-50/20 dark:bg-holst-900/10 border-x border-holst-600/20 font-bold">
                          {renderValue(feat.pro)}
                        </td>
                        <td className="py-4 px-6 text-center">{renderValue(feat.enterprise)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
