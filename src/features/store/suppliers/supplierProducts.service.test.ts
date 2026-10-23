import api from '@/api/api.config';
import { SupplierProductsService } from './supplierProducts.service';

vi.mock('@/api/api.config', () => ({ default: { get: vi.fn() } }));

describe('SupplierProductsService', () => {
    it('sends the candidates association flag as Laravel-compatible 1', async () => {
        vi.mocked(api.get).mockResolvedValue({ data: { data: { items: [] } } });

        await SupplierProductsService.getCandidates('supplier-1', {
            include_associated: 1,
            page: 1,
            per_page: 20,
        });

        expect(api.get).toHaveBeenCalledWith('/v1/store/suppliers/supplier-1/products/candidates', {
            params: { include_associated: 1, page: 1, per_page: 20 },
        });
    });
});
