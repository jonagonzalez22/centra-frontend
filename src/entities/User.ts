export type UserRole = 'SUPER_ADMIN' | 'STORE_ADMIN' | 'BACKOFFICE_USER' | 'STORE_USER';
export type FeatureCode =
    | 'pos'
    | 'inventory'
    | 'reports'
    | 'deliveries'
    | 'route_mapping'
    | 'messaging'
    | 'multi_user'
    | 'stores'
    | 'categories'
    | 'customers'
    | 'cash';

export interface FeatureFlag {
    code: FeatureCode;
    limit: number | null;
}

export interface Store {
    id: string;
    name: string;
    business_type: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    store_id: number | null;
    store: Store | null;
    roles: UserRole[];
    is_active: boolean;
    permissions: string[];
    features: FeatureFlag[];
    cash_session?: CashSession | null;
    created_at?: string;
}

import type { CashSession } from './CashSession';
