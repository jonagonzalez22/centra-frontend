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

    it('loads purchase price history for one product on demand', async () => {
        const history = [{
            supplier: { id: 'supplier-1', business_name: 'Distribuidora Norte' },
            prices: [{ purchase_id: 'purchase-1', purchase_number: 'OC-000042', date: '2026-10-18 10:00:00', unit_price: '12000.00' }],
        }];
        vi.mocked(api.get).mockResolvedValue({
            data: {
                status: 'success',
                message: 'ok',
                data: history,
                errors: null,
            },
        });

        await expect(ProductsService.getPurchasePriceHistory('product-1')).resolves.toEqual(history);
        expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.STORE.PRODUCTS.PURCHASE_PRICE_HISTORY('product-1'));
    });
});
