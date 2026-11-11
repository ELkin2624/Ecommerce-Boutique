import { ImageSourcePropType } from 'react-native';

// 1x1 transparent PNG data URI para evitar advertencias de source.uri vacío en <Image />
export const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * Valida y normaliza una URL de imagen real de la base de datos, evitando
 * strings vacíos que causan el error "WARN source.uri should not be an empty string".
 * Si no hay imagen disponible, retorna un pixel transparente o null.
 */
export function getSafeImageUri(uri?: string | null): string {
  if (uri && typeof uri === 'string' && uri.trim().length > 0) {
    return uri.trim();
  }
  return TRANSPARENT_PIXEL;
}

/**
 * Retorna un objeto ImageSource seguro para componentes <Image source={...} />
 */
export function getSafeImageSource(
  uri?: string | null,
): ImageSourcePropType {
  return { uri: getSafeImageUri(uri) };
}
