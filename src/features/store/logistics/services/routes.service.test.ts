import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { RoutesService } from './routes.service';

vi.mock('@/api/api.config');

describe('RoutesService', () => {
    test('sends independent route filter parameters to the paginated endpoint', async () => {
        const filters = {
            route_number: 'A1B2C3D4',
            from: '2026-11-01',
            to: '2026-11-10',
            driver_id: 'driver-1',
            status: 'planned' as const,
            page: 1,
            per_page: 15,
        };
        vi.mocked(api.get).mockResolvedValue({
            data: {
                status: 'success',
                message: 'ok',
                data: { items: [], total: 0, per_page: 15, current_page: 1, last_page: 1 },
                errors: null,
            },
        });

        await expect(RoutesService.getAll(filters)).resolves.toMatchObject({ items: [] });
        expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.STORE.LOGISTICS.ROUTES.URL, {
            params: filters,
        });
    });
});
