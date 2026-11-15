import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DiscrepancyGroupsTable } from './DiscrepancyGroupsTable';
import type { RouteReconciliationProductGroup } from '../../interfaces/reconciliation.interface';

const pendingGroup: RouteReconciliationProductGroup = {
    product_id: 'product-1',
    product_name: 'Producto D',
    stock_measurement_unit: { symbol: 'kg' },
    total_difference: "5.0000",
    affected_orders_count: 2,
    affected_stops_count: 2,
    status: 'pending',
    contains_extra_sale: false,
    can_batch_resolve: true,
    items: [
        {
            route_stop_item_id: 'item-1',
            product_id: 'product-1',
            product_name: 'Producto D',
            quantity_loaded: "3.0000",
            quantity_delivered: "1.0000",
            difference: "2.0000",
            extra_sale_allocated: "0.0000",
            stock_measurement_unit: { symbol: 'kg' },
            discrepancy: null,
            stop_id: 'stop-1',
            sequence: 1,
            order_id: 'order-1',
            order_number: 'P-000001',
            customer_name: 'Dina Capuzello',
        },
        {
            route_stop_item_id: 'item-2',
            product_id: 'product-1',
            product_name: 'Producto D',
            quantity_loaded: "4.0000",
            quantity_delivered: "1.0000",
            difference: "3.0000",
            extra_sale_allocated: "0.0000",
            stock_measurement_unit: { symbol: 'kg' },
            discrepancy: null,
            stop_id: 'stop-2',
            sequence: 2,
            order_id: 'order-2',
            order_number: 'P-000002',
            customer_name: 'Juan Pérez',
        },
    ],
};

const renderTable = (groups: RouteReconciliationProductGroup[]) => {
    return render(
        <DiscrepancyGroupsTable
            groups={groups}
            loading={false}
            actionLoading={false}
            onResolve={vi.fn()}
            onResolveBatch={vi.fn()}
            readOnly={false}
        />
    );
};

test('renders one product summary and preserves route stop item detail', () => {
    renderTable([pendingGroup]);
    const desktop = document.querySelector('.reconciliationDesktopTable') as HTMLElement;
    const mobile = screen.getByTestId('discrepancies-mobile-list');

    expect(within(desktop).getByText('Producto D')).toBeInTheDocument();
    expect(within(mobile).getByText('Producto D')).toBeInTheDocument();
    expect(within(mobile).getByText('Diferencia')).toBeInTheDocument();
    expect(within(mobile).getByText('5 kg')).toBeInTheDocument();
    expect(within(mobile).getByRole('button', { name: 'Conciliar producto' })).toBeInTheDocument();

    fireEvent.click(within(desktop).getByRole('button', { name: 'Ver detalle' }));

    expect(screen.getAllByText('P-000001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dina Capuzello').length).toBeGreaterThan(0);
    expect(screen.getAllByText('P-000002').length).toBeGreaterThan(0);
});

test('forces detail when the group contains an extra sale', () => {
    renderTable([
        {
            ...pendingGroup,
            contains_extra_sale: true,
            can_batch_resolve: false,
        },
    ]);

    const desktop = document.querySelector('.reconciliationDesktopTable') as HTMLElement;
    const mobile = screen.getByTestId('discrepancies-mobile-list');
    expect(within(desktop).queryByRole('button', { name: 'Conciliar producto' })).not.toBeInTheDocument();
    expect(within(mobile).queryByRole('button', { name: 'Conciliar producto' })).not.toBeInTheDocument();
    expect(within(mobile).getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument();
});

test('builds a batch with each route stop item and its full difference', async () => {
    const user = userEvent.setup();
    const onResolveBatch = vi.fn().mockResolvedValue(undefined);

    render(
        <DiscrepancyGroupsTable
            groups={[pendingGroup]}
            loading={false}
            actionLoading={false}
            onResolve={vi.fn()}
            onResolveBatch={onResolveBatch}
            readOnly={false}
        />
    );

    const desktop = document.querySelector('.reconciliationDesktopTable') as HTMLElement;
    await user.click(within(desktop).getByRole('button', { name: 'Conciliar producto' }));
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Devuelto a depósito'));
    await user.click(screen.getByRole('button', { name: 'Aplicar a todos' }));

    expect(onResolveBatch).toHaveBeenCalledWith({
        items: [
            {
                route_stop_item_id: 'item-1',
                resolution_type: 'returned',
                quantity_to_resolve: "2.0000",
                notes: undefined,
            },
            {
                route_stop_item_id: 'item-2',
                resolution_type: 'returned',
                quantity_to_resolve: "3.0000",
                notes: undefined,
            },
        ],
    });
}, 15000);
