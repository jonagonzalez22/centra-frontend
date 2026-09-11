import { render, screen, within } from '@testing-library/react';
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
vi.mock('@/components/Tabs/Tabs', () => ({
    default: ({ items }: { items: Array<{ key: string; label: string; children: ReactNode }> }) => (
        <div>
            {items.map((item) => (
                <section key={item.key} aria-label={item.label}>
                    {item.children}
                </section>
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

const renderView = (dailyOrders: EligibleOrder[], exceptionalOrders: EligibleOrder[] = []) => {
    const onAddStop = vi.fn().mockResolvedValue(undefined);

    render(
        <MemoryRouter>
            <RouteDetailPageView
                route={route}
                dailyOrders={dailyOrders}
                exceptionalOrders={exceptionalOrders}
                loading={false}
                dailyOrdersLoading={false}
                exceptionalOrdersLoading={false}
                error={null}
                onAddStop={onAddStop}
                onAddExceptionalStop={vi.fn().mockResolvedValue(undefined)}
                onRemoveStop={vi.fn().mockResolvedValue(undefined)}
                onUpdateDepartureTime={vi.fn().mockResolvedValue(undefined)}
                onPlanRoute={vi.fn().mockResolvedValue(undefined)}
                onReorderStops={vi.fn().mockResolvedValue(undefined)}
                onRecalculate={vi.fn().mockResolvedValue(undefined)}
                onOptimizeRoute={vi.fn().mockResolvedValue(undefined)}
                onRevertRoute={vi.fn().mockResolvedValue(undefined)}
                onDispatchRoute={vi.fn().mockResolvedValue(undefined)}
                onLoadSuccess={vi.fn()}
            />
        </MemoryRouter>
    );

    return { onAddStop };
};

test('shows the locality for daily orders and keeps route assignment available', async () => {
    const user = userEvent.setup();
    const { onAddStop } = renderView([order()]);

    expect(screen.getAllByRole('columnheader', { name: 'Localidad' })).toHaveLength(2);
    expect(screen.getByText('Ciudad')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar order-1' }));
    await user.click(screen.getByRole('button', { name: 'Asignar a Ruta' }));

    expect(onAddStop).toHaveBeenCalledWith('order-1');
});

test('shows an em dash when a daily order has no locality', () => {
    renderView([order({ address: { ...order().address!, locality: null } })]);

    const row = screen.getByText('P-000001').closest('tr');
    expect(row).not.toBeNull();
    expect(within(row!).getByText('—')).toBeInTheDocument();
});

test('shows locality in exceptional orders', () => {
    renderView([], [order({ id: 'order-2', operation_number: 'P-000002' })]);

    const exceptionalTable = screen.getByLabelText('Pedidos excepcionales').querySelector('table');
    expect(exceptionalTable).not.toBeNull();
    expect(within(exceptionalTable!).getByRole('columnheader', { name: 'Localidad' })).toBeInTheDocument();
    expect(screen.getByText('Ciudad')).toBeInTheDocument();
});
