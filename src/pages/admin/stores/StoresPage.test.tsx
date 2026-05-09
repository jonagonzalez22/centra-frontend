import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { StoresPageView } from './StoresPage';

const renderStoresPage = (props: Partial<React.ComponentProps<typeof StoresPageView>> = {}) => {
    const defaultProps: React.ComponentProps<typeof StoresPageView> = {
        title: 'Gestión de Tiendas',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
        stores: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
    };

    return render(
        <MemoryRouter>
            <StoresPageView {...defaultProps} {...props} />
        </MemoryRouter>
    );
};

describe('StoresPage', () => {
    test('renders the page header and breadcrumb', () => {
        renderStoresPage();

        expect(screen.getByRole('heading', { name: /gestión de tiendas/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
        expect(screen.getByText('Tiendas')).toBeInTheDocument();
    });

    test('renders the provided page navigation', () => {
        renderStoresPage({
            title: 'Reporte de Tiendas',
            breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Reportes' }],
        });

        expect(screen.getByRole('heading', { name: /reporte de tiendas/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute(
            'href',
            '/admin/dashboard'
        );
        expect(screen.getByText('Reportes')).toBeInTheDocument();
    });

    test('renders filter controls', () => {
        renderStoresPage();

        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
        expect(screen.getAllByText('Estado').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /filtrar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument();
    });

    test('renders table columns', () => {
        renderStoresPage();

        expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    });

    test('renders stores when data is available', () => {
        renderStoresPage({
            stores: [
                { id: 1, name: 'Sucursal Centro', email: 'centro@centra.com', status: 'active' },
                { id: 2, name: 'Sucursal Norte', email: null, status: 'inactive' },
            ],
        });

        expect(screen.getByText('Sucursal Centro')).toBeInTheDocument();
        expect(screen.getByText('centro@centra.com')).toBeInTheDocument();
        expect(screen.getByText('Sucursal Norte')).toBeInTheDocument();
        expect(screen.getByText('Sin email')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });

    test('shows loading state while stores are being fetched', () => {
        const { container } = renderStoresPage({ loading: true });

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });

    test('shows error message when stores fail to load', () => {
        renderStoresPage({ error: 'Error al cargar las tiendas' });

        expect(screen.getByText('Error al cargar las tiendas')).toBeInTheDocument();
    });

    test('calls refetch when filtering and resetting', async () => {
        const user = userEvent.setup();
        const refetch = vi.fn();

        renderStoresPage({ refetch });

        await user.click(screen.getByRole('button', { name: /filtrar/i }));
        await user.click(screen.getByRole('button', { name: /limpiar/i }));

        expect(refetch).toHaveBeenCalledTimes(2);
    });
});