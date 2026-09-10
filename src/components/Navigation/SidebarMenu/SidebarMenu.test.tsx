import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { SidebarMenu } from './SidebarMenu';
import { MemoryRouter, useLocation } from 'react-router-dom';

let mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    store_id: null as number | null,
    store: null,
    is_active: true,
    roles: ['SUPER_ADMIN'],
    permissions: ['stores.view', 'users.view', 'settings.view'],
    features: [] as { code: string; limit: number | null }[],
};

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: vi.fn(() => ({
        user: mockUser,
    })),
}));

const Location = () => <div data-testid="location">{useLocation().pathname}</div>;

describe('SidebarMenu', () => {
    const renderWithRouter = (ui: React.ReactElement) => {
        return render(
            <MemoryRouter>
                {ui}
                <Location />
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        mockUser = {
            id: 1,
            name: 'Test User',
            email: 'test@test.com',
            store_id: null,
            store: null,
            is_active: true,
            roles: ['SUPER_ADMIN'],
            permissions: ['stores.view', 'users.view', 'settings.view'],
            features: [],
        };
    });

    const useStoreUser = (options?: {
        permissions?: string[];
        features?: string[];
    }) => {
        mockUser = {
            ...mockUser,
            store_id: 1,
            roles: ['STORE_ADMIN'],
            permissions: options?.permissions ?? [
                'cash.view',
                'pos.view',
                'orders.view',
                'inventory.view',
                'categories.view',
            ],
            features: (
                options?.features ?? ['cash', 'pos', 'inventory', 'categories']
            ).map((code) => ({ code, limit: null })),
        };
    };

    test('renders desktop sider when not mobile', () => {
        renderWithRouter(
            <SidebarMenu isMobile={false} isOpen={false} selectedKey={'/admin/dashboard'} />
        );

        expect(screen.getByText(/CENTRA/i)).toBeInTheDocument();
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    test('renders drawer when mobile and open', () => {
        renderWithRouter(
            <SidebarMenu isMobile={true} isOpen={true} selectedKey={'/admin/dashboard'} />
        );

        expect(screen.getByText(/CENTRA/i)).toBeInTheDocument();
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    test('renders Configuraciones submenu for admin users with permission', () => {
        renderWithRouter(
            <SidebarMenu isMobile={false} isOpen={false} selectedKey={'/admin/dashboard'} />
        );

        expect(screen.getByText(/Configuraciones/i)).toBeInTheDocument();
    });

    test('opens Configuraciones submenu when on a settings route', () => {
        renderWithRouter(
            <SidebarMenu
                isMobile={false}
                isOpen={false}
                selectedKey={'/admin/configuraciones/tipos-de-negocio'}
            />
        );

        expect(screen.getByText(/Configuraciones/i)).toBeInTheDocument();
        expect(screen.getByText(/Tipos de Negocio/i)).toBeInTheDocument();
    });

    test('shows the renamed sales entries without changing their destinations', async () => {
        const user = userEvent.setup();
        useStoreUser();
        renderWithRouter(
            <SidebarMenu isMobile={false} isOpen={false} selectedKey="/tienda/caja" />
        );

        expect(screen.getByText('Gestión de caja')).toBeInTheDocument();
        expect(screen.getByText('Caja')).toBeInTheDocument();
        expect(screen.getByText('Pedidos')).toBeInTheDocument();
        expect(screen.queryByText('Punto de Venta')).not.toBeInTheDocument();

        await user.click(screen.getByText('Gestión de caja'));
        expect(screen.getByTestId('location')).toHaveTextContent('/tienda/caja');
        await user.click(screen.getByText('Caja'));
        expect(screen.getByTestId('location')).toHaveTextContent('/tienda/ventas/pos');
        await user.click(screen.getByText('Pedidos'));
        expect(screen.getByTestId('location')).toHaveTextContent('/tienda/ventas/pedidos');
    });

    test.each([
        ['Productos', '/tienda/productos'],
        ['Categorías', '/tienda/categorias'],
        ['Movimientos', '/tienda/inventario/movimientos'],
    ])('opens Inventario and selects %s for its existing route', async (label, route) => {
        const user = userEvent.setup();
        useStoreUser();
        renderWithRouter(<SidebarMenu isMobile={false} isOpen={false} selectedKey={route} />);

        expect(screen.getByText('Inventario')).toBeInTheDocument();
        const menuItem = screen.getByText(label).closest('.ant-menu-item');
        expect(menuItem).toHaveClass('ant-menu-item-selected');
        await user.click(screen.getByText(label));
        expect(screen.getByTestId('location')).toHaveTextContent(route);
    });

    test('keeps inventory child permission and feature checks', () => {
        useStoreUser({ permissions: ['categories.view'], features: ['categories'] });
        renderWithRouter(
            <SidebarMenu isMobile={false} isOpen={false} selectedKey="/tienda/categorias" />
        );

        expect(screen.getByText('Inventario')).toBeInTheDocument();
        expect(screen.getByText('Categorías')).toBeInTheDocument();
        expect(screen.queryByText('Productos')).not.toBeInTheDocument();
        expect(screen.queryByText('Movimientos')).not.toBeInTheDocument();
    });

    test('does not render an empty Inventario group', () => {
        useStoreUser({ permissions: [], features: [] });
        renderWithRouter(
            <SidebarMenu isMobile={false} isOpen={false} selectedKey="/tienda/dashboard" />
        );

        expect(screen.queryByText('Inventario')).not.toBeInTheDocument();
    });
});
