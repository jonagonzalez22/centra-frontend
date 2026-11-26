import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type {
    FinancialIncident,
    FinancialIncidentCounters,
    FinancialIncidentFilters,
    FinancialIncidentHistory,
    FinancialIncidentPage,
    FinancialIncidentSourceType,
    IncidentUser,
} from '../interfaces/financial-incident.interface';

const params = (filters: FinancialIncidentFilters) =>
    Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
    );

const unwrap = <T>(response: ApiListResponse<T>): T => {
    if (response.status === 'error') {
        throw {
            status: 0,
            message: response.message,
            errors: response.errors ?? undefined,
        } as ApiError;
    }

    return response.data;
};

export const FinancialIncidentsService = {
    async list(filters: FinancialIncidentFilters): Promise<FinancialIncidentPage> {
        return unwrap(
            (
                await api.get<ApiListResponse<FinancialIncidentPage>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.URL,
                    { params: params(filters) }
                )
            ).data
        );
    },
    async counters(filters: FinancialIncidentFilters): Promise<FinancialIncidentCounters> {
        return unwrap(
            (
                await api.get<ApiListResponse<FinancialIncidentCounters>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.COUNTERS,
                    { params: params(filters) }
                )
            ).data
        );
    },
    async assignees(): Promise<IncidentUser[]> {
        return unwrap(
            (
                await api.get<ApiListResponse<IncidentUser[]>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.ASSIGNEES
                )
            ).data
        );
    },
    async detail(type: FinancialIncidentSourceType, id: string): Promise<FinancialIncident> {
        return unwrap(
            (
                await api.get<ApiListResponse<FinancialIncident>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.DETAIL(type, id)
                )
            ).data
        );
    },
    async history(
        type: FinancialIncidentSourceType,
        id: string
    ): Promise<FinancialIncidentHistory[]> {
        return unwrap(
            (
                await api.get<ApiListResponse<FinancialIncidentHistory[]>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.HISTORY(type, id)
                )
            ).data
        );
    },
    async startReview(
        type: FinancialIncidentSourceType,
        id: string,
        comment?: string
    ): Promise<FinancialIncident> {
        return unwrap(
            (
                await api.post<ApiListResponse<FinancialIncident>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.START_REVIEW(type, id),
                    comment ? { comment } : {}
                )
            ).data
        );
    },
    async assign(
        type: FinancialIncidentSourceType,
        id: string,
        assigned_to: string,
        comment?: string
    ): Promise<FinancialIncident> {
        return unwrap(
            (
                await api.post<ApiListResponse<FinancialIncident>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.ASSIGN(type, id),
                    { assigned_to, ...(comment ? { comment } : {}) }
                )
            ).data
        );
    },
    async comment(
        type: FinancialIncidentSourceType,
        id: string,
        comment: string
    ): Promise<FinancialIncident> {
        return unwrap(
            (
                await api.post<ApiListResponse<FinancialIncident>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.COMMENTS(type, id),
                    { comment }
                )
            ).data
        );
    },
    async resolve(
        type: FinancialIncidentSourceType,
        id: string,
        resolution_type: string,
        resolution_note: string
    ): Promise<FinancialIncident> {
        return unwrap(
            (
                await api.post<ApiListResponse<FinancialIncident>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.RESOLVE(type, id),
                    { resolution_type, resolution_note }
                )
            ).data
        );
    },
    async dismiss(
        type: FinancialIncidentSourceType,
        id: string,
        reason: string
    ): Promise<FinancialIncident> {
        return unwrap(
            (
                await api.post<ApiListResponse<FinancialIncident>>(
                    API_ENDPOINTS.STORE.FINANCIAL_INCIDENTS.DISMISS(type, id),
                    { reason }
                )
            ).data
        );
    },
};
