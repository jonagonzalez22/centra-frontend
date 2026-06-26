import type { User } from '@/entities/User';

export interface UsersListResponse {
    items: User[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface UsersFilters {
    store_id?: string;
    name?: string;
    role?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    store_id?: string | null;
    is_active?: boolean;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    role?: string;
    store_id?: string | null;
    is_active?: boolean;
}

export interface UsersFilterOptions {
    roles: { id: number; name: string }[];
    stores: { id: string; name: string }[];
}