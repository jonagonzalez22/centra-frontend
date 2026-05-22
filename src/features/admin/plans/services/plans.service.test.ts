import { describe, expect, test, beforeEach, vi } from 'vitest';
import api from '@/api/api.config';
import { PlansService } from './plans.service';

vi.mock('@/api/api.config');

type MockApi = {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

const mockApi = vi.mocked(api) as unknown as MockApi;

const mockPlan = {
    id: '1',
    name: 'Plan Básico',
    description: 'Plan de entrada',
    price: 9900,
    billing_cycle: 'monthly' as const,
    is_trial: false,
    is_active: true,
    features: [
        { id: 'f1', code: 'pos', name: 'Punto de Venta', limit_value: null },
        { id: 'f2', code: 'inventory', name: 'Inventario', limit_value: 100 },
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
};

const mockSuccessResponse = {
    status: 'success' as const,
    message: 'Listado de planes obtenido correctamente.',
    data: {
        items: [mockPlan],
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

describe('PlansService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAll', () => {
        test('returns plans list on success', async () => {
            mockApi.get.mockResolvedValue({ data: mockSuccessResponse });

            const result = await PlansService.getAll();

            expect(result).toEqual(mockSuccessResponse.data);
            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/plans');
        });

        test('throws error on API error status', async () => {
            mockApi.get.mockResolvedValue({ data: mockErrorResponse });

            await expect(PlansService.getAll()).rejects.toThrow('No autorizado');
        });

        test('throws error on network error', async () => {
            mockApi.get.mockRejectedValue(new Error('Network error'));

            await expect(PlansService.getAll()).rejects.toThrow('Network error');
        });
    });

    describe('getById', () => {
        test('returns plan on success', async () => {
            const planResponse = {
                status: 'success' as const,
                message: 'Plan obtenido correctamente.',
                data: mockPlan,
                errors: null,
            };
            mockApi.get.mockResolvedValue({ data: planResponse });

            const result = await PlansService.getById('1');

            expect(result).toEqual(planResponse.data);
            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/plans/1');
        });

        test('throws error on API error status', async () => {
            mockApi.get.mockResolvedValue({ data: mockErrorResponse });

            await expect(PlansService.getById('1')).rejects.toThrow('No autorizado');
        });
    });

    describe('create', () => {
        test('returns created plan on success', async () => {
            const createResponse = {
                status: 'success' as const,
                message: 'Plan creado correctamente.',
                data: mockPlan,
                errors: null,
            };
            mockApi.post.mockResolvedValue({ data: createResponse });

            const result = await PlansService.create({
                name: 'Nuevo Plan',
                description: 'Descripción',
                price: 1500,
                billing_cycle: 'monthly',
                is_trial: false,
                is_active: true,
            });

            expect(result).toEqual(createResponse.data);
            expect(mockApi.post).toHaveBeenCalledWith('/v1/admin/plans', {
                name: 'Nuevo Plan',
                description: 'Descripción',
                price: 1500,
                billing_cycle: 'monthly',
                is_trial: false,
                is_active: true,
            });
        });

        test('throws error on API error status', async () => {
            mockApi.post.mockResolvedValue({ data: mockErrorResponse });

            await expect(
                PlansService.create({
                    name: 'Nuevo Plan',
                    description: 'Descripción',
                    price: 1500,
                    billing_cycle: 'monthly',
                    is_trial: false,
                    is_active: true,
                })
            ).rejects.toThrow('No autorizado');
        });
    });

    describe('update', () => {
        test('returns updated plan on success', async () => {
            const updateResponse = {
                status: 'success' as const,
                message: 'Plan actualizado correctamente.',
                data: { ...mockPlan, name: 'Plan Actualizado' },
                errors: null,
            };
            mockApi.put.mockResolvedValue({ data: updateResponse });

            const result = await PlansService.update('1', { name: 'Plan Actualizado' });

            expect(result).toEqual(updateResponse.data);
            expect(mockApi.put).toHaveBeenCalledWith('/v1/admin/plans/1', {
                name: 'Plan Actualizado',
            });
        });

        test('throws error on API error status', async () => {
            mockApi.put.mockResolvedValue({ data: mockErrorResponse });

            await expect(
                PlansService.update('1', { name: 'Plan Actualizado' })
            ).rejects.toThrow('No autorizado');
        });
    });

    describe('delete', () => {
        test('resolves on success', async () => {
            const deleteResponse = {
                status: 'success' as const,
                message: 'Plan eliminado correctamente.',
                data: null,
                errors: null,
            };
            mockApi.delete.mockResolvedValue({ data: deleteResponse });

            await expect(PlansService.delete('1')).resolves.toBeUndefined();
            expect(mockApi.delete).toHaveBeenCalledWith('/v1/admin/plans/1');
        });

        test('throws error on API error status', async () => {
            mockApi.delete.mockResolvedValue({ data: mockErrorResponse });

            await expect(PlansService.delete('1')).rejects.toThrow('No autorizado');
        });
    });

    describe('syncFeatures', () => {
        test('resolves on success', async () => {
            const syncResponse = {
                status: 'success' as const,
                message: 'Funcionalidades sincronizadas correctamente.',
                data: null,
                errors: null,
            };
            mockApi.post.mockResolvedValue({ data: syncResponse });

            await expect(
                PlansService.syncFeatures('1', {
                    features: [{ feature_id: 'f1', limit_value: 5 }],
                })
            ).resolves.toBeUndefined();
            expect(mockApi.post).toHaveBeenCalledWith(
                '/v1/admin/plans/1/sync-features',
                { features: [{ feature_id: 'f1', limit_value: 5 }] }
            );
        });

        test('throws error on API error status', async () => {
            mockApi.post.mockResolvedValue({ data: mockErrorResponse });

            await expect(
                PlansService.syncFeatures('1', {
                    features: [{ feature_id: 'f1', limit_value: null }],
                })
            ).rejects.toThrow('No autorizado');
        });
    });
});
