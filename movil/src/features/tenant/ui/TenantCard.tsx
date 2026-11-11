import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TenantInfo } from '@/entities/tenant/types';

interface TenantCardProps {
  tenant: TenantInfo;
  isSelected?: boolean;
  onSelect: (tenant: TenantInfo) => void;
}

const PLAN_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  ENTERPRISE: { label: 'ENTERPRISE', bg: '#f3e8ff', text: '#6b21a8' },
  PRO: { label: 'PRO BOUTIQUE', bg: '#e0f2fe', text: '#0369a1' },
  STARTER: { label: 'BOUTIQUE', bg: '#f1f5f9', text: '#475569' },
};

export const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  isSelected = false,
  onSelect,
}) => {
  const brandColor = tenant.primaryColor?.trim() || '#0f172a';
  const initial = (tenant.name?.trim()?.[0] || 'B').toUpperCase();
  const planMeta = PLAN_LABELS[tenant.plan] || PLAN_LABELS.STARTER;
  const categoryLabel = tenant.category?.trim() || 'Moda & Alta Costura';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        isSelected && { borderColor: brandColor },
      ]}
      activeOpacity={0.86}
      onPress={() => onSelect(tenant)}
    >
      {/* Franja superior con color de identidad de la tienda */}
      <View style={[styles.accentStripe, { backgroundColor: brandColor }]} />

      <View style={styles.cardBody}>
        {/* Fila Principal: Monograma/Logo + Nombre y Categoría + Plan */}
        <View style={styles.topRow}>
          <View style={[styles.avatarBox, { backgroundColor: brandColor }]}>
            {tenant.logoUrl ? (
              <Image
                source={{ uri: tenant.logoUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>

          <View style={styles.titleContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.storeName} numberOfLines={1}>
                {tenant.name}
              </Text>
              <Ionicons name="checkmark-circle" size={15} color="#059669" />
            </View>
            <Text style={styles.categoryText} numberOfLines={1}>
              {categoryLabel}
            </Text>
          </View>

          <View style={[styles.planBadge, { backgroundColor: planMeta.bg }]}>
            <Text style={[styles.planBadgeText, { color: planMeta.text }]}>
              {planMeta.label}
            </Text>
          </View>
        </View>

        {/* Etiquetas informativas de la tienda */}
        <View style={styles.tagsRow}>
          <View style={styles.metaChip}>
            <Ionicons name="globe-outline" size={12} color="#64748b" />
            <Text style={styles.metaChipText} numberOfLines={1}>
              {tenant.domain || `${tenant.slug}.fashionstore.app`}
            </Text>
          </View>

          <View style={styles.metaChip}>
            <Ionicons name="sparkles-outline" size={12} color="#64748b" />
            <Text style={styles.metaChipText}>Catálogo & Probador IA</Text>
          </View>
        </View>

        {/* Pie de Tarjeta: Estado activo y botón de acción */}
        <View style={styles.footerRow}>
          {isSelected ? (
            <View style={styles.activeStatusPill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeStatusText}>Tienda Seleccionada</Text>
            </View>
          ) : (
            <View style={styles.statusRow}>
              <Ionicons name="storefront-outline" size={14} color="#64748b" />
              <Text style={styles.statusText}>Tienda Oficial Activa</Text>
            </View>
          )}

          <View
            style={[
              styles.enterBtn,
              isSelected ? { backgroundColor: brandColor } : styles.enterBtnDefault,
            ]}
          >
            <Text style={styles.enterBtnText}>
              {isSelected ? 'Continuar Aquí' : 'Ver Prendas'}
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#ffffff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: '#f8fafc',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  accentStripe: {
    height: 5,
    width: '100%',
  },
  cardBody: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  storeName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  enterBtnDefault: {
    backgroundColor: '#0f172a',
  },
  enterBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
