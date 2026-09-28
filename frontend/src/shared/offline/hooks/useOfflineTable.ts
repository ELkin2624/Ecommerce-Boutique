import { useState, useEffect } from 'react';
import { liveQuery } from 'dexie';

/**
 * Hook para ejecutar consultas reactivas en tiempo real sobre la base de datos local IndexedDB.
 * Se actualiza automáticamente cuando cualquier mutación local o sincronización modifica la tabla.
 */
export function useOfflineTable<T>(
  querier: () => Promise<T> | T,
  deps: any[] = [],
): { data: T | undefined; isLoading: boolean; error: Error | null } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const observable = liveQuery(querier);

    const subscription = observable.subscribe({
      next: (val) => {
        setData(val);
        setIsLoading(false);
      },
      error: (err) => {
        console.error('[useOfflineTable] Error en consulta reactiva:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error };
}
