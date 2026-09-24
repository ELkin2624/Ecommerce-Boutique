import React from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/shared/ui/Header';
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { useCatalog } from '@/features/catalog/hooks/useCatalog';
import { useCartStore } from '@/features/cart/model/useCartStore';

export const CatalogScreen: React.FC = () => {
  const {
    products,
    categories,
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
  } = useCatalog();
  const { totalCount } = useCartStore();

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header title="CATÁLOGO" subtitle="Todas las colecciones" cartCount={totalCount} />

      {/* Buscador de prendas */}
      <View style={styles.searchSection} className="px-4 pt-2.5 pb-1.5">
        <View style={styles.searchInputContainer} className="flex-row items-center bg-slate-100 rounded-xl px-3 h-11">
          <Ionicons name="search-outline" size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            className="flex-1 text-xs font-medium text-slate-900 h-full ml-2"
            placeholder="Buscar por prenda, modelo o color..."
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearBtn} className="p-1">
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtro de Categorías horizontal */}
      <View style={styles.categoriesBar} className="py-2 border-b border-slate-50">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <TouchableOpacity
            style={[styles.chip, selectedCategory === null && styles.chipActive]}
            className={`px-3.5 py-1.5 rounded-full border mr-2 ${
              selectedCategory === null
                ? 'bg-slate-900 border-slate-900'
                : 'bg-slate-50 border-slate-200'
            }`}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}
              className={`text-xs font-semibold ${
                selectedCategory === null ? 'text-white font-bold' : 'text-slate-500'
              }`}
            >
              Todo ({products.length})
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
              className={`px-3.5 py-1.5 rounded-full border mr-2 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 border-slate-900'
                  : 'bg-slate-50 border-slate-200'
              }`}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}
                className={`text-xs font-semibold ${
                  selectedCategory === cat.id ? 'text-white font-bold' : 'text-slate-500'
                }`}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grilla de productos */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerContainer} className="py-16 items-center justify-center gap-2 px-6">
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText} className="text-xs text-slate-500 font-medium">Buscando prendas...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerContainer} className="py-16 items-center justify-center gap-2 px-6">
            <Ionicons name="shirt-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle} className="text-sm font-bold text-slate-900 mt-2">No se encontraron resultados</Text>
            <Text style={styles.emptySubtitle} className="text-xs text-slate-400 text-center leading-4">
              Prueba con otro término de búsqueda o cambia de categoría.
            </Text>
          </View>
        ) : (
          <View style={styles.grid} className="flex-row flex-wrap justify-between px-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  categoriesBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  chipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 80,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
});
