export interface BusinessType {
    id: number;
    name: string;
}

export interface Plan {
    id: string;
    name: string;
}

export interface Store {
    id: string;
    name: string;
    email: string | null;
    is_active: boolean;
    inactive_reason: string | null;
    inactive_at: string | null;
    created_at: string;
    updated_at: string;
    business_type: BusinessType | null;
    plan: Plan | null;
    cuit: string;
    address: string;
    state: string;
    city: string;
    country: string;
    phone: string;
    url_logo: string | null;
}

export interface CreateStoreDto {
    name: string;
    business_type_id: number;
    cuit: string;
    address: string;
    state: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    plan_id?: string;
    is_active?: boolean;
    inactive_reason?: string;
    inactive_at?: string | null;
    url_logo?: string;
}

export type UpdateStoreDto = Partial<CreateStoreDto>;

export interface StoresListResponse {
    items: Store[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface StoresFilters {
    name?: string;
    is_active?: boolean;
    business_type_id?: number;
    plan_id?: string;
    page?: number;
    per_page?: number;
}

export interface FilterOptions {
    business_types: { id: number; name: string }[];
    plans: { id: string; name: string }[];
    is_active: { value: boolean; label: string }[];
}