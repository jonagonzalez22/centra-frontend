import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ProductsContext } from '../../context/ProductsContext';
import { ProductsSearchBar } from './ProductsSearchBar';
import type { UseProductsReturn } from '../../hooks/useProducts';

vi.mock('@/components/InputField/InputField', async () => {
    const { Form } = await import('antd');
    return {
        default: ({ name, label, placeholder }: { name: string; label?: string; placeholder?: string }) => (
            <Form.Item name={name} label={label}>
                <input aria-label={label ?? name} placeholder={placeholder} />
            </Form.Item>
        ),
    };
});

vi.mock('@/components/SelectField/SelectField', async () => {
    const { Form } = await import('antd');
    return {
        default: ({
            name,
            label,
            options,
        }: {
            name: string;
            label?: string;
            options: Array<{ label: string; value: string }>;
        }) => (
            <Form.Item name={name} label={label}>
                <select aria-label={typeof label === 'string' ? label : name}>
                    <option value="" />
                    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
            </Form.Item>
        ),
    };
});

vi.mock('@/components/Button', () => ({
    Button: ({ label, action }: { label: string; action: () => void }) => <button onClick={action}>{label}</button>,
}));

const setFilters = vi.fn();

const context: UseProductsReturn = {
    items: [], loading: false, error: null,
    pagination: { current: 2, total: 20, pageSize: 15, totalPages: 2 },
    filters: {}, categories: [], categoriesLoading: false,
    setPage: vi.fn(), setPerPage: vi.fn(), setFilters, refresh: vi.fn(), deleteProduct: vi.fn(),
};

const renderSearchBar = () => render(
    <ProductsContext.Provider value={context}>
        <ProductsSearchBar />
    </ProductsContext.Provider>,
);

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
});

afterEach(() => vi.useRealTimers());

test('sends the own stock filter and restarts pagination through setFilters', () => {
    renderSearchBar();
    fireEvent.change(screen.getByLabelText('Tipo de stock'), { target: { value: 'own' } });
    act(() => vi.advanceTimersByTime(500));

    expect(setFilters).toHaveBeenLastCalledWith({ stock_type: 'own' });
});

test('sends the shared stock filter and clears it back to all', () => {
    renderSearchBar();
    const stockType = screen.getByLabelText('Tipo de stock');
    fireEvent.change(stockType, { target: { value: 'shared' } });
    act(() => vi.advanceTimersByTime(500));
    expect(setFilters).toHaveBeenLastCalledWith({ stock_type: 'shared' });

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(setFilters).toHaveBeenLastCalledWith({});
});

test('sends the sellable filter and clears it back to all', () => {
    renderSearchBar();
    const sellable = screen.getByLabelText('Disponible para venta');
    fireEvent.change(sellable, { target: { value: 'false' } });
    act(() => vi.advanceTimersByTime(500));
    expect(setFilters).toHaveBeenLastCalledWith({ is_sellable: false });

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(setFilters).toHaveBeenLastCalledWith({});
});

test('shows Código while preserving the internal sku filter key', () => {
    renderSearchBar();

    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'PRODUCTO-1' } });
    act(() => vi.advanceTimersByTime(500));

    expect(setFilters).toHaveBeenLastCalledWith({ sku: 'PRODUCTO-1' });
    expect(screen.queryByText('SKU')).not.toBeInTheDocument();
});
