export interface Category {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
}

export interface CreateCategoryDto {
    name: string;
    description?: string;
    is_active?: boolean;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export interface CategoriesListResponse {
    items: Category[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface CategoriesFilters {
    page?: number;
    per_page?: number;
    name?: string;
    is_active?: boolean;
}