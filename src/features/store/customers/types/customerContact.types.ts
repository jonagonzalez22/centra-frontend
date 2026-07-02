export interface CustomerContact {
    id: string;
    customer_id: string;
    name: string;
    position: string | null;
    email: string | null;
    phone: string | null;
    is_main: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateCustomerContactDto {
    name: string;
    customer_id: string;
    position?: string | null;
    email?: string | null;
    phone?: string | null;
    is_main?: boolean;
}

export interface UpdateCustomerContactDto {
    name?: string;
    position?: string | null;
    email?: string | null;
    phone?: string | null;
    is_main?: boolean;
}
