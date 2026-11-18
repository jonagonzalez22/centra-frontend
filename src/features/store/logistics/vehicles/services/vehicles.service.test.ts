import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { VehicleManagementService } from './vehicles.service';

vi.mock('@/api/api.config');

const success = <T>(data: T) => ({
    data: { status: 'success' as const, message: 'ok', data, errors: null },
});

describe('VehicleManagementService', () => {
    beforeEach(() => vi.clearAllMocks());

    test('loads a paginated vehicle list with its filters', async () => {
        const filters = {
            search: 'ABC',
            type: 'camioneta' as const,
            is_active: true,
            page: 1,
            per_page: 15,
        };
        const result = { items: [], total: 0, per_page: 15, current_page: 1, last_page: 1 };
        vi.mocked(api.get).mockResolvedValue(success(result));

        await expect(VehicleManagementService.getAll(filters)).resolves.toEqual(result);
        expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.URL, {
            params: filters,
        });
    });

    test('creates and toggles a vehicle through the supported endpoints', async () => {
        const vehicle = {
            id: 'vehicle-1',
            name: 'Furgón',
            plate: 'ABC123',
            type: 'camioneta',
            capacity_kg: 500,
            is_active: true,
            inactivation_reason: null,
            inactivation_notes: null,
            created_at: '',
            updated_at: '',
        };
        vi.mocked(api.post).mockResolvedValue(success(vehicle));
        vi.mocked(api.patch).mockResolvedValue(success({ ...vehicle, is_active: false }));

        await expect(
            VehicleManagementService.create({
                name: 'Furgón',
                plate: 'ABC123',
                type: 'camioneta',
                capacity_kg: 500,
            })
        ).resolves.toEqual(vehicle);
        await expect(
            VehicleManagementService.toggleActive('vehicle-1', {
                is_active: false,
                inactivation_reason: 'maintenance',
            })
        ).resolves.toMatchObject({ is_active: false });
        expect(api.post).toHaveBeenCalledWith(
            API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.URL,
            expect.any(Object)
        );
        expect(api.patch).toHaveBeenCalledWith(
            API_ENDPOINTS.STORE.LOGISTICS.VEHICLES.TOGGLE_ACTIVE('vehicle-1'),
            { is_active: false, inactivation_reason: 'maintenance' }
        );
    });
});
