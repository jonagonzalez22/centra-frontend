export type UserRole = 'SUPER_ADMIN' | 'STORE_ADMIN';
export type FeatureCode =
    | 'pos'
    | 'inventory'
    | 'reports'
    | 'deliveries'
    | 'route_mapping'
    | 'messaging'
    | 'multi_user';

export interface User {
    id: number;
    name: string;
    email: string;
    store_id: number | null;
    roles: UserRole[];
    permissions: string[];
    features: FeatureCode[];
}
