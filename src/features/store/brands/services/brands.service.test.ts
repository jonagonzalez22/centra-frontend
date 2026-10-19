import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '@/api/api.config';
import { BrandsService } from './brands.service';

vi.mock('@/api/api.config');

const mockApi = vi.mocked(api) as unknown as { get: ReturnType<typeof vi.fn> };
const response = { data: { status: 'success', data: { items: [] } } };

describe('BrandsService', () => {
    beforeEach(() => vi.clearAllMocks());

    test('serializes active boolean filters as 1 and 0', async () => {
        mockApi.get.mockResolvedValue(response);

        await BrandsService.getAll({ per_page: 100, is_active: true });
        expect(mockApi.get).toHaveBeenLastCalledWith('/v1/store/brands', { params: { per_page: 100, is_active: 1 } });

        await BrandsService.getAll({ is_active: false });
        expect(mockApi.get).toHaveBeenLastCalledWith('/v1/store/brands', { params: { is_active: 0 } });
    });
});
