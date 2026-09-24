import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageStyle,
  StyleProp,
  ImageResizeMode,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProductImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  productName?: string;
  iconSize?: number;
  showText?: boolean;
  altText?: string;
}

/**
 * Componente que renderiza la imagen real de la base de datos de la prenda.
 * Si la prenda no tiene fotografía o la URL no carga, despliega un placeholder
 * elegante y minimalista estilo Nike / Adidas ("IMAGEN NO DISPONIBLE").
 */
export function ProductImage({
  uri,
  style,
  resizeMode = 'cover',
  productName,
  iconSize = 32,
  showText = true,
  altText = 'IMAGEN NO DISPONIBLE',
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  const cleanUri = uri && typeof uri === 'string' ? uri.trim() : '';
  const isAvailable = Boolean(cleanUri && cleanUri.length > 0 && !hasError);

  if (!isAvailable) {
    return (
      <View style={[styles.placeholderContainer, style]}>
        <View style={styles.iconCircle}>
          <Ionicons name="shirt-outline" size={iconSize} color="#94a3b8" />
        </View>
        {showText && (
          <View style={styles.textContainer}>
            <Text style={styles.placeholderTitle}>{altText}</Text>
            {productName ? (
              <Text style={styles.productNameSnippet} numberOfLines={1}>
                {productName}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: cleanUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  iconCircle: {
    width: '40%',
    aspectRatio: 1,
    maxWidth: 56,
    maxHeight: 56,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  placeholderTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  productNameSnippet: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
