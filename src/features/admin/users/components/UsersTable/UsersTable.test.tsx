import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UsersTable } from './UsersTable';
import { UsersProvider } from '../../contexts/UsersProvider';
import type { UseUsersReturn } from '../../hooks/useUsers';
import type { User } from '@/entities/User';

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

const renderWithProvider = (usersState: UseUsersReturn, onEdit: (user: User) => void, onDelete: (id: number) => Promise<void>) => {
    return render(
        <MemoryRouter>
            <UsersProvider value={usersState}>
                <UsersTable onEdit={onEdit} onDelete={onDelete} />
            </UsersProvider>
        </MemoryRouter>
    );
};

const mockUser: User = {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan@centra.com',
    store_id: 1,
    store: { id: '1', name: 'Ferretería Central' },
    roles: ['STORE_ADMIN'],
    permissions: ['users.view'],
    features: ['pos'],
};

describe('UsersTable', () => {
    test('renders user rows', () => {
        const usersState = createMockUsersState({
            users: [mockUser],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        renderWithProvider(usersState, vi.fn(), vi.fn());

        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('juan@centra.com')).toBeInTheDocument();
        expect(screen.getByText('STORE_ADMIN')).toBeInTheDocument();
    });

    test('renders table columns', () => {
        const usersState = createMockUsersState();
        renderWithProvider(usersState, vi.fn(), vi.fn());

        expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Roles' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    });

    test('shows empty text when there are no users', () => {
        const usersState = createMockUsersState({
            users: [],
            pagination: { current: 1, total: 0, pageSize: 15 },
        });

        renderWithProvider(usersState, vi.fn(), vi.fn());

        expect(screen.getByText('No hay usuarios para mostrar')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        const usersState = createMockUsersState({ loading: true });
        const { container } = renderWithProvider(usersState, vi.fn(), vi.fn());

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });

    test('renders multiple roles as tags', () => {
        const userWithMultipleRoles: User = {
            ...mockUser,
            id: 2,
            name: 'María López',
            roles: ['SUPER_ADMIN', 'BACKOFFICE_USER'],
        };

        const usersState = createMockUsersState({
            users: [userWithMultipleRoles],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        renderWithProvider(usersState, vi.fn(), vi.fn());

        expect(screen.getByText('María López')).toBeInTheDocument();
        expect(screen.getAllByText('SUPER_ADMIN')).toHaveLength(1);
        expect(screen.getAllByText('BACKOFFICE_USER')).toHaveLength(1);
    });
});