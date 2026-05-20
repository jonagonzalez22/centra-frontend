export interface BusinessType {
    id: number;
    name: string;
    description: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface CreateBusinessTypeDto {
    name: string;
    description?: string;
    status?: 'active' | 'inactive';
}

export type UpdateBusinessTypeDto = Partial<CreateBusinessTypeDto>;

export interface BusinessTypesListResponse {
    items: BusinessType[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface BusinessTypesFilters {
    page?: number;
    per_page?: number;
    name?: string;
    status?: string;
}
