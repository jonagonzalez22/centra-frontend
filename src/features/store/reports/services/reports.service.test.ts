import api from '@/api/api.config';
import { ReportsService } from './reports.service';

vi.mock('@/api/api.config');

const mockApi = vi.mocked(api) as unknown as { get: ReturnType<typeof vi.fn> };

describe('ReportsService', () => {
    it('solicita el resumen con las fechas de calendario elegidas', async () => {
        mockApi.get.mockResolvedValue({
            data: { status: 'success', data: { period: {}, metrics: {}, current: {} } },
        });

        await ReportsService.getSummary({ date_from: '2026-11-01', date_to: '2026-11-30' });

        expect(mockApi.get).toHaveBeenCalledWith('/v1/store/reports/summary', {
            params: { date_from: '2026-11-01', date_to: '2026-11-30' },
        });
    });

    it('solicita analytics separadamente con las fechas de calendario elegidas', async () => {
        mockApi.get.mockResolvedValue({
            data: { status: 'success', data: { period: {}, economic_series: [], orders_series: [] } },
        });

        await ReportsService.getAnalytics({ date_from: '2026-11-01', date_to: '2026-11-30' });

        expect(mockApi.get).toHaveBeenCalledWith('/v1/store/reports/analytics', {
            params: { date_from: '2026-11-01', date_to: '2026-11-30' },
        });
    });
});
