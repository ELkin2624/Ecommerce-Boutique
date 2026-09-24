import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { BoutiquePalette } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  className,
}: ButtonProps) {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryBtn;
      case 'outline':
        return styles.outlineBtn;
      case 'danger':
        return styles.dangerBtn;
      default:
        return styles.primaryBtn;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      className={className}
      style={[
        styles.baseBtn,
        getContainerStyle(),
        size === 'sm' && styles.smBtn,
        size === 'lg' && styles.lgBtn,
        disabled && styles.disabledBtn,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? BoutiquePalette.men.navy : '#ffffff'}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.baseText,
              getTextStyle(),
              size === 'sm' && styles.smText,
              size === 'lg' && styles.lgText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 18,
    gap: 8,
  },
  smBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  lgBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  primaryBtn: {
    backgroundColor: BoutiquePalette.men.navy,
    shadowColor: BoutiquePalette.men.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  secondaryBtn: {
    backgroundColor: BoutiquePalette.men.surface,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: BoutiquePalette.men.navy,
  },
  dangerBtn: {
    backgroundColor: '#ef4444',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  smText: {
    fontSize: 12,
  },
  lgText: {
    fontSize: 16,
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: BoutiquePalette.men.navy,
  },
  outlineText: {
    color: BoutiquePalette.men.navy,
  },
});
