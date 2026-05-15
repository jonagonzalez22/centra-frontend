import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { StoresPageView } from './StoresPageView';
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

const renderWithProvider = (ui: React.ReactElement) => {
    return render(
        <MemoryRouter>
            <StoresProvider value={createMockStoresState()}>{ui}</StoresProvider>
        </MemoryRouter>
    );
};

describe('StoresPage', () => {
    test('renders the page header and breadcrumb', () => {
        renderWithProvider(
            <StoresPageView
                title="Gestión de Tiendas"
                description="Administra las tiendas registradas en el sistema"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }]}
                canCreateStore={true}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: /gestión de tiendas/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
        expect(screen.getByText('Tiendas')).toBeInTheDocument();
    });

    test('renders the provided page navigation', () => {
        renderWithProvider(
            <StoresPageView
                title="Reporte de Tiendas"
                description="Reportes de tiendas"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Reportes' }]}
                canCreateStore={false}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: /reporte de tiendas/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute('href', '/admin/dashboard');
        expect(screen.getByText('Reportes')).toBeInTheDocument();
    });

    test('renders error message when stores fail to load', () => {
        renderWithProvider(
            <StoresPageView
                title="Gestión de Tiendas"
                description="Administra las tiendas registradas en el sistema"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }]}
                canCreateStore={false}
                error="Error al cargar las tiendas"
                onEdit={vi.fn()}
                onCreate={vi.fn()}
            />
        );

        expect(screen.getByText('Error al cargar las tiendas')).toBeInTheDocument();
    });
});