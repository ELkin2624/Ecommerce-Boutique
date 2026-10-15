import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ExternalLink, Sun, Moon, Store, Layers,
  HelpCircle, Tag, ShieldCheck,
} from 'lucide-react';
import { useUiStore } from '@/app/store/ui.store';

interface SaasNavbarProps {
  onOpenRegister: (planId?: string) => void;
}

export const SaasNavbar: React.FC<SaasNavbarProps> = ({ onOpenRegister }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUiStore();

  return (
    <nav className="sticky top-0 z-50 border-b border-saas-border bg-saas-bg/90 backdrop-blur-md transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo with Holst Colors */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-holst-800 via-holst-600 to-holst-400 flex items-center justify-center text-white font-extrabold shadow-md shadow-holst-600/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-saas-text-primary">
                FashionStore
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links (Shopify-Style Order) */}
        <div className="hidden lg:flex items-center gap-7 text-sm font-semibold text-saas-text-secondary">
          <a
            href="#planes"
            className="hover:text-holst-600 dark:hover:text-holst-400 transition flex items-center gap-1.5"
          >
            <Tag className="w-4 h-4 text-holst-600 dark:text-holst-400" />
            <span>Planes & Precios</span>
          </a>
          <a
            href="#siempre-incluido"
            className="hover:text-holst-600 dark:hover:text-holst-400 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-holst-600 dark:text-holst-400" />
            <span>Beneficios</span>
          </a>
          <a
            href="#ecosistema"
            className="hover:text-holst-600 dark:hover:text-holst-400 transition flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-holst-600 dark:text-holst-400" />
            <span>Ecosistema</span>
          </a>
          <a
            href="#comparativa"
            className="hover:text-holst-600 dark:hover:text-holst-400 transition"
          >
            Comparativa
          </a>
          <a
            href="#arquitectura"
            className="hover:text-holst-600 dark:hover:text-holst-400 transition"
          >
            Arquitectura
          </a>
          <a
            href="#faqs"
            className="hover:text-holst-600 dark:hover:text-holst-400 transition flex items-center gap-1"
          >
            <HelpCircle className="w-4 h-4 text-saas-text-dim" />
            <span>Preguntas</span>
          </a>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Dark / Light Mode Switcher Button */}
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema de color"
            title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            className="p-2 rounded-xl border border-saas-border bg-saas-surface hover:bg-saas-surface-hover text-saas-text-primary transition-colors flex items-center justify-center shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-holst-800 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* Demo Store Link */}
          <button
            onClick={() => navigate('/store')}
            className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-saas-text-secondary hover:text-holst-600 dark:hover:text-holst-400 px-3 py-2 rounded-xl hover:bg-saas-surface-hover transition border border-transparent hover:border-saas-border"
          >
            <Store className="w-4 h-4 text-holst-600 dark:text-holst-400" />
            <span>Tienda Demo</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>

          {/* Primary CTA (Shopify-Style "Start Free Trial") */}
          <button
            onClick={() => onOpenRegister('PRO')}
            className="flex items-center gap-2 bg-holst-600 hover:bg-holst-800 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-md shadow-holst-600/30 hover:shadow-holst-600/40 transition-all transform hover:-translate-y-0.5"
          >
            <span>Crear mi Tienda</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
