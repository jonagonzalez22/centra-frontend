import { useQuery } from '@tanstack/react-query';
import type { ReportsAnalyticsParams } from '../interfaces/reports.interface';
import { ReportsService } from '../services/reports.service';

export const useReportsAnalytics = (params: ReportsAnalyticsParams) =>
    useQuery({
        queryKey: ['reports', 'analytics', params.date_from, params.date_to],
        queryFn: () => ReportsService.getAnalytics(params),
    });
