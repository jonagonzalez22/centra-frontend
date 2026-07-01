export interface Customer {
    id: number;
    code: string;
    display_name: string;
    document_type: string;
    document_number: string;
    commercial_group_id: string | null;
    commercial_group_name: string | null;
    status: 'active' | 'inactive';
    created_at: string;
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
