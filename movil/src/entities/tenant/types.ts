export type TenantPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';

export interface TenantSettings {
  maxBranches?: number;
  maxProducts?: number;
  maxUsers?: number;
  [key: string]: unknown;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  ownerName?: string | null;
  primaryColor?: string | null;
  logoUrl?: string | null;
  category?: string | null;
  domain?: string | null;
  settings?: TenantSettings | null;
}

export const TENANT_STORAGE_KEYS = {
  ACTIVE_SLUG: 'active_tenant_slug',
  ACTIVE_DATA: 'active_tenant_data',
} as const;
