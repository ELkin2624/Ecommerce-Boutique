import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api/axios-client';
import type { Product, Category } from '@/shared/types/api';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod-fallback-1',
    name: 'Vestido Gala Midnight Silk',
    description: 'Vestido largo de fiesta en seda con escote sutil y caída fluida.',
    brand: 'Boutique Kitty Couture',
    categoryId: 'cat-vestidos',
    category: { id: 'cat-vestidos', name: 'Vestidos', slug: 'vestidos' },
    isActive: true,
    arImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    coverImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    variants: [
      { id: 'v1-1', productId: 'prod-fallback-1', sku: 'VEST-MID-S', size: 'S', color: 'Negro Ébano', price: 349.99, cost: 150, isActive: true, stock: 8 },
      { id: 'v1-2', productId: 'prod-fallback-1', sku: 'VEST-MID-M', size: 'M', color: 'Negro Ébano', price: 349.99, cost: 150, isActive: true, stock: 5 },
    ],
  },
  {
    id: 'prod-fallback-2',
    name: 'Blusa Sartorial Lino Puro',
    description: 'Blusa de corte contemporáneo confeccionada en 100% lino orgánico.',
    brand: 'Studio Kitty',
    categoryId: 'cat-blusas',
    category: { id: 'cat-blusas', name: 'Blusas', slug: 'blusas' },
    isActive: true,
    arImageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
    coverImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
    variants: [
      { id: 'v2-1', productId: 'prod-fallback-2', sku: 'BLUS-LIN-M', size: 'M', color: 'Blanco Arena', price: 189.50, cost: 80, isActive: true, stock: 12 },
    ],
  },
  {
    id: 'prod-fallback-3',
    name: 'Conjunto Minimalist Blazer & Pantalón',
    description: 'Traje de dos piezas con silueta estructurada y solapas refinadas.',
    brand: 'Boutique Kitty',
    categoryId: 'cat-conjuntos',
    category: { id: 'cat-conjuntos', name: 'Conjuntos', slug: 'conjuntos' },
    isActive: true,
    arImageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    variants: [
      { id: 'v3-1', productId: 'prod-fallback-3', sku: 'TRAJ-MIN-S', size: 'S', color: 'Gris Grafito', price: 420.00, cost: 200, isActive: true, stock: 4 },
    ],
  },
  {
    id: 'prod-fallback-4',
    name: 'Top Deportivo Training Seamless',
    description: 'Top deportivo de compresión suave con tecnología transpirable.',
    brand: 'Kitty Active',
    categoryId: 'cat-deportivo',
    category: { id: 'cat-deportivo', name: 'Deportivo', slug: 'deportivo' },
    isActive: true,
    arImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    variants: [
      { id: 'v4-1', productId: 'prod-fallback-4', sku: 'TOP-SEAM-S', size: 'S', color: 'Azul Cobalto', price: 120.00, cost: 50, isActive: true, stock: 15 },
    ],
  },
];

export function useStoreCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/catalog/products?limit=50'),
        apiClient.get('/catalog/categories'),
      ]);

      const prods = Array.isArray(productsRes.data)
        ? productsRes.data
        : productsRes.data?.items || productsRes.data?.data || [];

      const cats = Array.isArray(categoriesRes.data)
        ? categoriesRes.data
        : categoriesRes.data?.data || [];

      if (prods.length > 0) {
        setProducts(prods);
      } else {
        setProducts(FALLBACK_PRODUCTS);
      }

      if (cats.length > 0) {
        setCategories(cats);
      } else {
        setCategories([
          { id: 'cat-vestidos', name: 'Vestidos', slug: 'vestidos' },
          { id: 'cat-blusas', name: 'Blusas', slug: 'blusas' },
          { id: 'cat-conjuntos', name: 'Conjuntos', slug: 'conjuntos' },
          { id: 'cat-deportivo', name: 'Deportivo', slug: 'deportivo' },
        ]);
      }
    } catch (error) {
      console.warn('Usando catálogo de respaldo:', error);
      setProducts(FALLBACK_PRODUCTS);
      setCategories([
        { id: 'cat-vestidos', name: 'Vestidos', slug: 'vestidos' },
        { id: 'cat-blusas', name: 'Blusas', slug: 'blusas' },
        { id: 'cat-conjuntos', name: 'Conjuntos', slug: 'conjuntos' },
        { id: 'cat-deportivo', name: 'Deportivo', slug: 'deportivo' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredProducts = products
    .filter((product) => {
      if (selectedCategoryId !== 'ALL' && product.categoryId !== selectedCategoryId) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = product.name?.toLowerCase().includes(term);
        const matchBrand = product.brand?.toLowerCase().includes(term);
        const matchCategory = product.category?.name?.toLowerCase().includes(term);
        if (!matchName && !matchBrand && !matchCategory) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') {
        const minA = a.variants?.[0]?.price || 0;
        const minB = b.variants?.[0]?.price || 0;
        return Number(minA) - Number(minB);
      }
      if (sortBy === 'price_desc') {
        const maxA = a.variants?.[0]?.price || 0;
        const maxB = b.variants?.[0]?.price || 0;
        return Number(maxB) - Number(maxA);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const arProducts = products.filter((p) => Boolean(p.arImageUrl));

  return {
    products,
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
  };
}
