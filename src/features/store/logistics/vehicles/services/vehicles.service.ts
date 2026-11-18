import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    ToggleVehicleDto,
    Vehicle,
    VehicleDto,
    VehiclesFilters,
    VehiclesListResponse,
} from '../interfaces/vehicle.interface';

const unwrap = <T>(response: ApiListResponse<T>): T => {
    if (response.status === 'error') {
        const error: ApiError = {
            status: 0,
            message: response.message,
            errors: response.errors ?? undefined,
        };
        throw error;
    }
    return response.data;
};

export const VehicleManagementService = {
    getAll: async (filters: VehiclesFilters = {}): Promise<VehiclesListResponse> => {
        const { data } = await api.get<ApiListResponse<VehiclesListResponse>>(
            API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.URL,
            { params: filters }
        );
        return unwrap(data);
    },
    getTypes: async (): Promise<Vehicle['type'][]> => {
        const { data } = await api.get<ApiListResponse<Vehicle['type'][]>>(
            API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.CATALOGS.TYPES
        );
        return unwrap(data);
    },
    getInactivationReasons: async (): Promise<string[]> => {
        const { data } = await api.get<ApiListResponse<string[]>>(
            API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.CATALOGS.REASONS
        );
        return unwrap(data);
    },
    create: async (dto: VehicleDto): Promise<Vehicle> => {
        const { data } = await api.post<ApiListResponse<Vehicle>>(
            API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.URL,
            dto
        );
        return unwrap(data);
    },
    update: async (id: string, dto: VehicleDto): Promise<Vehicle> => {
        const { data } = await api.put<ApiListResponse<Vehicle>>(
            API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.DETAIL(id),
            dto
        );
        return unwrap(data);
    },
    toggleActive: async (id: string, dto: ToggleVehicleDto): Promise<Vehicle> => {
        const { data } = await api.patch<ApiListResponse<Vehicle>>(
            API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.TOGGLE_ACTIVE(id),
            dto
        );
        return unwrap(data);
    },
    delete: async (id: string): Promise<void> => {
        const { data } = await api.delete<ApiListResponse<null>>(
            API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.DETAIL(id)
        );
        unwrap(data);
    },
};
