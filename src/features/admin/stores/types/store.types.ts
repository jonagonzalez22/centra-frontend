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
}

export interface CreateStoreDto {
    name: string;
    email?: string;
    is_active: boolean;
}

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