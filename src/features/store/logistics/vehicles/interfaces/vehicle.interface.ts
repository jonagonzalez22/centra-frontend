export type VehicleType = 'auto' | 'moto' | 'bicicleta' | 'camioneta' | 'camion';

export interface Vehicle {
    id: string;
    name: string;
    plate: string;
    type: VehicleType;
    capacity_kg: number | null;
    is_active: boolean;
    inactivation_reason: string | null;
    inactivation_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface VehiclesFilters {
    page?: number;
    per_page?: number;
    search?: string;
    type?: VehicleType;
    is_active?: boolean;
}

export interface VehiclesListResponse {
    items: Vehicle[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface VehicleDto {
    name: string;
    plate: string;
    type: VehicleType;
    capacity_kg?: number | null;
}

export interface ToggleVehicleDto {
    is_active: boolean;
    inactivation_reason?: string;
    inactivation_notes?: string;
}
