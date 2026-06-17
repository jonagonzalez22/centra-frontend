import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { UsersPageView } from './UsersPageView';
import { UsersProvider } from '@/features/admin/users/contexts/UsersProvider';
import type { UseUsersReturn } from '@/features/admin/users/hooks/useUsers';
import type { User } from '@/entities/User';

const mockUser: User = {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan@centra.com',
    store_id: 1,
    store: { id: '1', name: 'Ferretería Central', business_type: 'ferreteria' },
    roles: ['STORE_ADMIN'],
    permissions: ['users.view'],
    features: [{ code: 'pos', limit: null }],
};

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

const renderWithProvider = (ui: React.ReactElement) => {
    return render(
        <MemoryRouter>
            <UsersProvider value={createMockUsersState()}>{ui}</UsersProvider>
        </MemoryRouter>
    );
};

const mockCanFn = (permissions: string[]) => {
    (globalThis as Record<string, unknown>).__testPermissions = permissions;
};

describe('UsersPage', () => {
    beforeAll(() => {
        vi.mock('@/hooks/usePermissions', () => ({
            usePermissions: vi.fn(() => ({
                can: (permission: string) => {
                    const permissions = (globalThis as Record<string, unknown>).__testPermissions as string[] | undefined;
                    return permissions?.includes(permission) ?? false;
                },
            })),
        }));
    });

    beforeEach(() => {
        mockCanFn(['users.view']);
    });

    test('renders the page header and breadcrumb', () => {
        renderWithProvider(
            <UsersPageView
                title="Gestión de Usuarios"
                description="Administra los usuarios del sistema"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Usuarios' }]}
                canCreateUser={true}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: /gestión de usuarios/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
        expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });

    test('renders the provided page navigation', () => {
        renderWithProvider(
            <UsersPageView
                title="Reporte de Usuarios"
                description="Reportes de usuarios"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Reportes' }]}
                canCreateUser={false}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: /reporte de usuarios/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute('href', '/admin/dashboard');
        expect(screen.getByText('Reportes')).toBeInTheDocument();
    });

    test('renders error message when users fail to load', () => {
        renderWithProvider(
            <UsersPageView
                title="Gestión de Usuarios"
                description="Administra los usuarios del sistema"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Usuarios' }]}
                canCreateUser={false}
                error="Error al cargar los usuarios"
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText('Error al cargar los usuarios')).toBeInTheDocument();
    });

    test('shows create button when canCreateUser is true', () => {
        mockCanFn(['users.view', 'users.create', 'users.edit', 'users.delete']);

        renderWithProvider(
            <UsersPageView
                title="Gestión de Usuarios"
                description="Administra los usuarios del sistema"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Usuarios' }]}
                canCreateUser={true}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: /nuevo usuario/i })).toBeInTheDocument();
    });

    test('hides create button when canCreateUser is false', () => {
        mockCanFn(['users.view']);

        renderWithProvider(
            <UsersPageView
                title="Gestión de Usuarios"
                description="Administra los usuarios del sistema"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Usuarios' }]}
                canCreateUser={false}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: /nuevo usuario/i })).not.toBeInTheDocument();
    });

    test('renders user rows from context', () => {
        mockCanFn(['users.view', 'users.create', 'users.edit', 'users.delete']);

        const usersState = createMockUsersState({
            users: [mockUser],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        render(
            <MemoryRouter>
                <UsersProvider value={usersState}>
                    <UsersPageView
                        title="Gestión de Usuarios"
                        description="Administra los usuarios del sistema"
                        breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Usuarios' }]}
                        canCreateUser={true}
                        error={null}
                        onEdit={vi.fn()}
                        onCreate={vi.fn()}
                        onDelete={vi.fn()}
                    />
                </UsersProvider>
            </MemoryRouter>
        );

        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('juan@centra.com')).toBeInTheDocument();
    });
});
