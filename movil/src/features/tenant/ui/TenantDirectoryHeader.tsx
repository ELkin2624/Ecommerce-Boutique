import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppLogo } from '@/shared/ui/AppLogo';
import { BRAND_CONFIG } from '@/shared/config/brand.config';

interface TenantDirectoryHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  totalStoresCount: number;
  hasActiveTenant: boolean;
  onCloseDirectory?: () => void;
}

export const TenantDirectoryHeader: React.FC<TenantDirectoryHeaderProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  totalStoresCount,
  hasActiveTenant,
  onCloseDirectory,
}) => {
  return (
    <View style={styles.container}>
      {/* Barra superior con identidad de marca y botón de cierre si ya tenía tienda */}
      <View style={styles.topBar}>
        <AppLogo
          size="md"
          layout="horizontal"
          showText
          title={BRAND_CONFIG.name}
          subtitle="ECOSISTEMA MULTI-BOUTIQUE"
        />

        {hasActiveTenant && onCloseDirectory && (
          <TouchableOpacity
            style={styles.backToStoreBtn}
            onPress={onCloseDirectory}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={18} color="#0f172a" />
            <Text style={styles.backToStoreText}>Volver</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hero de bienvenida al Mall Virtual */}
      <View style={styles.heroCard}>
        <View style={styles.badgeRow}>
          <View style={styles.mallBadge}>
            <Ionicons name="storefront" size={12} color="#38bdf8" />
            <Text style={styles.mallBadgeText}>
              {totalStoresCount} {totalStoresCount === 1 ? 'TIENDA DISPONIBLE' : 'TIENDAS DISPONIBLES'}
            </Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Elige tu Boutique Favorita</Text>
        <Text style={styles.heroSubtitle}>
          Selecciona una tienda para explorar su catálogo exclusivo, precios, stock por sucursal y probador virtual con IA.
        </Text>

        {/* Buscador de Tiendas */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tienda por nombre o especialidad..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={17} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtro rápido por giro o categoría de boutique */}
      {categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
          style={styles.categoriesWrapper}
        >
          <TouchableOpacity
            style={[styles.chip, selectedCategory === null && styles.chipActive]}
            onPress={() => onSelectCategory(null)}
          >
            <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>
              Todas ({totalStoresCount})
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onSelectCategory(cat)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backToStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  backToStoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mallBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  categoriesWrapper: {
    marginTop: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    fontWeight: '700',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
