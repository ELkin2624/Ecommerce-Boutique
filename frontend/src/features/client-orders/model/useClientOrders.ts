import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/api/axios-client';
import type { Order } from '@/shared/types/api';

export function useClientOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/orders/my');
      const data: Order[] = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setOrders(data);
    } catch (error) {
      console.error('Error al cargar pedidos del cliente:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  return {
    orders,
    isLoading,
    refreshOrders: fetchMyOrders,
  };
}
