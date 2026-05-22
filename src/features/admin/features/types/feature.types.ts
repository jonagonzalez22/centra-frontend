export interface Feature {
    id: string;
    code: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateFeatureDto {
    code: string;
    name: string;
    description?: string;
}

export type UpdateFeatureDto = Partial<CreateFeatureDto>;

export interface FeaturesListResponse {
    items: Feature[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface FeaturesFilters {
    page?: number;
    per_page?: number;
    code?: string;
    name?: string;
    has_plans?: string;
}