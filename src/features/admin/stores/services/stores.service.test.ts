import { describe, expect, test, beforeEach, vi } from 'vitest';
import api from '@/api/api.config';
import { StoresService } from './stores.service';

vi.mock('@/api/api.config');

type MockApi = {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
};

const mockApi = vi.mocked(api) as unknown as MockApi;

const mockSuccessResponse = {
    status: 'success' as const,
    message: 'Listado de tiendas obtenido correctamente.',
    data: {
        items: [
            {
                id: '1',
                name: 'Sucursal Centro',
                email: 'centro@centra.com',
                is_active: true,
                inactive_reason: null,
                inactive_at: null,
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T10:00:00Z',
                business_type: { id: 1, name: 'Ferretería' },
                plan: { id: 'plan-1', name: 'Plan Básico' },
            },
        ],
        total: 1,
        per_page: 15,
        current_page: 1,
        last_page: 1,
    },
    errors: null,
};

const mockErrorResponse = {
    status: 'error' as const,
    message: 'No autorizado',
    data: null,
    errors: null,
};

describe('StoresService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getStores', () => {
        test('returns stores list on success', async () => {
            mockApi.get.mockResolvedValue({ data: mockSuccessResponse });

            const result = await StoresService.getStores({ page: 1 });

            expect(result).toEqual(mockSuccessResponse.data);
            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/stores', {
                params: { page: 1 },
            });
        });

        test('passes filters to API', async () => {
            mockApi.get.mockResolvedValue({ data: mockSuccessResponse });

            await StoresService.getStores({ name: 'Sucursal', is_active: true });

            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/stores', {
                params: { name: 'Sucursal', is_active: true },
            });
        });

        test('throws error on API error status', async () => {
            mockApi.get.mockResolvedValue({ data: mockErrorResponse });

            await expect(StoresService.getStores({})).rejects.toThrow('No autorizado');
        });

        test('throws error on network error', async () => {
            mockApi.get.mockRejectedValue(new Error('Network error'));

            await expect(StoresService.getStores({})).rejects.toThrow('Network error');
        });
    });

    describe('getById', () => {
        test('returns store on success', async () => {
            const storeResponse = {
                status: 'success' as const,
                message: 'Tienda obtenida correctamente.',
                data: mockSuccessResponse.data.items[0],
                errors: null,
            };
            mockApi.get.mockResolvedValue({ data: storeResponse });

            const result = await StoresService.getById('1');

            expect(result).toEqual(storeResponse.data);
            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/stores/1');
        });

        test('throws error on API error status', async () => {
            mockApi.get.mockResolvedValue({ data: mockErrorResponse });

            await expect(StoresService.getById('1')).rejects.toThrow('No autorizado');
        });
    });

    describe('create', () => {
        test('returns created store on success', async () => {
            const createResponse = {
                status: 'success' as const,
                message: 'Tienda creada correctamente.',
                data: mockSuccessResponse.data.items[0],
                errors: null,
            };
            mockApi.post.mockResolvedValue({ data: createResponse });

            const result = await StoresService.create({
                name: 'Nueva Tienda',
                is_active: true,
            });

            expect(result).toEqual(createResponse.data);
            expect(mockApi.post).toHaveBeenCalledWith('/v1/admin/stores', {
                name: 'Nueva Tienda',
                is_active: true,
            });
        });

        test('throws error on API error status', async () => {
            mockApi.post.mockResolvedValue({ data: mockErrorResponse });

            await expect(
                StoresService.create({ name: 'Nueva Tienda', is_active: true })
            ).rejects.toThrow('No autorizado');
        });
    });

    describe('getFilterOptions', () => {
        test('returns filter options on success', async () => {
            const filterOptionsResponse = {
                status: 'success' as const,
                message: 'Opciones de filtro obtenidas correctamente.',
                data: {
                    business_types: [{ id: 1, name: 'Ferretería' }],
                    plans: [{ id: 'plan-1', name: 'Plan Básico' }],
                    is_active: [
                        { value: true, label: 'Activo' },
                        { value: false, label: 'Inactivo' },
                    ],
                },
                errors: null,
            };
            mockApi.get.mockResolvedValue({ data: filterOptionsResponse });

            const result = await StoresService.getFilterOptions();

            expect(result).toEqual(filterOptionsResponse.data);
            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/stores/filter-options');
        });

        test('throws error on API error status', async () => {
            mockApi.get.mockResolvedValue({ data: mockErrorResponse });

            await expect(StoresService.getFilterOptions()).rejects.toThrow('No autorizado');
        });

        test('throws error on network error', async () => {
            mockApi.get.mockRejectedValue(new Error('Network error'));

            await expect(StoresService.getFilterOptions()).rejects.toThrow('Network error');
        });
    });
});