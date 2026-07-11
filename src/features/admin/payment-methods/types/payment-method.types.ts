export interface PaymentMethod {
    id: string;
    name: string;
    code: string;
    icon?: string;
    is_active: boolean;
}

export interface CreatePaymentMethodDto {
    name: string;
    code: string;
    icon?: string;
    is_active?: boolean;
}

export type UpdatePaymentMethodDto = Partial<CreatePaymentMethodDto>;

export interface PaymentMethodsListResponse {
    items: PaymentMethod[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface PaymentMethodsFilters {
    page?: number;
    per_page?: number;
    name?: string;
    code?: string;
    is_active?: boolean;
}
