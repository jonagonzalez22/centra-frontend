export interface DocumentType {
    id: string;
    code: string;
    name: string;
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
    status: 'active' | 'inactive';
    has_location: boolean;
    blocked_at: string | null;
    notes: string | null;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateCustomerDto {
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    document_type_id: string;
    document_number: string;
    status: 'active' | 'inactive';
    notes: string | null;
}

export interface UpdateCustomerDto {
    display_name?: string;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    document_type_id?: string;
    document_number?: string;
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
    search?: string;
    search_mode?: 'identity';
    page?: number;
    per_page?: number;
    status?: 'active' | 'inactive';
    location_status?: 'all' | 'with_location' | 'without_location';
}
