import React, { useState } from 'react';
import { ArrowRight, Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface SaasCtaBannerProps {
  onOpenRegister: (planId?: string) => void;
}

export const SaasCtaBanner: React.FC<SaasCtaBannerProps> = ({ onOpenRegister }) => {
  const [storeName, setStoreName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenRegister('PRO');
  };

  return (
    <section className="py-20 bg-gradient-to-b from-saas-bg to-saas-bg-canvas/50 transition-colors duration-200 border-t border-saas-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-14 overflow-hidden border border-holst-600/40 bg-gradient-to-br from-holst-900 via-holst-800 to-holst-950 text-white shadow-2xl text-center">
          {/* Decorative Background Lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-holst-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-holst-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-holst-400/15 border border-holst-400/30 text-xs font-bold text-holst-200 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-holst-400" />
              <span>Despliegue Instantáneo en la Nube</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Convierte tus planes en ventas reales hoy mismo
            </h2>

            <p className="mt-4 text-sm sm:text-base text-holst-200 leading-relaxed font-normal">
              Únete a las boutiques que ya duplicaron su alcance con catálogo omnicanal, punto de venta offline y probador con inteligencia artificial.
            </p>

            {/* Quick Registration Form Trigger */}
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Nombre de tu boutique (ej. Velvet Store)"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full sm:w-2/3 px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-holst-400 backdrop-blur-md"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-holst-400 hover:bg-holst-200 text-holst-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                <span>Crear Tienda</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Micro Guarantees */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-holst-200/80 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-holst-400" />
                <span>14 días de prueba gratis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Sin tarjeta de crédito requerida</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
