import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    ReportsAnalytics,
    ReportsAnalyticsParams,
    ReportsSummary,
    ReportsSummaryParams,
} from '../interfaces/reports.interface';

export const ReportsService = {
    async getSummary(params: ReportsSummaryParams): Promise<ReportsSummary> {
        const { data } = await api.get<ApiListResponse<ReportsSummary>>(
            API_ENDPOINTS.STORE.REPORTS.SUMMARY.URL,
            { params }
        );

        if (data.status === 'error') {
            const error: ApiError = {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            };
            throw error;
        }

        return data.data;
    },

    async getAnalytics(params: ReportsAnalyticsParams): Promise<ReportsAnalytics> {
        const { data } = await api.get<ApiListResponse<ReportsAnalytics>>(
            API_ENDPOINTS.STORE.REPORTS.ANALYTICS.URL,
            { params }
        );

        if (data.status === 'error') {
            throw {
                status: 0,
                message: data.message,
                errors: data.errors ?? undefined,
            } satisfies ApiError;
        }

        return data.data;
    },
};
