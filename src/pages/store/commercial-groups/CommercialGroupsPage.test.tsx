import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { CommercialGroupsPageView } from './CommercialGroupsPageView';
describe('CommercialGroupsPage', () => {
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
        (globalThis as Record<string, unknown>).__testPermissions = ['commercial_groups.view'];
    });

    const renderView = (overrides: Record<string, unknown> = {}) => {
        const defaultProps = {
            title: 'Grupos Comerciales',
            description: 'Administrá los grupos comerciales de tu tienda',
            breadcrumbs: [
                { label: 'Tienda', path: '/tienda/dashboard' },
                { label: 'Clientes' },
                { label: 'Grupos Comerciales' },
            ],
            canCreateGroup: false,
            error: null,
            groups: [],
            loading: false,
            pagination: { current: 1, total: 0, pageSize: 15 },
            onRefetch: vi.fn(),
            onEdit: vi.fn(),
            onCreate: vi.fn(),
            onDelete: vi.fn().mockResolvedValue(undefined),
            ...overrides,
        };

        return render(
            <MemoryRouter>
                <CommercialGroupsPageView {...defaultProps} />
            </MemoryRouter>
        );
    };

    test('renders the page header and breadcrumb', () => {
        renderView();
        expect(screen.getByRole('heading', { name: /grupos comerciales/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /tienda/i })).toBeInTheDocument();
        const items = screen.getAllByText('Grupos Comerciales');
        expect(items.length).toBe(2);
    });

    test('renders error message when groups fail to load', () => {
        renderView({ error: 'Error al cargar los grupos comerciales' });
        expect(screen.getByText('Error al cargar los grupos comerciales')).toBeInTheDocument();
    });

    test('shows create button when canCreateGroup is true', () => {
        (globalThis as Record<string, unknown>).__testPermissions = [
            'commercial_groups.view',
            'commercial_groups.create',
        ];
        renderView({ canCreateGroup: true });
        expect(screen.getByRole('button', { name: /nuevo grupo comercial/i })).toBeInTheDocument();
    });

    test('hides create button when canCreateGroup is false', () => {
        renderView({ canCreateGroup: false });
        expect(screen.queryByRole('button', { name: /nuevo grupo comercial/i })).not.toBeInTheDocument();
    });
});
