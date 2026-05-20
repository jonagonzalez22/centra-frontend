import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UserSearchBar } from './UserSearchBar';
import { UsersProvider } from '../../contexts/UsersProvider';
import type { UseUsersReturn } from '../../hooks/useUsers';

const createMockUsersState = (overrides: Partial<UseUsersReturn> = {}): UseUsersReturn => ({
    users: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: vi.fn(),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    filterOptions: null,
    filterOptionsLoading: false,
    ...overrides,
});

const renderWithProvider = (usersState: UseUsersReturn) => {
    return render(
        <MemoryRouter>
            <UsersProvider value={usersState}>
                <UserSearchBar />
            </UsersProvider>
        </MemoryRouter>
    );
};

describe('UserSearchBar', () => {
    test('renders all filter controls', () => {
        const usersState = createMockUsersState();
        renderWithProvider(usersState);

        expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
        expect(screen.getByText('Rol')).toBeInTheDocument();
        expect(screen.getByText('Tienda')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
    });

    test('renders filter options from API when available', () => {
        const usersState = createMockUsersState({
            filterOptions: {
                roles: [
                    { id: 1, name: 'SUPER_ADMIN' },
                    { id: 2, name: 'STORE_ADMIN' },
                    { id: 3, name: 'BACKOFFICE_USER' },
                ],
                stores: [
                    { id: '1', name: 'Ferretería Central' },
                    { id: '2', name: 'Supermercado Norte' },
                ],
            },
        });
        renderWithProvider(usersState);

        expect(screen.getByText('Rol')).toBeInTheDocument();
        expect(screen.getByText('Tienda')).toBeInTheDocument();
    });

    test('calls refetch with filters after 500ms debounce when typing', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        const user = userEvent.setup();
        const refetch = vi.fn();
        const usersState = createMockUsersState({
            refetch,
            filterOptions: {
                roles: [{ id: 1, name: 'SUPER_ADMIN' }],
                stores: [{ id: '1', name: 'Ferretería Central' }],
            },
        });

        renderWithProvider(usersState);

        await user.type(screen.getByLabelText('Nombre'), 'Juan Pérez');
        await vi.advanceTimersByTimeAsync(500);

        expect(refetch).toHaveBeenCalledTimes(1);
        expect(refetch).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Juan Pérez',
            })
        );

        vi.useRealTimers();
    });

    test('debounces multiple rapid keystrokes into a single refetch call', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        const user = userEvent.setup();
        const refetch = vi.fn();
        const usersState = createMockUsersState({ refetch });

        renderWithProvider(usersState);

        await user.type(screen.getByLabelText('Nombre'), 'Test');
        await vi.advanceTimersByTimeAsync(400);

        expect(refetch).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(100);

        expect(refetch).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    test('calls refetch with empty filters after debounce when clearing filter', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        const user = userEvent.setup();
        const refetch = vi.fn();
        const usersState = createMockUsersState({ refetch });

        renderWithProvider(usersState);

        await user.type(screen.getByLabelText('Nombre'), 'Juan');
        await vi.advanceTimersByTimeAsync(500);
        refetch.mockClear();

        await user.clear(screen.getByLabelText('Nombre'));
        await vi.advanceTimersByTimeAsync(500);

        expect(refetch).toHaveBeenCalledTimes(1);
        expect(refetch).toHaveBeenCalledWith({});

        vi.useRealTimers();
    });

    test('calls refetch with empty filters when reset button is clicked', async () => {
        const user = userEvent.setup();
        const refetch = vi.fn();
        const usersState = createMockUsersState({ refetch });

        renderWithProvider(usersState);

        await user.type(screen.getByLabelText('Nombre'), 'Juan Pérez');
        await user.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(refetch).toHaveBeenCalledWith({});
    });

    test('disables all controls when filterOptionsLoading is true', () => {
        const usersState = createMockUsersState({ filterOptionsLoading: true });

        renderWithProvider(usersState);

        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
    });

    test('disables limpiar button when no filters are active', () => {
        const usersState = createMockUsersState();

        renderWithProvider(usersState);

        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
    });

    test('enables limpiar button when name filter is filled', async () => {
        const user = userEvent.setup();
        const usersState = createMockUsersState();

        renderWithProvider(usersState);

        await user.type(screen.getByLabelText('Nombre'), 'Test');

        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeEnabled();
    });
});