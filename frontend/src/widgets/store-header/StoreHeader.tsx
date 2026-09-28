import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api/axios-client';
import type { Product, Category } from '@/shared/types/api';
import { StoreHeaderLogo } from './ui/StoreHeaderLogo';
import { StoreHeaderNav } from './ui/StoreHeaderNav';
import { StoreHeaderAuth } from './ui/StoreHeaderAuth';
import { StoreCategoriesModal } from './ui/StoreCategoriesModal';
import { StoreArAppModal } from './ui/StoreArAppModal';
import { StoreSearchModal } from './ui/StoreSearchModal';

export function StoreHeader() {
  const [activeMenu, setActiveMenu] = useState<'categories' | 'ar_app' | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Cargar categorías y productos para navegación y búsqueda rápida
    const loadNavData = async () => {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          apiClient.get('/catalog/categories'),
          apiClient.get('/catalog/products?limit=30'),
        ]);
        const cats = Array.isArray(catsRes.data)
          ? catsRes.data
          : catsRes.data?.data || [];
        const prods = Array.isArray(prodsRes.data)
          ? prodsRes.data
          : prodsRes.data?.items || prodsRes.data?.data || [];
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.warn('Error loading header navigation data:', err);
      }
    };
    loadNavData();
  }, []);

  const handleToggleCategories = () => {
    setActiveMenu((prev) => (prev === 'categories' ? null : 'categories'));
    setIsSearchOpen(false);
  };

  const handleToggleArApp = () => {
    setActiveMenu((prev) => (prev === 'ar_app' ? null : 'ar_app'));
    setIsSearchOpen(false);
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setActiveMenu(null);
  };

  const handleCloseMenus = () => {
    setActiveMenu(null);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full pt-3 pb-2 px-3 sm:px-6 pointer-events-none transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 pointer-events-auto">
          {/* 1. Botón Logo Circular */}
          <StoreHeaderLogo />

          {/* 2. Barra de Navegación Cápsula Central */}
          <StoreHeaderNav
            activeMenu={activeMenu}
            onToggleCategories={handleToggleCategories}
            onToggleArApp={handleToggleArApp}
            onOpenSearch={handleOpenSearch}
            onCloseMenus={handleCloseMenus}
          />

          {/* 3. Acciones de Carrito & Autenticación */}
          <StoreHeaderAuth />
        </div>
      </header>

      {/* Modales Desacoplados */}
      {activeMenu === 'categories' && (
        <StoreCategoriesModal
          categories={categories}
          onClose={() => setActiveMenu(null)}
        />
      )}

      {activeMenu === 'ar_app' && (
        <StoreArAppModal onClose={() => setActiveMenu(null)} />
      )}

      {isSearchOpen && (
        <StoreSearchModal
          products={products}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </>
  );
}
