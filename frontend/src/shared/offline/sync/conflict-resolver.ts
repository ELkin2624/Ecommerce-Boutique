import type { ConflictStrategy, OutboxItem } from '../types';

export interface ConflictResolutionContext {
  outboxItem: OutboxItem;
  serverStatus: number;
  serverErrorResponse?: any;
}

export interface ConflictResolutionResult {
  strategy: ConflictStrategy;
  shouldRetry: boolean;
  resolvedPayload?: any;
  userMessage: string;
}

/**
 * Resuelve colisiones y conflictos de sincronización entre el cliente offline y el servidor.
 * Sigue estrictamente la regla de negocio del proyecto: el servidor es la autoridad
 * final para inventario, precios y estados críticos de órdenes.
 */
export class ConflictResolver {
  resolve(context: ConflictResolutionContext): ConflictResolutionResult {
    const { outboxItem, serverStatus, serverErrorResponse } = context;

    // Conflicto de inventario o stock no disponible
    if (outboxItem.entity === 'order' || outboxItem.entity === 'reservation') {
      return {
        strategy: 'SERVER_WINS',
        shouldRetry: false,
        userMessage:
          serverErrorResponse?.message ||
          'El pedido u orden no pudo completarse en el servidor por cambio en inventario o estado.',
      };
    }

    // Código 409 Conflict o 412 Precondition Failed
    if (serverStatus === 409 || serverStatus === 412) {
      return {
        strategy: 'SERVER_WINS',
        shouldRetry: false,
        userMessage: 'Los datos en el servidor cambiaron mientras estabas offline.',
      };
    }

    // Errores de validación (400 / 422) no deben reintentarse infinitamente
    if (serverStatus === 400 || serverStatus === 422) {
      return {
        strategy: 'SERVER_WINS',
        shouldRetry: false,
        userMessage: serverErrorResponse?.message || 'Error de validación en la operación encolada.',
      };
    }

    // Errores temporales de red (500, 502, 503, 504, 0)
    return {
      strategy: 'LAST_WRITE_WINS',
      shouldRetry: true,
      userMessage: 'Servidor temporalmente no disponible. Se reintentará automáticamente.',
    };
  }
}

export const conflictResolver = new ConflictResolver();
