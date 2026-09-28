import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { BRAND_CONFIG } from '@/shared/config/brand.config';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface AppLogoProps {
  /** Tamaño del logo: 'xs' (24), 'sm' (36), 'md' (48), 'lg' (72), 'xl' (96) o número personalizado */
  size?: LogoSize;
  /** Si debe mostrar el nombre y subtítulo */
  showText?: boolean;
  /** Disposición horizontal o vertical */
  layout?: 'horizontal' | 'vertical';
  /** Título de marca (por defecto BRAND_CONFIG.name) */
  title?: string;
  /** Subtítulo descriptivo */
  subtitle?: string;
  /** Contenedor circular con fondo y borde */
  withContainer?: boolean;
  /** Color personalizado del texto del título */
  titleColor?: string;
  /** Color personalizado del texto del subtítulo */
  subtitleColor?: string;
  /** Estilos adicionales para el contenedor principal */
  style?: StyleProp<ViewStyle>;
  /** Estilos adicionales para la imagen */
  imageStyle?: StyleProp<ImageStyle>;
  /** Fuente personalizada del logo (por defecto BRAND_CONFIG.logo.source) */
  source?: any;
}

const PRESET_SIZES: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 72,
  xl: 96,
};

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = false,
  layout = 'horizontal',
  title = BRAND_CONFIG.name,
  subtitle,
  withContainer = false,
  titleColor,
  subtitleColor,
  style,
  imageStyle,
  source = BRAND_CONFIG.logo.source,
}) => {
  const dimension = typeof size === 'number' ? size : PRESET_SIZES[size] || 48;
  const isVertical = layout === 'vertical';

  const logoNode = (
    <View
      style={[
        styles.imageWrap,
        withContainer && [
          styles.containerBox,
          {
            width: dimension + 16,
            height: dimension + 16,
            borderRadius: (dimension + 16) / 2,
          },
        ],
      ]}
    >
      <Image
        source={source}
        style={[
          {
            width: dimension,
            height: dimension,
          },
          imageStyle,
        ]}
        contentFit="contain"
        transition={200}
      />
    </View>
  );

  if (!showText) {
    return <View style={[styles.inlineRow, style]}>{logoNode}</View>;
  }

  const titleFontSize = Math.max(12, Math.min(22, dimension * 0.35));
  const subtitleFontSize = Math.max(9, Math.min(13, dimension * 0.22));

  return (
    <View
      style={[
        isVertical ? styles.verticalContainer : styles.horizontalContainer,
        style,
      ]}
    >
      {logoNode}
      <View style={[styles.textContainer, isVertical && styles.centerText]}>
        <Text
          style={[
            styles.titleText,
            { fontSize: titleFontSize },
            titleColor ? { color: titleColor } : null,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle !== undefined ? (
          subtitle ? (
            <Text
              style={[
                styles.subtitleText,
                { fontSize: subtitleFontSize },
                subtitleColor ? { color: subtitleColor } : null,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null
        ) : (
          <Text
            style={[
              styles.subtitleText,
              { fontSize: subtitleFontSize },
              subtitleColor ? { color: subtitleColor } : null,
            ]}
            numberOfLines={1}
          >
            {BRAND_CONFIG.subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inlineRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verticalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textContainer: {
    justifyContent: 'center',
  },
  centerText: {
    alignItems: 'center',
  },
  titleText: {
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
});
