export interface DocumentType {
    id: string;
    code: string;
    name: string;
}

export interface CustomerCommercialGroup {
    id: string;
    store_id: string;
    name: string;
    description: string | null;
    settings: unknown;
    created_at: string;
    updated_at: string;
}

export interface Customer {
    id: string;
    customer_code: string;
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    document_type: DocumentType;
    document_number: string;
    commercial_group: CustomerCommercialGroup | null;
    status: 'active' | 'inactive';
    blocked_at: string | null;
    notes: string | null;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface UpdateCustomerDto {
    display_name?: string;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    document_type_id?: string;
    document_number?: string;
    commercial_group_id?: string | null;
    status?: 'active' | 'inactive';
    notes?: string | null;
}

export interface CustomersListResponse {
    items: Customer[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface CustomersFilters {
    search_text?: string;
    page?: number;
    per_page?: number;
    status?: 'active' | 'inactive';
    commercial_group_id?: string;
}
