import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { StoreUsersTable } from './StoreUsersTable';
import { StoreUsersProvider } from '../../contexts/StoreUsersProvider';
import type { UseStoreUsersReturn } from '../../hooks/useStoreUsers';
import type { User } from '@/entities/User';

const createMockUsersState = (overrides: Partial<UseStoreUsersReturn> = {}): UseStoreUsersReturn => ({
    users: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: vi.fn(),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    toggleActive: vi.fn().mockResolvedValue(undefined),
    filterOptions: null,
    filterOptionsLoading: false,
    ...overrides,
});

const renderWithProvider = (
    usersState: UseStoreUsersReturn,
    onEdit: (user: User) => void,
    onDelete: (id: number) => Promise<void>,
    onToggleActive: (id: number, isActive: boolean) => Promise<void>
) => {
    return render(
        <MemoryRouter>
            <StoreUsersProvider value={usersState}>
                <StoreUsersTable onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} />
            </StoreUsersProvider>
        </MemoryRouter>
    );
};

const mockUser: User = {
    id: 1,
    is_active: true,
    name: 'Juan Pérez',
    email: 'juan@centra.com',
    store_id: null,
    store: null,
    roles: ['STORE_USER'],
    permissions: ['store_users.view'],
    features: [{ code: 'multi_user', limit: null }],
};

describe('StoreUsersTable', () => {
    test('renders user rows', () => {
        const usersState = createMockUsersState({
            users: [mockUser],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        renderWithProvider(usersState, vi.fn(), vi.fn(), vi.fn());

        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('juan@centra.com')).toBeInTheDocument();
        expect(screen.getByText('STORE_USER')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    test('renders table columns', () => {
        const usersState = createMockUsersState();
        renderWithProvider(usersState, vi.fn(), vi.fn(), vi.fn());

        expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Rol' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    });

    test('shows empty text when there are no users', () => {
        const usersState = createMockUsersState({
            users: [],
            pagination: { current: 1, total: 0, pageSize: 15 },
        });

        renderWithProvider(usersState, vi.fn(), vi.fn(), vi.fn());

        expect(screen.getByText('No hay usuarios para mostrar')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        const usersState = createMockUsersState({ loading: true });
        const { container } = renderWithProvider(usersState, vi.fn(), vi.fn(), vi.fn());

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });
});
