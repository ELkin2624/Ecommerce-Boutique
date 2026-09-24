import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  cartCount?: number;
  rightAction?: React.ReactNode;
}

export function Header({
  title = 'BOUTIQUE MODA',
  subtitle = 'Colección 2026',
  showBack = false,
  cartCount = 0,
  rightAction,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.brandTitle}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.rightContainer}>
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
    gap: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
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
    gap: 10,
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
