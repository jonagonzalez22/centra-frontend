import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { InventoryMovementsContext } from '../../context/InventoryMovementsContext';
import { MovementsTable } from './MovementsTable';
import type { InventoryMovement } from '../../interfaces/inventory-movement.interface';
import type { UseInventoryMovementsReturn } from '../../hooks/useInventoryMovements';

vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/components/Table/Table', () => ({
    default: ({
        columns,
        dataSource,
    }: {
        columns: Array<{
            key: string;
            dataIndex?: string;
            render?: (value: unknown, record: Record<string, unknown>) => ReactNode;
        }>;
        dataSource: Array<Record<string, unknown>>;
    }) => (
        <div>
            {dataSource.map((record) => (
                <div key={String(record.id)} data-testid={`row-${String(record.id)}`}>
                    {columns.map((column) => (
                        <div key={column.key} data-testid={`cell-${column.key}`}>
                            {column.render
                                ? column.render(column.dataIndex ? record[column.dataIndex] : undefined, record)
                                : record[column.dataIndex ?? column.key] as ReactNode}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ),
}));

const movement = (overrides: Partial<InventoryMovement> = {}): InventoryMovement => ({
    id: 'movement-1',
    product_id: 'product-1',
    type: 'input',
    quantity: '10.0000',
    previous_stock: '0.0000',
    current_stock: '10.0000',
    concept: 'Ingreso',
    user_id: 'user-1',
    created_at: '2026-10-23 10:00:00',
    product: {
        id: 'product-1',
        name: 'Producto',
        sku: 'PRODUCTO-1',
        stock_measurement_unit: { symbol: 'u' },
    },
    user: { id: 'user-1', name: 'Usuario' },
    ...overrides,
});

const renderTable = (items: InventoryMovement[]) => {
    const context: UseInventoryMovementsReturn = {
        items,
        loading: false,
        error: null,
        pagination: { current: 1, total: items.length, pageSize: 15, totalPages: 1 },
        filters: {},
        setPage: vi.fn(),
        setPerPage: vi.fn(),
        setFilters: vi.fn(),
        refresh: vi.fn(),
        adjustStock: vi.fn(),
    };

    return render(
        <InventoryMovementsContext.Provider value={context}>
            <MovementsTable />
        </InventoryMovementsContext.Provider>,
    );
};

describe('MovementsTable quantity', () => {
    it.each([
        ['10.0000', 'u', '10 u'],
        ['2.5000', 'kg', '2,5 kg'],
        ['0.1250', 'L', '0,125 L'],
    ])('renders %s with its UOM as %s', (quantity, symbol, expected) => {
        renderTable([movement({ quantity, product: { ...movement().product, stock_measurement_unit: { symbol } } })]);

        expect(within(screen.getByTestId('row-movement-1')).getByTestId('cell-quantity')).toHaveTextContent(expected);
    });

    it('preserves the direction color for output movements', () => {
        renderTable([movement({ type: 'output', quantity: '-2.5000' })]);

        expect(within(screen.getByTestId('row-movement-1')).getByTestId('cell-quantity').firstElementChild)
            .toHaveClass('text-red-600');
    });
});
