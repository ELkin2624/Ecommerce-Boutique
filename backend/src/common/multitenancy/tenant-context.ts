import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextData {
  tenantId?: string;
  tenantSlug?: string;
  schemaName?: string;
  tenantName?: string;
  plan?: string;
}

export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<TenantContextData>();

  static run<T>(data: TenantContextData, callback: () => T): T {
    return this.storage.run(data, callback);
  }

  static get(): TenantContextData | undefined {
    return this.storage.getStore();
  }

  static getSchema(): string | undefined {
    return this.storage.getStore()?.schemaName;
  }

  static getTenantSlug(): string | undefined {
    return this.storage.getStore()?.tenantSlug;
  }

  static getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }
}
