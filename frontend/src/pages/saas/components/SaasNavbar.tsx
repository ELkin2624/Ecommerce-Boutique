import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Sun, Moon, Menu, X, LogIn,
} from 'lucide-react';
import { useUiStore } from '@/app/store/ui.store';

interface SaasNavbarProps {
  onOpenRegister: (planId?: string) => void;
}

export const SaasNavbar: React.FC<SaasNavbarProps> = ({ onOpenRegister }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUiStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 dark:bg-holst-950/95 backdrop-blur-md border-b border-holst-200/80 dark:border-holst-800/80 shadow-sm'
          : 'bg-white/90 dark:bg-holst-950/90 backdrop-blur-sm border-b border-saas-border'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* 1. Brand Logo + Name aligned to the left corner */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="FashionStore SaaS - Inicio"
        >
          <img
            src="/logo/logo-fashion.jpg"
            alt="FashionStore Logo"
            className="h-9 w-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
          />
          <div className="flex items-center">
            <span className="text-xl font-black tracking-tight text-saas-text-primary">
              Fashion<span className="text-holst-600 dark:text-holst-400">Store</span>
            </span>
          </div>
        </div>

        {/* 2. Simplified, Essential Navigation Links (Shopify-inspired minimalism) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <a
            href="#productos"
            onClick={(e) => handleSmoothScroll(e, 'productos')}
            className="text-sm font-semibold text-saas-text-secondary hover:text-holst-600 dark:hover:text-holst-300 px-3.5 py-1.5 rounded-lg hover:bg-holst-500/10 transition-colors"
          >
            Productos
          </a>
          <a
            href="#planes"
            onClick={(e) => handleSmoothScroll(e, 'planes')}
            className="text-sm font-semibold text-saas-text-secondary hover:text-holst-600 dark:hover:text-holst-300 px-3.5 py-1.5 rounded-lg hover:bg-holst-500/10 transition-colors"
          >
            Precios
          </a>
          <a
            href="#beneficios"
            onClick={(e) => handleSmoothScroll(e, 'beneficios')}
            className="text-sm font-semibold text-saas-text-secondary hover:text-holst-600 dark:hover:text-holst-300 px-3.5 py-1.5 rounded-lg hover:bg-holst-500/10 transition-colors"
          >
            Beneficios
          </a>
        </nav>

        {/* 3. Top-Right Corner (Strictly 3 Elements: Theme, Login, Register) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Button A: Theme Switcher (Claro / Oscuro) */}
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema de color"
            title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            className="p-2 rounded-xl border border-saas-border bg-saas-surface hover:bg-saas-surface-hover text-saas-text-primary transition-colors flex items-center justify-center shadow-sm hover:border-holst-400/50"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-holst-800 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* Button B: Login Button */}
          <button
            onClick={() => navigate('/admin/login')}
            className="flex items-center gap-1.5 sm:gap-2 bg-holst-600 hover:bg-holst-700 active:bg-holst-800 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2 rounded-xl shadow-md shadow-holst-600/25 hover:shadow-holst-600/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>

          {/* Button C: Primary Action (Empezar Gratis / Registra tu tienda) */}
          <button
            onClick={() => onOpenRegister('PRO')}
            className="flex items-center gap-1.5 sm:gap-2 bg-holst-600 hover:bg-holst-700 active:bg-holst-800 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2 rounded-xl shadow-md shadow-holst-600/25 hover:shadow-holst-600/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Registra tu tienda</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Mobile Hamburger Toggle (for mobile screens) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden rounded-xl border border-saas-border text-saas-text-secondary hover:text-saas-text-primary hover:bg-saas-surface transition-colors"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-saas-border bg-white dark:bg-holst-950 px-4 pt-3 pb-5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2">
            <a
              href="#productos"
              onClick={(e) => handleSmoothScroll(e, 'productos')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-saas-text-primary hover:bg-holst-500/10"
            >
              Productos
            </a>
            <a
              href="#planes"
              onClick={(e) => handleSmoothScroll(e, 'planes')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-saas-text-primary hover:bg-holst-500/10"
            >
              Precios
            </a>
            <a
              href="#beneficios"
              onClick={(e) => handleSmoothScroll(e, 'beneficios')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-saas-text-primary hover:bg-holst-500/10"
            >
              Beneficios
            </a>
            <div className="pt-2 border-t border-saas-border flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/admin/login');
                }}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-saas-text-primary py-2.5 rounded-xl border border-saas-border hover:bg-saas-surface"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
