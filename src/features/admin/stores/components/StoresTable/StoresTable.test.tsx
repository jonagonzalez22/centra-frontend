import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { StoresTable } from './StoresTable';
import { StoresProvider } from '@/features/admin/stores/contexts/StoresProvider';
import type { UseStoresReturn } from '@/features/admin/stores/hooks/useStores';

const createMockStoresState = (overrides: Partial<UseStoresReturn> = {}): UseStoresReturn => ({
    stores: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: vi.fn(),
    filterOptions: null,
    filterOptionsLoading: false,
    ...overrides,
});

const renderWithProvider = (storesState: UseStoresReturn) => {
    return render(
        <MemoryRouter>
            <StoresProvider value={storesState}>
                <StoresTable />
            </StoresProvider>
        </MemoryRouter>
    );
};

describe('StoresTable', () => {
    test('renders store rows', () => {
        const storesState = createMockStoresState({
            stores: [
                {
                    id: '1',
                    name: 'Sucursal Centro',
                    email: 'centro@centra.com',
                    is_active: true,
                    inactive_reason: null,
                    inactive_at: null,
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-15T10:00:00Z',
                    business_type: { id: 1, name: 'Ferretería' },
                    plan: { id: 'plan-1', name: 'Plan Básico' },
                },
            ],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        renderWithProvider(storesState);

        expect(screen.getByText('Sucursal Centro')).toBeInTheDocument();
        expect(screen.getByText('Ferretería')).toBeInTheDocument();
        expect(screen.getByText('Plan Básico')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    test('renders table columns', () => {
        const storesState = createMockStoresState();
        renderWithProvider(storesState);

        expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Tipo de negocio' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Plan' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Fecha de creación' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Fecha de inactividad' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    });

    test('shows empty text when there are no stores', () => {
        const storesState = createMockStoresState({
            stores: [],
            pagination: { current: 1, total: 0, pageSize: 15 },
        });

        renderWithProvider(storesState);

        expect(screen.getByText('No hay tiendas para mostrar')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        const storesState = createMockStoresState({ loading: true });
        const { container } = renderWithProvider(storesState);

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });
});