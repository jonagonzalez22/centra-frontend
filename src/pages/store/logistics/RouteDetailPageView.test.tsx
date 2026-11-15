import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { RouteDetailPageView } from './RouteDetailPageView';
import type { DeliveryRoute, EligibleOrder } from '@/features/store/logistics/interfaces/route.interface';

vi.mock('./RouteMapModal', () => ({ RouteMapModal: () => null }));
vi.mock('@/features/store/logistics/components/RouteLoadDrawer', () => ({
    RouteLoadDrawer: () => null,
}));
vi.mock('@/features/store/logistics/components/RouteAdjustmentDrawer', () => ({
    RouteAdjustmentDrawer: () => null,
}));
vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/Tabs/Tabs', () => ({
    default: ({
        items,
        activeKey,
        defaultActiveKey,
        onChange,
    }: {
        items: Array<{ key: string; label: string; children: ReactNode }>;
        activeKey?: string;
        defaultActiveKey?: string;
        onChange?: (key: string) => void;
    }) => (
        <div>
            {items.map((item) => (
                <button key={item.key} type="button" onClick={() => onChange?.(item.key)}>
                    {item.label}
                </button>
            ))}
            {items.map((item) => (
                item.key === (activeKey ?? defaultActiveKey) ? (
                    <section key={item.key} aria-label={item.label}>
                        {item.children}
                    </section>
                ) : null
            ))}
        </div>
    ),
}));
vi.mock('@/components/Table/Table', () => ({
    default: ({
        columns,
        dataSource,
        rowSelection,
    }: {
        columns: Array<{
            key: string;
            title: string;
            dataIndex?: string;
            render?: (value: unknown, record: Record<string, unknown>) => ReactNode;
        }>;
        dataSource: Record<string, unknown>[];
        rowSelection?: { onChange: (keys: string[]) => void };
    }) => (
        <table>
            <thead>
                <tr>{columns.map((column) => <th key={column.key}>{column.title}</th>)}</tr>
            </thead>
            <tbody>
                {dataSource.map((record) => (
                    <tr key={record.id as string}>
                        {rowSelection && (
                            <td>
                                <input
                                    aria-label={`Seleccionar ${record.id as string}`}
                                    type="checkbox"
                                    onChange={() => rowSelection.onChange([record.id as string])}
                                />
                            </td>
                        )}
                        {columns.map((column) => (
                            <td key={column.key}>
                                {column.render
                                    ? column.render(record[column.dataIndex ?? column.key], record)
                                    : record[column.dataIndex ?? column.key] as string}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    ),
}));

const route = {
    id: 'route-1',
    operational_date: '2026-09-11',
    status: 'draft',
    departure_time: '08:00',
    requires_recalculation: false,
    stops: [],
    vehicle: null,
    driver: null,
} as unknown as DeliveryRoute;

const order = (overrides: Partial<EligibleOrder> = {}): EligibleOrder => ({
    id: 'order-1',
    operation_number: 'P-000001',
    requested_delivery_date: '2026-09-11',
    customer: { name: 'Dina Capuzello' },
    address: {
        street: 'San Martín',
        number: '123',
        locality: 'Ciudad',
        locality_id: 'locality-1',
        has_coordinates: true,
    },
    ...overrides,
});

const renderView = (
    dailyOrders: EligibleOrder[],
    exceptionalOrders: EligibleOrder[] = [],
    routeValue: DeliveryRoute = route
) => {
    const onAddStop = vi.fn().mockResolvedValue(undefined);
    const onPlanRoute = vi.fn().mockResolvedValue(undefined);
    const onRemoveStop = vi.fn().mockResolvedValue(undefined);

    render(
        <MemoryRouter>
            <RouteDetailPageView
                route={routeValue}
                dailyOrders={dailyOrders}
                exceptionalOrders={exceptionalOrders}
                loading={false}
                dailyOrdersLoading={false}
                exceptionalOrdersLoading={false}
                error={null}
                onAddStop={onAddStop}
                onAddExceptionalStop={vi.fn().mockResolvedValue(undefined)}
                onRemoveStop={onRemoveStop}
                onUpdateDepartureTime={vi.fn().mockResolvedValue(undefined)}
                onPlanRoute={onPlanRoute}
                onReorderStops={vi.fn().mockResolvedValue(undefined)}
                onRecalculate={vi.fn().mockResolvedValue(undefined)}
                onOptimizeRoute={vi.fn().mockResolvedValue(undefined)}
                onRevertRoute={vi.fn().mockResolvedValue(undefined)}
                onDispatchRoute={vi.fn().mockResolvedValue(undefined)}
                onLoadSuccess={vi.fn()}
            />
        </MemoryRouter>
    );

    return { onAddStop, onPlanRoute, onRemoveStop };
};

test('shows the locality for daily orders and keeps route assignment available', async () => {
    const user = userEvent.setup();
    const { onAddStop } = renderView([order()]);

    const desktopOrders = document.querySelector('.routeDetailOrdersDesktop') as HTMLElement;
    expect(within(desktopOrders).getByRole('columnheader', { name: 'Localidad' })).toBeInTheDocument();
    expect(within(desktopOrders).getByText('Ciudad')).toBeInTheDocument();
    expect(document.querySelector('.routeDetailStopsDesktop .ant-table')).toBeInTheDocument();

    await user.click(within(desktopOrders).getByRole('checkbox', { name: 'Seleccionar order-1' }));
    await user.click(screen.getByRole('button', { name: 'Asignar a Ruta' }));

    expect(onAddStop).toHaveBeenCalledWith('order-1');
});

test('shows an em dash when a daily order has no locality', () => {
    renderView([order({ address: { ...order().address!, locality: null } })]);

    const desktopOrders = document.querySelector('.routeDetailOrdersDesktop') as HTMLElement;
    const row = within(desktopOrders).getByText('P-000001').closest('tr');
    expect(row).not.toBeNull();
    expect(within(row!).getByText('—')).toBeInTheDocument();
});

test('shows locality in exceptional orders', async () => {
    const user = userEvent.setup();
    renderView([], [order({ id: 'order-2', operation_number: 'P-000002' })]);
    await user.click(screen.getByRole('button', { name: 'Pedidos excepcionales' }));

    const exceptionalTable = screen.getByLabelText('Pedidos excepcionales').querySelector('table');
    expect(exceptionalTable).not.toBeNull();
    expect(within(exceptionalTable!).getByRole('columnheader', { name: 'Localidad' })).toBeInTheDocument();
    expect(within(exceptionalTable!).getByText('Ciudad')).toBeInTheDocument();
});

test('renders the draft route information and disabled planning feedback for mobile', async () => {
    const user = userEvent.setup();
    renderView([]);

    const mainCard = screen.getByTestId('route-detail-main-card');
    expect(within(mainCard).getByText('#ROUTE-1')).toBeInTheDocument();
    expect(mainCard.querySelector('.routeDetailMobileStatus')).toHaveTextContent('Borrador');
    expect(within(mainCard).getByPlaceholderText('Seleccionar hora')).toBeInTheDocument();
    const planButton = screen.getByRole('button', { name: 'Planificar Ruta' });
    expect(planButton).toBeDisabled();
    await user.hover(planButton.parentElement!);
    expect(
        await screen.findByText('Agregá al menos una parada para planificar la ruta.')
    ).toBeInTheDocument();
    expect(mainCard.querySelector('.routeDetailDesktopStatus')).toHaveClass(
        'ant-descriptions-item'
    );
});

test('renders mobile stop and order cards while keeping selection and assignment available', () => {
    const routeWithStop = {
        ...route,
        stops: [
            {
                id: 'stop-1',
                sequence: 1,
                    status: 'pending',
                order: {
                    operation_number: 'P-000010',
                    customer: { name: 'Dina Capuzello', phone: null },
                    address: { street: 'San Martín', number: '123', locality: 'Ciudad' },
                },
            },
        ],
    } as unknown as DeliveryRoute;
    renderView([order()], [], routeWithStop);

    const stops = screen.getByTestId('route-stops-mobile');
    const orders = screen.getByTestId('daily-orders-mobile');
    expect(within(stops).getByText('Parada 1')).toBeInTheDocument();
    expect(within(stops).getByText('P-000010')).toBeInTheDocument();
    expect(within(stops).getByText('Pendiente')).toBeInTheDocument();
    expect(within(stops).getByRole('button', { name: 'Notificar WhatsApp' })).toBeInTheDocument();
    expect(within(stops).getByRole('button', { name: 'Quitar parada' })).toBeInTheDocument();
    expect(within(orders).getByText('P-000001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Planificar Ruta' })).toBeEnabled();

    expect(screen.getByRole('button', { name: 'Asignar a Ruta' })).toBeDisabled();
});

test('keeps planned stop ETA, duration, and actions visible in the mobile card', () => {
    const plannedRoute = {
        ...route,
        status: 'planned',
        encoded_polyline: 'encoded-route',
        stops: [
            {
                id: 'planned-stop-1',
                sequence: 1,
                status: 'pending',
                notification_window_start: '09:15',
                notification_window_end: '10:20',
                travel_duration_seconds: 1020,
                order: {
                    operation_number: 'P-000011',
                    customer: { name: 'Dina Capuzello', phone: null },
                    address: { street: 'San Martín', number: '123', locality: 'Ciudad' },
                },
            },
        ],
    } as unknown as DeliveryRoute;
    renderView([], [], plannedRoute);

    const mobileStops = screen.getByTestId('route-stops-mobile');
    const desktopStops = document.querySelector('.routeDetailStopsDesktop') as HTMLElement;
    expect(within(mobileStops).getByText('Llegada estimada')).toBeInTheDocument();
    expect(within(mobileStops).getByText('09:15 – 10:20')).toBeInTheDocument();
    expect(within(mobileStops).getByText('Tramo')).toBeInTheDocument();
    expect(within(mobileStops).getByText('17 min')).toBeInTheDocument();
    expect(within(desktopStops).getByText('09:15 – 10:20')).toBeInTheDocument();
    expect(within(desktopStops).getByText('17 min')).toBeInTheDocument();
    expect(screen.getByText('Ver recorrido').closest('button')).toHaveTextContent('Ver recorrido');
    expect(screen.getByText('Reoptimizar').closest('button')).toBeInTheDocument();
    expect(screen.getByText('Gestionar Carga').closest('button')).toBeInTheDocument();
});

test('keeps loaded route actions visible with the existing conditions', () => {
    const loadedRoute = {
        ...route,
        status: 'loaded',
        encoded_polyline: 'encoded-route',
    } as DeliveryRoute;
    renderView([], [], loadedRoute);

    const actions = document.querySelector('.routeDetailLoadedActions') as HTMLElement;
    expect(actions).toBeInTheDocument();
    expect(within(actions).getByText('Ver recorrido').closest('button')).toHaveTextContent(
        'Ver recorrido'
    );
    expect(within(actions).getByText('Hoja de carga').closest('button')).toHaveTextContent(
        'Hoja de carga'
    );
    expect(within(actions).getByText('Ajustar productos por parada').closest('button')).toBeInTheDocument();
    expect(within(actions).getByText('Despachar ruta').closest('button')).toBeInTheDocument();
    expect(actions.querySelector('.routeDetailLoadedAdjustAction')).toBeInTheDocument();
    expect(actions.querySelector('.routeDetailLoadedDispatchAction')).toBeInTheDocument();
});

test('shows the mobile empty state for route stops', () => {
    renderView([]);

    const stops = screen.getByTestId('route-stops-mobile');
    expect(within(stops).getByText('No hay datos')).toBeInTheDocument();
    expect(within(stops).getByText('Aún no se han asignado paradas a esta ruta.')).toBeInTheDocument();
    expect(within(stops).queryByRole('article')).not.toBeInTheDocument();
});

test('selects all visible daily orders and becomes indeterminate after deselecting one', () => {
    const manyOrders = Array.from({ length: 30 }, (_, index) =>
        order({
            id: `order-${index + 1}`,
            operation_number: `P-${String(index + 1).padStart(6, '0')}`,
        })
    );
    renderView(manyOrders);
    const orders = screen.getByTestId('daily-orders-mobile');
    const selectAll = within(orders).getByRole('checkbox', { name: 'Seleccionar todos' });

    fireEvent.click(selectAll);
    expect(within(orders).getByText('30 seleccionados')).toBeInTheDocument();
    expect(
        within(orders).getByRole('checkbox', { name: 'Seleccionar order-1' })
    ).toBeChecked();

    fireEvent.click(within(orders).getByRole('checkbox', { name: 'Seleccionar order-30' }));
    expect(within(orders).getByText('29 seleccionados')).toBeInTheDocument();
    expect(selectAll).toBePartiallyChecked();
}, 15000);

test('clears daily selection when changing order tabs', () => {
    renderView([order()], [order({ id: 'exceptional-1' })]);
    const orders = screen.getByTestId('daily-orders-mobile');

    fireEvent.click(within(orders).getByRole('checkbox', { name: 'Seleccionar order-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos excepcionales' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos del día' }));
    expect(within(screen.getByTestId('daily-orders-mobile')).getByText('0 seleccionados')).toBeInTheDocument();
}, 15000);
