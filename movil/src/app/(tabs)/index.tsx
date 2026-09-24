import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/shared/ui/Header';
import { PromoBanner } from '@/entities/promotion/ui/PromoBanner';
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { useCatalog } from '@/features/catalog/hooks/useCatalog';
import { useCartStore } from '@/features/cart/model/useCartStore';

export default function HomeScreen() {
  const { products, categories, promotions, loading, selectedCategory, setSelectedCategory, refetch } =
    useCatalog();
  const { totalCount, applyPromotion } = useCartStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header cartCount={totalCount} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} colors={['#0f172a']} />
        }
      >
        {/* Banner de Promociones y Cupones Activos */}
        <PromoBanner
          promotions={promotions}
          onSelectPromo={(promo) => applyPromotion(promo)}
        />
        {/* Banner de Venta al Por Mayor */}
        <View style={styles.wholesaleBanner}>
          <View style={styles.wholesaleIcon}>
            <Ionicons name="pricetags" size={20} color="#059669" />
          </View>
          <View style={styles.wholesaleTextContainer}>
            <Text style={styles.wholesaleTitle}>Precios al por Mayor Habilitados</Text>
            <Text style={styles.wholesaleSubtitle}>
              Lleva 6 o más prendas y obtén automáticamente precios de distribuidor
            </Text>
          </View>
        </View>

        {/* Filtros de Categoría Rápida */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <TouchableOpacity onPress={() => router.push('/catalog' as any)}>
              <Text style={styles.viewAllText}>Ver catálogo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === null && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === null && styles.categoryChipTextActive,
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Listado de Prendas */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Novedades de Temporada</Text>
            <Text style={styles.productsCount}>{products.length} prendas</Text>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0f172a" />
              <Text style={styles.loaderText}>Cargando colección...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="shirt-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No hay prendas disponibles en esta categoría</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  fittingCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  fittingTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0e7ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#4338ca',
    letterSpacing: 0.5,
  },
  fittingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  fittingSubtitle: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  fittingIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wholesaleBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  wholesaleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wholesaleTextContainer: {
    flex: 1,
  },
  wholesaleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  wholesaleSubtitle: {
    fontSize: 10,
    color: '#047857',
    marginTop: 2,
    lineHeight: 14,
  },
  categoriesSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
  },
  productsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#f1f5f9',
  },
  categoryChipActive: {
    backgroundColor: '#0f172a',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  productsSection: {
    marginTop: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
});
