import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { StoresTable } from './StoresTable';
import { StoresProvider } from '@/features/admin/stores/contexts/StoresProvider';
import type { UseStoresReturn } from '@/features/admin/stores/hooks/useStores';
import type { Store } from '@/features/admin/stores/types/store.types';

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

const renderWithProvider = (storesState: UseStoresReturn, onEdit: (store: Store) => void) => {
    return render(
        <MemoryRouter>
            <StoresProvider value={storesState}>
                <StoresTable onEdit={onEdit} />
            </StoresProvider>
        </MemoryRouter>
    );
};

describe('StoresTable', () => {
    test('renders store rows', () => {
        const mockStore = {
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
            cuit: '20123456789',
            address: 'Calle 123',
            state: 'Buenos Aires',
            city: 'CABA',
            country: 'Argentina',
            phone: '+541123456789',
            url_logo: null,
        };

        const storesState = createMockStoresState({
            stores: [mockStore],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        renderWithProvider(storesState, vi.fn());

        expect(screen.getByText('Sucursal Centro')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    test('renders table columns', () => {
        const storesState = createMockStoresState();
        renderWithProvider(storesState, vi.fn());

        expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    });

    test('shows empty text when there are no stores', () => {
        const storesState = createMockStoresState({
            stores: [],
            pagination: { current: 1, total: 0, pageSize: 15 },
        });

        renderWithProvider(storesState, vi.fn());

        expect(screen.getByText('No hay tiendas para mostrar')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        const storesState = createMockStoresState({ loading: true });
        const { container } = renderWithProvider(storesState, vi.fn());

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });
});