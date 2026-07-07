export type AddressType = 'delivery' | 'billing' | 'other';

export interface CustomerAddress {
    id: string;
    customer_id: string;
    street: string;
    number: string;
    floor: string | null;
    apartment: string | null;
    postal_code: string | null;
    locality: {
        id: string;
        name: string;
        province?: {
            id: string;
            name: string;
        } | null;
    } | null;
    observations: string | null;
    type: AddressType;
    latitude: number | null;
    longitude: number | null;
    is_main: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateCustomerAddressDto {
    street: string;
    number: string;
    floor?: string | null;
    apartment?: string | null;
    postal_code: string;
    locality_id: string;
    observations?: string | null;
    type: AddressType;
    latitude?: number | null;
    longitude?: number | null;
    is_main?: boolean;
}

export interface UpdateCustomerAddressDto {
    street?: string;
    number?: string;
    floor?: string | null;
    apartment?: string | null;
    postal_code?: string;
    locality_id?: string;
    observations?: string | null;
    type?: AddressType;
    latitude?: number | null;
    longitude?: number | null;
    is_main?: boolean;
}
