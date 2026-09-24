import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'primary',
  style,
  textStyle,
}: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'warning':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'destructive':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      case 'secondary':
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
      default:
        return { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' };
    }
  };

  const colors = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
