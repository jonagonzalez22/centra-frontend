export interface AccountDetails {
    bank: string | null;
    account_number: string | null;
    alias: string | null;
    cuit_rut: string | null;
    holder_name: string | null;
}

export interface StorePaymentMethod {
    id: string;
    name: string;
    code: string;
    icon: string | null;
    is_active: boolean;
    is_enabled: boolean;
    custom_name: string | null;
    requires_reference: boolean;
    account_details: AccountDetails | null;
    sort_order: number;
}

export interface UpdateStorePaymentMethodDto {
    is_enabled?: boolean;
    custom_name?: string | null;
    requires_reference?: boolean;
    account_details?: AccountDetails | null;
    sort_order?: number;
}
