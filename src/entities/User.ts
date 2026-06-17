export type UserRole = 'SUPER_ADMIN' | 'STORE_ADMIN' | 'BACKOFFICE_USER';
export type FeatureCode =
    | 'pos'
    | 'inventory'
    | 'reports'
    | 'deliveries'
    | 'route_mapping'
    | 'messaging'
    | 'multi_user'
    | 'stores';

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
    permissions: string[];
    features: FeatureFlag[];
}
