import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { ReconciliationService } from './reconciliation.service';

vi.mock('@/api/api.config');

const mockApi = vi.mocked(api);

describe('ReconciliationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('sends the collection rejection reason using the API command contract', async () => {
        mockApi.post = vi.fn().mockResolvedValue({
            data: {
                status: 'success',
                message: 'Cobranza rechazada exitosamente.',
                data: {
                    id: 'collection-1',
                    status: 'rejected',
                    rejection_reason: 'Monto incorrecto',
                },
                errors: null,
            },
        });

        await ReconciliationService.rejectCollection('route-1', 'collection-1', {
            reason: 'Monto incorrecto',
        });

        expect(mockApi.post).toHaveBeenCalledWith(
            API_ENDPOINTS.STORE.LOGISTICS.ROUTES.RECONCILIATION.REJECT_COLLECTION(
                'route-1',
                'collection-1'
            ),
            { reason: 'Monto incorrecto' }
        );
    });
});
