/**
 * Selected Garment Hook
 * FashionStore Virtual Try-On - Catalog & Cart Integration
 *
 * Manages active garment selection and loading state with support for:
 * - Local AR presets (jacket-navy-sport, hoodie-grey-sport, etc.)
 * - Catalog products from backend/store
 * - User's shopping cart items
 */

import { useState, useCallback, useEffect } from 'react';
import type { GarmentStatus, VirtualGarment } from '../types/garment.types';
import { DEFAULT_GARMENT, getGarmentById } from '../data/garmentAssets';
import {
  resolveGarmentIdentifier,
  type MatchableProduct,
} from '../utils/garmentMatcher';
import { useCartStore } from '@/features/cart/model/useCartStore';

export interface UseSelectedGarmentReturn {
  readonly selectedGarment: VirtualGarment;
  readonly garmentStatus: GarmentStatus;
  readonly selectGarmentById: (id: string) => boolean;
  readonly selectGarment: (garment: VirtualGarment) => void;
}

export function useSelectedGarment(
  initialGarmentOrId?: VirtualGarment | string,
  catalogProducts: readonly MatchableProduct[] = []
): UseSelectedGarmentReturn {
  const resolveInitial = (): VirtualGarment => {
    if (!initialGarmentOrId) return DEFAULT_GARMENT;
    if (typeof initialGarmentOrId !== 'string') {
      return initialGarmentOrId;
    }
    const cartItems = useCartStore.getState().items;
    const resolved = resolveGarmentIdentifier(
      initialGarmentOrId,
      catalogProducts,
      cartItems
    );
    return resolved ?? getGarmentById(initialGarmentOrId) ?? DEFAULT_GARMENT;
  };

  const [selectedGarment, setSelectedGarment] = useState<VirtualGarment>(resolveInitial);
  const [garmentStatus, setGarmentStatus] = useState<GarmentStatus>('GARMENT_READY');

  const selectGarment = useCallback((garment: VirtualGarment) => {
    setSelectedGarment(garment);
    setGarmentStatus('GARMENT_READY');
  }, []);

  const selectGarmentById = useCallback(
    (id: string): boolean => {
      const cartItems = useCartStore.getState().items;
      const found = resolveGarmentIdentifier(id, catalogProducts, cartItems);

      if (found) {
        setSelectedGarment(found);
        setGarmentStatus('GARMENT_READY');
        return true;
      }

      const fallback = getGarmentById(id);
      if (fallback) {
        setSelectedGarment(fallback);
        setGarmentStatus('GARMENT_READY');
        return true;
      }

      setGarmentStatus('GARMENT_ERROR');
      return false;
    },
    [catalogProducts]
  );

  // If initial ID couldn't be resolved immediately (e.g. catalog was loading),
  // re-attempt resolution once catalog products are loaded.
  useEffect(() => {
    if (typeof initialGarmentOrId === 'string' && catalogProducts.length > 0) {
      const cartItems = useCartStore.getState().items;
      const found = resolveGarmentIdentifier(initialGarmentOrId, catalogProducts, cartItems);
      if (found && found.id !== selectedGarment.id) {
        setSelectedGarment(found);
        setGarmentStatus('GARMENT_READY');
      }
    }
  }, [initialGarmentOrId, catalogProducts]);

  return {
    selectedGarment,
    garmentStatus,
    selectGarmentById,
    selectGarment,
  };
}
