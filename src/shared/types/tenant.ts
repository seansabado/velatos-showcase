// src/shared/types/tenant.ts
// Fake type definitions for multi-tenant domain

export type UserRole =
  | 'cashier'
  | 'senior_cashier'
  | 'branch_manager'
  | 'area_manager'
  | 'super_admin';

export type AuthClaims = {
  uid: string;
  tenantId: string;
  role: UserRole;
  branchId: string;
};

export type CallableContext = {
  auth?: {
    uid: string;
    token: Record<string, unknown>;
  };
};

export type TenantFeatures = {
  rmaEnabled: boolean;
  webAuthnEnabled: boolean;
  offlineMode: boolean;
  analyticsExport: boolean;
};

export type BranchRef = {
  id: string;
  label: string;                   // e.g. "渋谷店"
  geofenceRadiusMeters: number;
};

export type TenantConfig = {
  tenantId: string;
  displayName: string;             // e.g. "Acme Boutique Co., Ltd."
  locale: 'ja' | 'en';
  timezone: string;                // e.g. "Asia/Tokyo"
  currency: 'JPY' | 'USD';
  features: TenantFeatures;
  branches: BranchRef[];
  createdAt: string;
  plan: 'starter' | 'professional' | 'enterprise';
};
