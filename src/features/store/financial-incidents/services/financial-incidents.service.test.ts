import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '@/api/api.config';
import { FinancialIncidentsService } from './financial-incidents.service';

vi.mock('@/api/api.config');

const mockApi = vi.mocked(api) as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
};

const success = { status: 'success' as const, message: '', data: {}, errors: null };

describe('FinancialIncidentsService', () => {
    beforeEach(() => vi.clearAllMocks());

    test('keeps server-side filters and pagination when listing incidents', async () => {
        mockApi.get.mockResolvedValue({ data: success });

        await FinancialIncidentsService.list({
            source_type: 'cash_difference',
            status: 'detected',
            date_from: '2026-11-01',
            date_to: '2026-11-25',
            assigned_to: 'user-1',
            page: 2,
            per_page: 20,
        });

        expect(mockApi.get).toHaveBeenCalledWith('/v1/store/financial-incidents', {
            params: {
                source_type: 'cash_difference',
                status: 'detected',
                date_from: '2026-11-01',
                date_to: '2026-11-25',
                assigned_to: 'user-1',
                page: 2,
                per_page: 20,
            },
        });
    });

    test('uses the implemented management payloads without creating source operations', async () => {
        mockApi.post.mockResolvedValue({ data: success });

        await FinancialIncidentsService.startReview('cash_difference', 'cash-1');
        await FinancialIncidentsService.assign('cash_difference', 'cash-1', 'user-1');
        await FinancialIncidentsService.comment(
            'cash_difference',
            'cash-1',
            'Se revisaron comprobantes.'
        );
        await FinancialIncidentsService.resolve(
            'cash_difference',
            'cash-1',
            'confirmed_loss',
            'Faltante corroborado.'
        );
        await FinancialIncidentsService.dismiss(
            'route_collection_rejected',
            'collection-1',
            'Carga duplicada.'
        );

        expect(mockApi.post).toHaveBeenNthCalledWith(
            1,
            '/v1/store/financial-incidents/cash_difference/cash-1/start-review',
            {}
        );
        expect(mockApi.post).toHaveBeenNthCalledWith(
            2,
            '/v1/store/financial-incidents/cash_difference/cash-1/assign',
            { assigned_to: 'user-1' }
        );
        expect(mockApi.post).toHaveBeenNthCalledWith(
            3,
            '/v1/store/financial-incidents/cash_difference/cash-1/comments',
            { comment: 'Se revisaron comprobantes.' }
        );
        expect(mockApi.post).toHaveBeenNthCalledWith(
            4,
            '/v1/store/financial-incidents/cash_difference/cash-1/resolve',
            { resolution_type: 'confirmed_loss', resolution_note: 'Faltante corroborado.' }
        );
        expect(mockApi.post).toHaveBeenNthCalledWith(
            5,
            '/v1/store/financial-incidents/route_collection_rejected/collection-1/dismiss',
            { reason: 'Carga duplicada.' }
        );
    });

    test('loads only the dedicated assignees resource', async () => {
        mockApi.get.mockResolvedValue({
            data: { ...success, data: [{ id: 'user-1', name: 'Ana' }] },
        });

        await expect(FinancialIncidentsService.assignees()).resolves.toEqual([
            { id: 'user-1', name: 'Ana' },
        ]);
        expect(mockApi.get).toHaveBeenCalledWith('/v1/store/financial-incidents/assignees');
    });

    test('surfaces API error responses to React Query consumers', async () => {
        mockApi.get.mockResolvedValue({
            data: { status: 'error', message: 'No autorizado', data: null, errors: null },
        });

        await expect(FinancialIncidentsService.counters({})).rejects.toMatchObject({
            message: 'No autorizado',
        });
    });
});
