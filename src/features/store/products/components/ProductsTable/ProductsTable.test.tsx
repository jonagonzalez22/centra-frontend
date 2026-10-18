import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { ProductsContext } from '../../context/ProductsContext';
import { ProductsTable } from './ProductsTable';
import type { Product } from '../../interfaces/product.interface';
import type { UseProductsReturn } from '../../hooks/useProducts';

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
            title?: ReactNode;
            dataIndex?: string;
            render?: (value: unknown, record: Record<string, unknown>) => ReactNode;
        }>;
        dataSource: Array<Record<string, unknown>>;
    }) => (
        <div>
            <div data-testid="headers">
                {columns.map((column) => <span key={column.key}>{column.title}</span>)}
            </div>
            {dataSource.map((record) => (
                <div key={String(record.id)} data-testid={`row-${String(record.id)}`}>
                    {columns.map((column) => (
                        <div key={column.key} data-testid={`cell-${column.key}`}>
                            {column.render ? column.render(column.dataIndex ? record[column.dataIndex] : undefined, record) : null}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ),
}));

const product = (overrides: Partial<Product> = {}): Product => ({
    id: 'product-1',
    name: 'Producto',
    sku: 'PRODUCTO-1',
    barcode: null,
    description: null,
    price: '100.00',
    cost: null,
    stock: '1.0000',
    stock_reserved: '0.0000',
    available_stock: '1.0000',
    stock_min: '2.0000',
    stock_measurement_unit_id: 'unit-1',
    stock_measurement_unit: { id: 'unit-1', code: 'unit', name: 'Unidad', symbol: 'u', category: 'unit' },
    stock_source_product: null,
    stock_consumption_quantity: null,
    sale_quantity_step: '1.0000',
    commercial_available_quantity: '1.0000',
    is_active: true,
    is_sellable: true,
    category: { id: 'category-1', name: 'General' },
    parent_product_id: null,
    created_at: '2026-01-01T00:00:00.000000Z',
    updated_at: '2026-01-01T00:00:00.000000Z',
    ...overrides,
});

const renderTable = (items: Product[]) => {
    const context: UseProductsReturn = {
        items,
        loading: false,
        error: null,
        pagination: { current: 1, total: items.length, pageSize: 15, totalPages: 1 },
        filters: {},
        categories: [],
        categoriesLoading: false,
        setPage: vi.fn(),
        setPerPage: vi.fn(),
        setFilters: vi.fn(),
        refresh: vi.fn(),
        deleteProduct: vi.fn(),
    };

    return render(
        <ProductsContext.Provider value={context}>
            <ProductsTable onEdit={vi.fn()} onDelete={vi.fn()} onView={vi.fn()} />
        </ProductsContext.Provider>,
    );
};

describe('ProductsTable shared stock display', () => {
    it('labels the commercial identifier as Código', () => {
        renderTable([product()]);

        expect(within(screen.getByTestId('headers')).getByText('Código')).toBeInTheDocument();
        expect(screen.queryByText('SKU')).not.toBeInTheDocument();
    });

    it('shows physical stock and Stock bajo for a low-stock product with its own stock', () => {
        renderTable([product({ stock_reserved: '0.5000' })]);

        const row = within(screen.getByTestId('row-product-1'));
        expect(row.getByTestId('cell-stock')).toHaveTextContent('1 u');
        expect(row.getByTestId('cell-stock_reserved')).toHaveTextContent('0,5 u');
        expect(row.getByTestId('cell-stock_type')).toHaveTextContent('Propio');
        expect(row.getByTestId('cell-is_sellable')).toHaveTextContent('Disponible');
        expect(screen.getByText('Stock bajo')).toBeInTheDocument();
    });

    it('hides physical stock but keeps derived commercial availability for a shared-stock product', () => {
        renderTable([product({
            name: 'Bidón asociado',
            stock: '0.0000',
            stock_reserved: '5.0000',
            available_stock: '0.0000',
            stock_min: '0.0000',
            commercial_available_quantity: '2.0000',
            is_sellable: false,
            stock_source_product: {
                id: 'source-1',
                name: 'Producto fuente',
                sku: 'FUENTE-1',
                stock_measurement_unit: { id: 'unit-1', code: 'unit', name: 'Unidad', symbol: 'u', category: 'unit' },
            },
        })]);

        expect(screen.queryByText('Stock bajo')).not.toBeInTheDocument();
        const row = within(screen.getByTestId('row-product-1'));
        expect(row.getByTestId('cell-stock')).toHaveTextContent('—');
        expect(row.getByTestId('cell-stock_reserved')).toHaveTextContent('—');
        expect(row.getByTestId('cell-available_stock')).toHaveTextContent('2 u');
        expect(row.getByTestId('cell-stock_type')).toHaveTextContent('Compartido');
        expect(row.getByTestId('cell-is_sellable')).toHaveTextContent('No disponible');
    });
});
