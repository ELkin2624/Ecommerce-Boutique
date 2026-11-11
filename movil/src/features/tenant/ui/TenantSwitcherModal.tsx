import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTenantStore } from '../store/tenant.store';
import type { TenantInfo } from '@/entities/tenant/types';

interface TenantSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TenantSwitcherModal: React.FC<TenantSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const { currentTenant, tenants, isLoading, isOfflineMode, fetchTenants, selectTenant } =
    useTenantStore();

  useEffect(() => {
    if (visible) {
      fetchTenants();
    }
  }, [visible, fetchTenants]);

  const handleChooseTenant = async (tenant: TenantInfo) => {
    await selectTenant(tenant);
    onClose();
  };

  const handleOpenFullDirectory = () => {
    onClose();
    router.push('/stores' as any);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Cabecera del Modal */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Cambiar de Tienda</Text>
              <Text style={styles.subtitle}>
                {isOfflineMode
                  ? 'Modo Offline (SQLite) • Elige una boutique local'
                  : 'Elige otra boutique para ver sus prendas y catálogo'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Lista rápida de tiendas */}
          {isLoading && tenants.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0f172a" />
              <Text style={styles.loadingText}>Cargando tiendas registradas...</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
            >
              {tenants.map((tenant) => {
                const isCurrent = currentTenant?.slug === tenant.slug;
                const accent = tenant.primaryColor?.trim() || '#0f172a';
                const initial = (tenant.name?.trim()?.[0] || 'B').toUpperCase();

                return (
                  <TouchableOpacity
                    key={tenant.id}
                    style={[
                      styles.storeItem,
                      isCurrent && styles.storeItemActive,
                      isCurrent && { borderColor: accent },
                    ]}
                    onPress={() => handleChooseTenant(tenant)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.monogram, { backgroundColor: accent }]}>
                      <Text style={styles.monogramText}>{initial}</Text>
                    </View>

                    <View style={styles.storeInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.storeName} numberOfLines={1}>
                          {tenant.name}
                        </Text>
                        <View style={styles.planPill}>
                          <Text style={styles.planPillText}>{tenant.plan}</Text>
                        </View>
                      </View>
                      <Text style={styles.storeCategory} numberOfLines={1}>
                        {tenant.category || 'Moda & Boutique'} • {tenant.slug}
                      </Text>
                    </View>

                    {isCurrent ? (
                      <View style={styles.activeBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#059669" />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Botón para ir a la vista de pantalla completa de todas las tiendas */}
          <TouchableOpacity
            style={styles.directoryBtn}
            onPress={handleOpenFullDirectory}
            activeOpacity={0.85}
          >
            <Ionicons name="grid-outline" size={17} color="#ffffff" />
            <Text style={styles.directoryBtnText}>
              Ver Pantalla Completa de Tiendas ({tenants.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  listScroll: {
    marginTop: 12,
  },
  listContent: {
    gap: 10,
    paddingBottom: 8,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  storeItemActive: {
    backgroundColor: '#ffffff',
  },
  monogram: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  planPill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  planPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#334155',
  },
  storeCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  activeBadge: {
    marginLeft: 4,
  },
  directoryBtn: {
    marginTop: 14,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directoryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
