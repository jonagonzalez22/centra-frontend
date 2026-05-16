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
    page?: number;
    per_page?: number;
}