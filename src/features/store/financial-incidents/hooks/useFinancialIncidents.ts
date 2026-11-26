import { useQuery } from '@tanstack/react-query';
import { FinancialIncidentsService } from '../services/financial-incidents.service';
import type { FinancialIncidentFilters } from '../interfaces/financial-incident.interface';

export const financialIncidentKeys = {
    all: ['financial-incidents'] as const,
    list: (filters: FinancialIncidentFilters) =>
        [...financialIncidentKeys.all, 'list', filters] as const,
    counters: (filters: FinancialIncidentFilters) =>
        [...financialIncidentKeys.all, 'counters', filters] as const,
    assignees: () => [...financialIncidentKeys.all, 'assignees'] as const,
    detail: (type: string, id: string) =>
        [...financialIncidentKeys.all, 'detail', type, id] as const,
    history: (type: string, id: string) =>
        [...financialIncidentKeys.all, 'history', type, id] as const,
};

export const useFinancialIncidents = (filters: FinancialIncidentFilters) => {
    const list = useQuery({
        queryKey: financialIncidentKeys.list(filters),
        queryFn: () => FinancialIncidentsService.list(filters),
    });
    const counters = useQuery({
        queryKey: financialIncidentKeys.counters(filters),
        queryFn: () => FinancialIncidentsService.counters(filters),
    });
    return { list, counters };
};
