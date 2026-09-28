import { syncEvents } from '../sync/sync-events';
import { syncEngine } from '../sync/sync-engine';
import type { NetworkState } from '../types';

/**
 * Monitor de conectividad de red con validación activa de alcance al servidor.
 * Detecta transiciones online/offline y despierta automáticamente el motor de sincronización.
 */
export class NetworkMonitor {
  private state: NetworkState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isServerReachable: true,
    lastCheckedAt: Date.now(),
  };

  private pingUrl = '/api/v1';
  private checkIntervalRef: any = null;
  private isChecking = false;

  constructor() {
    this.initListeners();
  }

  private initListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.handleConnectivityChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleConnectivityChange(false);
    });
  }

  /**
   * Obtiene una copia del estado actual de la red.
   */
  getState(): NetworkState {
    return { ...this.state };
  }

  /**
   * Verifica activamente si el servidor responde (evita falsos positivos de Wi-Fi sin internet).
   */
  async checkServerReachable(timeoutMs = 2500): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState(false, false);
      return false;
    }

    if (this.isChecking) return this.state.isServerReachable;
    this.isChecking = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();

    try {
      // Ping ultraliviano con método HEAD / GET para no consumir ancho de banda
      const response = await fetch(this.pingUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      const latencyMs = Date.now() - start;
      const isReachable = response.status < 500; // 200, 401, 404 indican que el servidor está vivo

      this.updateState(true, isReachable, latencyMs);
      return isReachable;
    } catch {
      // Si la petición fue abortada o falló
      this.updateState(navigator.onLine, false);
      return false;
    } finally {
      clearTimeout(timeoutId);
      this.isChecking = false;
    }
  }

  private handleConnectivityChange(isOnline: boolean): void {
    if (!isOnline) {
      this.updateState(false, false);
    } else {
      // Al volver la red, comprobar alcance al servidor y disparar sincronización
      this.checkServerReachable().then((reachable) => {
        if (reachable) {
          console.log('[NetworkMonitor] Conexión restablecida con el servidor. Iniciando sincronización...');
          syncEngine.syncNow();
        }
      });
    }
  }

  private updateState(isOnline: boolean, isServerReachable: boolean, latencyMs?: number): void {
    const hasChanged =
      this.state.isOnline !== isOnline || this.state.isServerReachable !== isServerReachable;

    this.state = {
      isOnline,
      isServerReachable,
      lastCheckedAt: Date.now(),
      latencyMs: latencyMs ?? this.state.latencyMs,
    };

    if (hasChanged) {
      syncEvents.emit('network:change', this.state);
    }
  }

  /**
   * Inicia sondeo periódico pasivo (opcional, con cadencia baja para no agotar batería)
   */
  startHeartbeat(intervalMs = 60000): void {
    if (this.checkIntervalRef) clearInterval(this.checkIntervalRef);
    this.checkIntervalRef = setInterval(() => {
      this.checkServerReachable();
    }, intervalMs);
  }

  stopHeartbeat(): void {
    if (this.checkIntervalRef) {
      clearInterval(this.checkIntervalRef);
      this.checkIntervalRef = null;
    }
  }
}

export const networkMonitor = new NetworkMonitor();
