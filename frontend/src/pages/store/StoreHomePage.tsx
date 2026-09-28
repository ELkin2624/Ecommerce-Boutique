import { StoreHero } from '@/widgets/store-hero';
import { StoreEditorialStories } from '@/widgets/store-stories';
import { StoreArSpotlight } from '@/widgets/store-ar-spotlight';
import { StoreClientCare } from '@/widgets/store-services';
import {
  ProductFilters, ProductCatalogGrid, useStoreCatalog,
} from '@/features/store-catalog';

export function StoreHomePage() {
  const {
    categories,
    isLoading,
    selectedCategoryId,
    setSelectedCategoryId,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filteredProducts,
    arProducts,
  } = useStoreCatalog();

  const scrollToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectWomen = () => {
    const vest = categories.find((c) => c.name.toLowerCase().includes('vestid'));
    if (vest) setSelectedCategoryId(vest.id);
    scrollToCatalog();
  };

  const handleSelectMen = () => {
    const urban = categories.find(
      (c) =>
        c.name.toLowerCase().includes('camis') ||
        c.name.toLowerCase().includes('pantal') ||
        c.name.toLowerCase().includes('deport'),
    );
    if (urban) setSelectedCategoryId(urban.id);
    scrollToCatalog();
  };

  const handleClearFilters = () => {
    setSelectedCategoryId('ALL');
    setSearchTerm('');
  };

  return (
    <div className="space-y-20 pb-24 overflow-hidden selection:bg-foreground selection:text-background">
      {/* 1. HERO SECTION CINEMATOGRÁFICO EN PANTALLA COMPLETA */}
      <StoreHero onExploreClick={scrollToCatalog} />

      {/* 2. PANELES DE HISTORIA EDITORIAL (MUJER / HOMBRE & URBANO) */}
      <StoreEditorialStories
        onSelectWomen={handleSelectWomen}
        onSelectMen={handleSelectMen}
      />

      {/* 3. CATÁLOGO PRINCIPAL & GRILLA EDITORIAL */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 sm:px-12 space-y-10 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase font-bold">
              CATÁLOGO & PRENDAS
            </span>
            <h2 className="text-2xl sm:text-4xl font-light text-foreground uppercase tracking-tight font-serif">
              Colección Boutique Kitty
            </h2>
          </div>
        </div>

        {/* Filtros Prada con Tabs de Texto en Mayúsculas */}
        <ProductFilters
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalProductsCount={filteredProducts.length}
        />

        {/* Grilla de Productos */}
        <ProductCatalogGrid
          products={filteredProducts}
          isLoading={isLoading}
          onClearFilters={handleClearFilters}
        />
      </section>

      {/* 4. ATELIER DIGITAL · PROBADOR VIRTUAL AR 3D */}
      <StoreArSpotlight
        arProducts={arProducts}
        onExploreClick={scrollToCatalog}
      />

      {/* 5. SERVICIOS & ATENCIÓN EXCLUSIVA (CLIENT CARE) */}
      <StoreClientCare />
    </div>
  );
}
