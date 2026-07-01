export interface CommercialGroup {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

export interface CreateCommercialGroupDto {
    name: string;
    description?: string;
}

export type UpdateCommercialGroupDto = Partial<CreateCommercialGroupDto>;

export interface CommercialGroupsListResponse {
    items: CommercialGroup[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface CommercialGroupsFilters {
    page?: number;
    per_page?: number;
    name?: string;
}
