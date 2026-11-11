import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppLogo } from '@/shared/ui/AppLogo';
import { BRAND_CONFIG } from '@/shared/config/brand.config';
import { useTenantStore } from '@/features/tenant/store/tenant.store';
import { TenantSwitcherModal } from '@/features/tenant/ui/TenantSwitcherModal';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showStoreSwitcher?: boolean;
  cartCount?: number;
  rightAction?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  showLogo = true,
  showStoreSwitcher = true,
  cartCount = 0,
  rightAction,
}: HeaderProps) {
  const { currentTenant } = useTenantStore();
  const [switcherVisible, setSwitcherVisible] = useState(false);

  const resolvedTitle =
    title || currentTenant?.name?.toUpperCase() || BRAND_CONFIG.name.toUpperCase();
  const resolvedSubtitle =
    subtitle || currentTenant?.category || BRAND_CONFIG.tagline;
  const storeColor = currentTenant?.primaryColor?.trim() || '#0f172a';

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
          ) : showLogo ? (
            <AppLogo size={28} withContainer={true} />
          ) : null}
          <View style={styles.titleBlock}>
            <Text style={styles.brandTitle} numberOfLines={1}>
              {resolvedTitle}
            </Text>
            {resolvedSubtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {resolvedSubtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightContainer}>
          {showStoreSwitcher && (
            <TouchableOpacity
              style={[styles.switchStorePill, { borderColor: storeColor }]}
              onPress={() => setSwitcherVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.storeDot, { backgroundColor: storeColor }]} />
              <Text style={styles.switchStoreText} numberOfLines={1}>
                {currentTenant?.name || 'Tiendas'}
              </Text>
              <Ionicons name="swap-horizontal" size={13} color="#0f172a" />
            </TouchableOpacity>
          )}

          {rightAction ? (
            rightAction
          ) : (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => router.push('/cart' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="bag-handle-outline" size={22} color="#0f172a" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TenantSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  titleBlock: {
    flex: 1,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.1,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchStorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    maxWidth: 135,
  },
  storeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  switchStoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  cartButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 99,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
});
