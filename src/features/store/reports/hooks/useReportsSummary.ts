import { useQuery } from '@tanstack/react-query';
import { ReportsService } from '../services/reports.service';
import type { ReportsSummaryParams } from '../interfaces/reports.interface';
import { useAuthStore } from '@/store/useAuthStore.store';
import { getSessionStoreId } from '@/security/sessionContext';

export const useReportsSummary = (params: ReportsSummaryParams) => {
    const user = useAuthStore((state) => state.user);

    return useQuery({
        queryKey: [
            'reports',
            'summary',
            user?.id,
            user ? getSessionStoreId(user) : null,
            params.date_from,
            params.date_to,
        ],
        queryFn: () => ReportsService.getSummary(params),
        enabled: !!user,
    });
};
