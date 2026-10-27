import api from '@/api/api.config';
import { PriceListsService } from './priceLists.service';

vi.mock('@/api/api.config');

const mockApi = vi.mocked(api) as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

describe('PriceListsService', () => {
    beforeEach(() => vi.clearAllMocks());

    test('serializes filters and uses the PriceList endpoints', async () => {
        mockApi.get.mockResolvedValue({ data: { data: { items: [] } } });
        mockApi.post.mockResolvedValue({ data: { data: { id: '1' } } });
        mockApi.put.mockResolvedValue({ data: { data: { id: '1' } } });
        mockApi.delete.mockResolvedValue({});

        await PriceListsService.getAll({ search: 'Mayor', is_active: false, per_page: 100 });
        expect(mockApi.get).toHaveBeenCalledWith('/v1/store/price-lists', {
            params: { search: 'Mayor', is_active: 0, per_page: 100 },
        });

        const payload = { name: 'Mayorista', discount_percentage: '7.50', is_active: true };
        await PriceListsService.create(payload);
        await PriceListsService.update('1', payload);
        await PriceListsService.delete('1');

        expect(mockApi.post).toHaveBeenCalledWith('/v1/store/price-lists', payload);
        expect(mockApi.put).toHaveBeenCalledWith('/v1/store/price-lists/1', payload);
        expect(mockApi.delete).toHaveBeenCalledWith('/v1/store/price-lists/1');
    });
});
