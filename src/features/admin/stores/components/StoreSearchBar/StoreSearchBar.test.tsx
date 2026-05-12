import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { StoreSearchBar } from './StoreSearchBar';
import { StoresProvider } from '@/features/admin/stores/contexts/StoresProvider';
import type { UseStoresReturn } from '@/features/admin/stores/hooks/useStores';

const createMockStoresState = (overrides: Partial<UseStoresReturn> = {}): UseStoresReturn => ({
    stores: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: vi.fn(),
    ...overrides,
});

const renderWithProvider = (storesState: UseStoresReturn) => {
    return render(
        <MemoryRouter>
            <StoresProvider value={storesState}>
                <StoreSearchBar />
            </StoresProvider>
        </MemoryRouter>
    );
};

describe('StoreSearchBar', () => {
    test('renders search controls', () => {
        const storesState = createMockStoresState();
        renderWithProvider(storesState);

        expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
        expect(screen.getAllByText('Estado').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Filtrar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
    });

    test('does not call refetch when filtering without any filters', async () => {
        const user = userEvent.setup();
        const refetch = vi.fn();
        const storesState = createMockStoresState({ refetch });

        renderWithProvider(storesState);

        await user.click(screen.getByRole('button', { name: 'Filtrar' }));

        expect(refetch).not.toHaveBeenCalled();
    });

    test('calls refetch with filters when form is submitted with name filter', async () => {
        const user = userEvent.setup();
        const refetch = vi.fn();
        const storesState = createMockStoresState({ refetch });

        renderWithProvider(storesState);

        await user.type(screen.getByLabelText('Nombre'), 'Sucursal Centro');
        await user.click(screen.getByRole('button', { name: 'Filtrar' }));

        expect(refetch).toHaveBeenCalledWith({ name: 'Sucursal Centro', is_active: undefined });
    });

    test('calls refetch with empty filters when reset button is clicked', async () => {
        const user = userEvent.setup();
        const refetch = vi.fn();
        const storesState = createMockStoresState({ refetch });

        renderWithProvider(storesState);

        await user.type(screen.getByLabelText('Nombre'), 'Sucursal Centro');
        await user.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(refetch).toHaveBeenCalledWith({});
    });

    test('disables buttons when loading is true', () => {
        const storesState = createMockStoresState({ loading: true });

        renderWithProvider(storesState);

        expect(screen.getByRole('button', { name: 'Filtrar' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
    });

    test('disables limpiar button when no filters are active', () => {
        const storesState = createMockStoresState();

        renderWithProvider(storesState);

        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
    });

    test('enables limpiar button when name filter is filled', async () => {
        const user = userEvent.setup();
        const storesState = createMockStoresState();

        renderWithProvider(storesState);

        await user.type(screen.getByLabelText('Nombre'), 'Test');

        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeEnabled();
    });
});