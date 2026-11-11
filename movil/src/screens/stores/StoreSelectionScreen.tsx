import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTenantStore } from '@/features/tenant/store/tenant.store';
import { TenantCard } from '@/features/tenant/ui/TenantCard';
import { TenantDirectoryHeader } from '@/features/tenant/ui/TenantDirectoryHeader';
import type { TenantInfo } from '@/entities/tenant/types';

export const StoreSelectionScreen: React.FC = () => {
  const {
    tenants,
    currentTenant,
    isLoading,
    isOfflineMode,
    fetchTenants,
    selectTenant,
  } = useTenantStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTenants();
    setRefreshing(false);
  }, [fetchTenants]);

  // Extraer categorías únicas de todas las tiendas registradas
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tenants.forEach((t) => {
      if (t.category && t.category.trim().length > 0) {
        set.add(t.category.trim());
      }
    });
    return Array.from(set);
  }, [tenants]);

  // Filtrar tiendas por búsqueda y giro comercial
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesCategory =
        !selectedCategory || (t.category && t.category.trim() === selectedCategory);

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = t.name?.toLowerCase().includes(q);
      const slugMatch = t.slug?.toLowerCase().includes(q);
      const catMatch = t.category?.toLowerCase().includes(q);
      return Boolean(nameMatch || slugMatch || catMatch);
    });
  }, [tenants, searchQuery, selectedCategory]);

  const handleSelectStore = async (tenant: TenantInfo) => {
    await selectTenant(tenant);
    router.replace('/(tabs)' as any);
  };

  const handleCloseIfActive = () => {
    if (currentTenant) {
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <TenantDirectoryHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={availableCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        totalStoresCount={tenants.length}
        hasActiveTenant={Boolean(currentTenant)}
        onCloseDirectory={handleCloseIfActive}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0f172a']}
          />
        }
      >
        {/* Banner informativo cuando las tiendas se cargan desde SQLite en Modo Offline */}
        {isOfflineMode && (
          <View style={styles.offlineBanner}>
            <View style={styles.offlineIconWrap}>
              <Ionicons name="server-outline" size={16} color="#0284c7" />
            </View>
            <View style={styles.offlineTextWrap}>
              <Text style={styles.offlineTitle}>Modo Offline Activo (SQLite Local)</Text>
              <Text style={styles.offlineSubtitle}>
                Navegando con datos locales guardados en SQLite. Puedes elegir cualquier tienda y ver su catálogo sin conexión.
              </Text>
            </View>
            <TouchableOpacity style={styles.syncMiniBtn} onPress={handleRefresh}>
              <Ionicons name="sync-outline" size={15} color="#0f172a" />
            </TouchableOpacity>
          </View>
        )}

        {isLoading && tenants.length === 0 ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.stateTitle}>Cargando directorio de tiendas...</Text>
            <Text style={styles.stateSubtitle}>
              Consultando base de datos SQLite y ecosistema de boutiques.
            </Text>
          </View>
        ) : filteredTenants.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="storefront-outline" size={48} color="#cbd5e1" />
            <Text style={styles.stateTitle}>No encontramos tiendas con ese filtro</Text>
            <Text style={styles.stateSubtitle}>
              Intenta buscar con otro nombre o muestra todas las categorías.
            </Text>
            {(searchQuery.length > 0 || selectedCategory !== null) && (
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                <Text style={styles.clearFiltersText}>Ver todas las tiendas</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.cardsList}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>
                {isOfflineMode ? 'BOUTIQUES EN SQLITE (OFFLINE)' : 'BOUTIQUES REGISTRADAS'}
              </Text>
              <Text style={styles.listHeaderCount}>
                Mostrando {filteredTenants.length} de {tenants.length}
              </Text>
            </View>

            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                isSelected={currentTenant?.slug === tenant.slug}
                onSelect={handleSelectStore}
              />
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
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 48,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  offlineIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTextWrap: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369a1',
  },
  offlineSubtitle: {
    fontSize: 11,
    color: '#0c4a6e',
    marginTop: 2,
    lineHeight: 15,
  },
  syncMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsList: {
    width: '100%',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  listHeaderCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  stateBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  clearFiltersBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
});
