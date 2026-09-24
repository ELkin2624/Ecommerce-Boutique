import { useLocalSearchParams } from 'expo-router';
import { ProductDetailScreen } from '@/screens/product/ProductDetailScreen';

export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductDetailScreen id={id || ''} />;
}
