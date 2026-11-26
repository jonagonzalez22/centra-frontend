import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, test, vi } from 'vitest';
import { FinancialIncidentsPage } from './FinancialIncidentsPage';
import type { FinancialIncident } from '@/features/store/financial-incidents/interfaces/financial-incident.interface';

const queryState = {
    list: {
        data: {
            items: [] as FinancialIncident[],
            total: 0,
            per_page: 20,
            current_page: 1,
            last_page: 1,
        },
        isLoading: false,
        isError: false,
    },
    counters: { data: { detected: 0, in_review: 0, resolved: 0, dismissed: 0 } },
};

vi.mock('@/features/store/financial-incidents/hooks/useFinancialIncidents', () => ({
    financialIncidentKeys: {
        all: ['financial-incidents'],
        detail: vi.fn(),
        history: vi.fn(),
        assignees: vi.fn(),
    },
    useFinancialIncidents: vi.fn(() => queryState),
}));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => false }) }));

describe('FinancialIncidentsPage', () => {
    test('uses labelled CENTRA filters and the empty state without active filters', () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={client}>
                <FinancialIncidentsPage />
            </QueryClientProvider>
        );

        expect(screen.getByText('Fecha desde')).toBeInTheDocument();
        expect(screen.getByText('Fecha hasta')).toBeInTheDocument();
        expect(screen.getAllByText('Tipo').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Estado').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
        expect(
            screen.getAllByText('No hay incidencias financieras registradas.').length
        ).toBeGreaterThan(0);
    });

    test('renders the visual detail action with the Eye icon label', () => {
        queryState.list.data.items = [
            {
                source_type: 'cash_difference',
                source_id: 'cash-1',
                status: 'detected',
                amount: '2000.00',
                source_difference: '-2000.00',
                occurred_at: '2026-11-25T15:58:00+00:00',
                assigned_to: null,
                reference: { cash_session_id: 'cash-1' },
                source_summary: {},
                tracking: null,
            },
        ];
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={client}>
                <FinancialIncidentsPage />
            </QueryClientProvider>
        );

        expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument();
        queryState.list.data.items = [];
    });
});
