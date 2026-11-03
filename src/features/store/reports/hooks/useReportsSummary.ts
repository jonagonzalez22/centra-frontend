import { useQuery } from '@tanstack/react-query';
import { ReportsService } from '../services/reports.service';
import type { ReportsSummaryParams } from '../interfaces/reports.interface';

export const useReportsSummary = (params: ReportsSummaryParams) =>
    useQuery({
        queryKey: ['reports', 'summary', params.date_from, params.date_to],
        queryFn: () => ReportsService.getSummary(params),
    });
