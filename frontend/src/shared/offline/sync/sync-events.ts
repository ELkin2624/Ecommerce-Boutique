import type { OutboxItem } from '../types';

export type SyncEventType =
  | 'sync:start'
  | 'sync:progress'
  | 'sync:complete'
  | 'sync:error'
  | 'network:change';

export interface SyncProgressPayload {
  processed: number;
  total: number;
  currentItem?: OutboxItem;
}

type SyncEventHandler<T = any> = (payload: T) => void;

/**
 * Event Emitter ultra liviano y tipado para eventos del motor de sincronización.
 * No requiere paquetes externos y no bloquea el hilo principal.
 */
class SyncEventEmitter {
  private listeners: Map<SyncEventType, Set<SyncEventHandler>> = new Map();

  on<T = any>(event: SyncEventType, handler: SyncEventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Retorna función de desuscripción limpia para React useEffect
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit<T = any>(event: SyncEventType, payload: T): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    // Ejecuta asíncronamente para no bloquear el loop de eventos
    queueMicrotask(() => {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[SyncEventEmitter] Error en listener para evento ${event}:`, err);
        }
      });
    });
  }

  removeAll(event?: SyncEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const syncEvents = new SyncEventEmitter();
