import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Promotion } from '../types';

const { width } = Dimensions.get('window');

interface PromoBannerProps {
  promotions: Promotion[];
  onSelectPromo?: (promo: Promotion) => void;
}

export function PromoBanner({
  promotions,
  onSelectPromo,
}: PromoBannerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!promotions || promotions.length === 0) {
    return null;
  }

  const handleCopy = (promo: Promotion) => {
    setCopiedId(promo.id);
    onSelectPromo?.(promo);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={16} color="#d97706" />
          <Text style={styles.sectionTitle}>Promociones & Cupones</Text>
        </View>
        <Text style={styles.badgeHint}>Toca para copiar</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {promotions.map((promo) => (
          <TouchableOpacity
            key={promo.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => handleCopy(promo)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {Number(promo.discountPercent)}% OFF
                </Text>
              </View>
              <Text style={styles.dates}>
                Vence {new Date(promo.endDate).toLocaleDateString('es-BO', { month: 'short', day: 'numeric' })}
              </Text>
            </View>

            <Text style={styles.promoName} numberOfLines={1}>
              {promo.name}
            </Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{promo.code}</Text>
              <Ionicons
                name={copiedId === promo.id ? 'checkmark-circle' : 'copy-outline'}
                size={14}
                color={copiedId === promo.id ? '#059669' : '#4f46e5'}
              />
            </View>

            {promo.minPurchaseAmount && Number(promo.minPurchaseAmount) > 0 ? (
              <Text style={styles.minPurchase}>
                Mínimo {Number(promo.minPurchaseAmount)} BOB
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  badgeHint: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: width * 0.72,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  discountBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  dates: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  promoName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  codeText: {
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 12,
    color: '#4f46e5',
    letterSpacing: 1,
  },
  minPurchase: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 6,
  },
});
