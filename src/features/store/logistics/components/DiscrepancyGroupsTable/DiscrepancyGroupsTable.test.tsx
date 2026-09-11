import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DiscrepancyGroupsTable } from './DiscrepancyGroupsTable';
import type { RouteReconciliationProductGroup } from '../../interfaces/reconciliation.interface';

const pendingGroup: RouteReconciliationProductGroup = {
    product_id: 'product-1',
    product_name: 'Producto D',
    total_difference: 5,
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
            quantity_loaded: 3,
            quantity_delivered: 1,
            difference: 2,
            extra_sale_allocated: 0,
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
            quantity_loaded: 4,
            quantity_delivered: 1,
            difference: 3,
            extra_sale_allocated: 0,
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
    render(
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

    expect(screen.getByText('Producto D')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conciliar producto' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));

    expect(screen.getByText('P-000001')).toBeInTheDocument();
    expect(screen.getByText('Dina Capuzello')).toBeInTheDocument();
    expect(screen.getByText('P-000002')).toBeInTheDocument();
});

test('forces detail when the group contains an extra sale', () => {
    renderTable([
        {
            ...pendingGroup,
            contains_extra_sale: true,
            can_batch_resolve: false,
        },
    ]);

    expect(screen.queryByRole('button', { name: 'Conciliar producto' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'Conciliar producto' }));
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Devuelto a depósito'));
    await user.click(screen.getByRole('button', { name: 'Aplicar a todos' }));

    expect(onResolveBatch).toHaveBeenCalledWith({
        items: [
            {
                route_stop_item_id: 'item-1',
                resolution_type: 'returned',
                quantity_to_resolve: 2,
                notes: undefined,
            },
            {
                route_stop_item_id: 'item-2',
                resolution_type: 'returned',
                quantity_to_resolve: 3,
                notes: undefined,
            },
        ],
    });
});
