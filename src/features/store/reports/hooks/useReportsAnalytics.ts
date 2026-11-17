import { useQuery } from '@tanstack/react-query';
import type { ReportsAnalyticsParams } from '../interfaces/reports.interface';
import { ReportsService } from '../services/reports.service';
import { useAuthStore } from '@/store/useAuthStore.store';
import { getSessionStoreId } from '@/security/sessionContext';

export const useReportsAnalytics = (params: ReportsAnalyticsParams) => {
    const user = useAuthStore((state) => state.user);

    return useQuery({
        queryKey: [
            'reports',
            'analytics',
            user?.id,
            user ? getSessionStoreId(user) : null,
            params.date_from,
            params.date_to,
        ],
        queryFn: () => ReportsService.getAnalytics(params),
        enabled: !!user,
    });
};
