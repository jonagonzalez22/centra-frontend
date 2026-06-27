import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { StoreUsersPageView } from './StoreUsersPageView';
import { StoreUsersProvider } from '@/features/store/users/contexts/StoreUsersProvider';
import type { UseStoreUsersReturn } from '@/features/store/users/hooks/useStoreUsers';
import type { User } from '@/entities/User';

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

const renderWithProvider = (ui: React.ReactElement) => {
    return render(
        <MemoryRouter>
            <StoreUsersProvider value={createMockUsersState()}>{ui}</StoreUsersProvider>
        </MemoryRouter>
    );
};

const mockCanFn = (permissions: string[]) => {
    (globalThis as Record<string, unknown>).__testPermissions = permissions;
};

describe('StoreUsersPage', () => {
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
        mockCanFn(['store_users.view']);
    });

    test('renders the page header and breadcrumb', () => {
        renderWithProvider(
            <StoreUsersPageView
                title="Gestión de Usuarios"
                description="Administrá los usuarios de tu tienda"
                breadcrumbs={[{ label: 'Tienda', path: '/tienda/dashboard' }, { label: 'Usuarios' }]}
                canCreateUser={true}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
                onToggleActive={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: /gestión de usuarios/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /tienda/i })).toBeInTheDocument();
        expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });

    test('renders the provided page navigation', () => {
        renderWithProvider(
            <StoreUsersPageView
                title="Reporte de Usuarios"
                description="Reportes de usuarios"
                breadcrumbs={[{ label: 'Tienda', path: '/tienda/dashboard' }, { label: 'Reportes' }]}
                canCreateUser={false}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
                onToggleActive={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: /reporte de usuarios/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /tienda/i })).toHaveAttribute('href', '/tienda/dashboard');
        expect(screen.getByText('Reportes')).toBeInTheDocument();
    });

    test('renders error message when users fail to load', () => {
        renderWithProvider(
            <StoreUsersPageView
                title="Gestión de Usuarios"
                description="Administrá los usuarios de tu tienda"
                breadcrumbs={[{ label: 'Tienda', path: '/tienda/dashboard' }, { label: 'Usuarios' }]}
                canCreateUser={false}
                error="Error al cargar los usuarios"
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
                onToggleActive={vi.fn()}
            />
        );

        expect(screen.getByText('Error al cargar los usuarios')).toBeInTheDocument();
    });

    test('shows create button when canCreateUser is true', () => {
        mockCanFn(['store_users.view', 'store_users.create', 'store_users.edit', 'store_users.delete']);

        renderWithProvider(
            <StoreUsersPageView
                title="Gestión de Usuarios"
                description="Administrá los usuarios de tu tienda"
                breadcrumbs={[{ label: 'Tienda', path: '/tienda/dashboard' }, { label: 'Usuarios' }]}
                canCreateUser={true}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
                onToggleActive={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: /nuevo usuario/i })).toBeInTheDocument();
    });

    test('hides create button when canCreateUser is false', () => {
        mockCanFn(['store_users.view']);

        renderWithProvider(
            <StoreUsersPageView
                title="Gestión de Usuarios"
                description="Administrá los usuarios de tu tienda"
                breadcrumbs={[{ label: 'Tienda', path: '/tienda/dashboard' }, { label: 'Usuarios' }]}
                canCreateUser={false}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
                onDelete={vi.fn()}
                onToggleActive={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: /nuevo usuario/i })).not.toBeInTheDocument();
    });

    test('renders user rows from context', () => {
        mockCanFn(['store_users.view', 'store_users.create', 'store_users.edit', 'store_users.delete']);

        const usersState = createMockUsersState({
            users: [mockUser],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        render(
            <MemoryRouter>
                <StoreUsersProvider value={usersState}>
                    <StoreUsersPageView
                        title="Gestión de Usuarios"
                        description="Administrá los usuarios de tu tienda"
                        breadcrumbs={[{ label: 'Tienda', path: '/tienda/dashboard' }, { label: 'Usuarios' }]}
                        canCreateUser={true}
                        error={null}
                        onEdit={vi.fn()}
                        onCreate={vi.fn()}
                        onDelete={vi.fn()}
                        onToggleActive={vi.fn()}
                    />
                </StoreUsersProvider>
            </MemoryRouter>
        );

        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('juan@centra.com')).toBeInTheDocument();
    });
});
