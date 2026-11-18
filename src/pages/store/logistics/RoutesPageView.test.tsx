import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoutesPageView } from './RoutesPageView';
import type { DeliveryRoute } from '@/features/store/logistics/interfaces/route.interface';

let canViewRoutes = true;

vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ permission, children }: { permission: string; children: React.ReactNode }) =>
        permission !== 'logistics.routes.view' || canViewRoutes ? <>{children}</> : null,
}));

const awaitingRoute = {
    id: '01a1d0d8-0000-0000-0000-000000000000',
    operational_date: '2026-11-24',
    status: 'awaiting_reconciliation',
    route_name: 'Godoy Cruz - Las Heras',
    stops: [{}],
} as DeliveryRoute;

const completedRoute = {
    ...awaitingRoute,
    id: '02b2e1e9-0000-0000-0000-000000000000',
    status: 'completed',
    stops: [{}, {}],
} as DeliveryRoute;

const routeWithCancelledHistory = {
    ...awaitingRoute,
    id: '03c3f0f0-0000-0000-0000-000000000000',
    operational_stops_count: 2,
    stops: [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'cancelled' },
        { status: 'cancelled' },
        { status: 'cancelled' },
    ],
} as DeliveryRoute;

const renderView = (items: DeliveryRoute[] = [awaitingRoute, completedRoute]) => {
    const navigate = vi.fn();
    const onView = vi.fn();

    render(
        <MemoryRouter>
            <RoutesPageView
                title="Rutas de Logística"
                description="Gestiona las rutas de entrega de tu tienda"
                breadcrumbs={[{ label: 'Tienda', path: '/tienda/dashboard' }]}
                canManageRoutes={false}
                error={null}
                items={items}
                loading={false}
                pagination={{ current: 1, total: items.length, pageSize: 15, totalPages: 1 }}
                filters={{}}
                drivers={[]}
                driversLoading={false}
                setPage={vi.fn()}
                setPerPage={vi.fn()}
                setFilters={vi.fn()}
                onCreate={vi.fn()}
                onView={onView}
                navigate={navigate}
            />
        </MemoryRouter>
    );

    return { navigate, onView };
};

describe('RoutesPageView', () => {
    beforeEach(() => {
        canViewRoutes = true;
    });

    it('keeps the desktop table and renders the equivalent compact mobile cards', () => {
        renderView();

        const desktop = document.querySelector('.routesPageTable') as HTMLElement;
        const mobile = screen.getByTestId('routes-mobile-list');

        expect(within(desktop).getByRole('table')).toBeInTheDocument();
        expect(
            within(desktop).getByRole('columnheader', { name: 'Número de Ruta' })
        ).toBeInTheDocument();
        expect(within(desktop).getByRole('columnheader', { name: 'Nombre de ruta' })).toBeInTheDocument();
        expect(within(desktop).getByRole('columnheader', { name: 'Fecha desde' })).toBeInTheDocument();
        expect(within(mobile).getAllByText('Godoy Cruz - Las Heras')).toHaveLength(2);
        expect(within(mobile).getByText('#01A1D0D8')).toBeInTheDocument();
        expect(within(mobile).getByText('24/11/2026 · 1 parada')).toBeInTheDocument();
        expect(within(mobile).getByText('24/11/2026 · 2 paradas')).toBeInTheDocument();
        expect(within(mobile).getByText('Pend. Conciliación')).toBeInTheDocument();
        expect(within(mobile).getByText('Completada')).toBeInTheDocument();
        expect(within(mobile).queryByRole('table')).not.toBeInTheDocument();
    });

    it('uses the existing desktop icons and actions in mobile cards', () => {
        const { navigate, onView } = renderView();
        const mobile = screen.getByTestId('routes-mobile-list');
        const cards = within(mobile).getAllByRole('article');

        const detail = within(cards[0]).getByRole('button', { name: 'Ver detalle' });
        const reconcile = within(cards[0]).getByRole('button', { name: 'Conciliar' });

        expect(detail.querySelector('.anticon-eye')).toBeInTheDocument();
        expect(reconcile.querySelector('.anticon-dollar')).toBeInTheDocument();
        expect(reconcile).toHaveClass('routesPageCardActionPrimary');
        expect(
            within(cards[1]).queryByRole('button', { name: 'Conciliar' })
        ).not.toBeInTheDocument();

        detail.click();
        expect(onView).toHaveBeenCalledWith(awaitingRoute);

        reconcile.click();
        expect(navigate).toHaveBeenCalledWith(
            '/tienda/logistica/rutas/01a1d0d8-0000-0000-0000-000000000000/rendicion'
        );
    });

    it('respects the existing detail permission in the mobile actions', () => {
        canViewRoutes = false;
        renderView([awaitingRoute]);

        const mobile = screen.getByTestId('routes-mobile-list');
        expect(
            within(mobile).queryByRole('button', { name: 'Ver detalle' })
        ).not.toBeInTheDocument();
        expect(within(mobile).getByRole('button', { name: 'Conciliar' })).toBeInTheDocument();
    });

    it('preserves the empty state for the mobile representation', () => {
        renderView([]);

        const mobile = screen.getByTestId('routes-mobile-list');
        expect(within(mobile).getByText('No hay datos')).toBeInTheDocument();
        expect(within(mobile).queryByRole('article')).not.toBeInTheDocument();
    });

    it('uses the backend operational stop count instead of historical cancelled stops', () => {
        renderView([routeWithCancelledHistory]);

        const mobile = screen.getByTestId('routes-mobile-list');
        expect(within(mobile).getByText('24/11/2026 · 2 paradas')).toBeInTheDocument();
    });

    it('renders an em dash when a route has no name', () => {
        renderView([{ ...awaitingRoute, route_name: null }]);
        expect(screen.getByTestId('routes-mobile-list')).toHaveTextContent('—');
    });
});
