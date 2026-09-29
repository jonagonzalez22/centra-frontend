import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { ProductsService } from './products.service';

vi.mock('@/api/api.config');

describe('ProductsService measurement units', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads the global active measurement unit catalog', async () => {
        const units = [
            { id: 'unit-id', code: 'unit', name: 'Unidad', symbol: 'u', category: 'unit' },
            { id: 'kg-id', code: 'kg', name: 'Kilogramo', symbol: 'kg', category: 'weight' },
        ];
        vi.mocked(api.get).mockResolvedValue({
            data: {
                status: 'success',
                message: 'ok',
                data: units,
                errors: null,
            },
        });

        await expect(ProductsService.getMeasurementUnits()).resolves.toEqual(units);
        expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.STORE.MEASUREMENT_UNITS.URL);
    });
});
