export type UserRole = 'SUPER_ADMIN' | 'STORE_ADMIN';

export interface User {
    id: number;
    name: string;
    email: string;
    store_id: number | null;
    roles: UserRole[];
    permissions: string[];
}
