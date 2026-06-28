import type { User } from '@/entities/User';

export interface StoreUsersListResponse {
    items: User[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface StoreUsersFilters {
    name?: string;
    email?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
}

export interface CreateStoreUserDto {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    is_active?: boolean;
}

export interface UpdateStoreUserDto {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    role?: string;
    is_active?: boolean;
}

export interface StoreUsersFilterOptions {
    roles: { id: number; name: string }[];
}

export interface PermissionCatalogGroupItem {
    name: string;
    label: string;
}

export interface PermissionCatalogResponse {
    groups: Record<string, PermissionCatalogGroupItem[]>;
}

export type PermissionCatalog = Record<string, PermissionCatalogGroupItem[]>;

export interface SyncPermissionsDto {
    permissions: string[];
}

export interface UserPermissionsResponse {
    permissions: string[];
}
