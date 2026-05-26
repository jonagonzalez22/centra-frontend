import { describe, expect, test, beforeEach, vi } from 'vitest';
import api from '@/api/api.config';
import { DashboardService } from './dashboard.service';

vi.mock('@/api/api.config');

type MockApi = {
    get: ReturnType<typeof vi.fn>;
};

const mockApi = vi.mocked(api) as unknown as MockApi;

const mockSuccessResponse = {
    status: 'success' as const,
    message: 'Datos del dashboard obtenidos correctamente.',
    data: {
        metrics: {
            total_stores: 11,
            total_users: 6,
            estimated_mrr: 90,
            active_plans_count: 2,
        },
        charts: {
            stores_by_plan: [
                { plan_name: 'Beta (Piloto)', store_count: 1 },
                { plan_name: 'Esencial', store_count: 9 },
            ],
            stores_by_business_type: [
                { business_type_name: 'Articulos de limpieza', store_count: 5 },
                { business_type_name: 'Ferretería', store_count: 5 },
            ],
            growth_last_6_months: [
                { month: '2026-04', store_count: 1 },
                { month: '2026-05', store_count: 10 },
            ],
        },
        recent_activity: {
            latest_stores: [
                {
                    id: 'a8112713-5987-493b-a259-19c414db4503',
                    name: 'Limplieza Clorín',
                    created_at: '2026-05-14T19:25:59+00:00',
                },
            ],
        },
    },
    errors: null,
};

const mockErrorResponse = {
    status: 'error' as const,
    message: 'Error al obtener datos del dashboard',
    data: null,
    errors: null,
};

describe('DashboardService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        test('returns dashboard stats on success', async () => {
            mockApi.get.mockResolvedValue({ data: mockSuccessResponse });

            const result = await DashboardService.getDashboardStats();

            expect(result).toEqual(mockSuccessResponse.data);
            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/dashboard');
        });

        test('throws error on API error status', async () => {
            mockApi.get.mockResolvedValue({ data: mockErrorResponse });

            await expect(DashboardService.getDashboardStats()).rejects.toThrow(
                'Error al obtener datos del dashboard'
            );
        });

        test('throws error on network error', async () => {
            mockApi.get.mockRejectedValue(new Error('Network error'));

            await expect(DashboardService.getDashboardStats()).rejects.toThrow('Network error');
        });
    });
});