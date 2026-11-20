import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ProductsContext } from '../../context/ProductsContext';
import { ProductsSearchBar } from './ProductsSearchBar';
import type { UseProductsReturn } from '../../hooks/useProducts';
import type { ProductsFilters } from '../../interfaces/product.interface';

vi.mock('@/components/InputField/InputField', async () => {
    const { Form } = await import('antd');
    return {
        default: ({ name, label }: { name: string; label?: string }) => (
            <Form.Item name={name} label={label}>
                <input aria-label={label ?? name} />
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
                <select aria-label={label ?? name}>
                    <option value="" />
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </Form.Item>
        ),
    };
});

const setFilters = vi.fn();
const context: UseProductsReturn = {
    items: [],
    loading: false,
    error: null,
    pagination: { current: 2, total: 20, pageSize: 15, totalPages: 2 },
    filters: {},
    categories: [{ id: 'cat-1', name: 'Bebidas', description: null, is_active: true }],
    categoriesLoading: false,
    brands: [{ id: 'brand-1', name: 'CENTRA', is_active: true }],
    setPage: vi.fn(),
    setPerPage: vi.fn(),
    setFilters,
    refresh: vi.fn(),
    deleteProduct: vi.fn(),
};
const renderSearchBar = (filters: ProductsFilters = {}) =>
    render(
        <ProductsContext.Provider value={{ ...context, filters }}>
            <ProductsSearchBar />
        </ProductsContext.Provider>
    );

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
});
afterEach(() => vi.useRealTimers());

test('renders primary filters and opens advanced filters only on demand', () => {
    renderSearchBar();
    ['Buscar', 'Categoría', 'Estado'].forEach((label) =>
        expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
    expect(screen.queryByLabelText('Marca')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Más filtros' }));
    ['Marca', 'Tipo de stock', 'Disponibilidad para venta', 'Situación de stock'].forEach((label) =>
        expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
});

test('does not apply advanced changes when the drawer closes', () => {
    renderSearchBar();
    fireEvent.click(screen.getByRole('button', { name: 'Más filtros' }));
    fireEvent.change(screen.getByLabelText('Tipo de stock'), { target: { value: 'own' } });
    fireEvent.click(screen.getByLabelText('Close'));
    expect(setFilters).not.toHaveBeenCalled();
});

test('applies advanced filters and preserves the unified search', () => {
    renderSearchBar({ q: 'Agua' });
    fireEvent.click(screen.getByRole('button', { name: 'Más filtros' }));
    fireEvent.change(screen.getByLabelText('Tipo de stock'), { target: { value: 'shared' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(setFilters).toHaveBeenLastCalledWith({ q: 'Agua', stock_type: 'shared' });
});

test('clears only advanced filters from the drawer', () => {
    renderSearchBar({ q: 'Agua', stock_type: 'shared', stock_status: 'out' });
    fireEvent.click(screen.getByRole('button', { name: /Más filtros/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(setFilters).toHaveBeenLastCalledWith({ q: 'Agua' });
});

test('shows advanced count, friendly chips, and removes only the selected chip', () => {
    renderSearchBar({
        category_id: 'cat-1',
        is_active: false,
        stock_type: 'own',
        is_sellable: true,
    });
    expect(screen.getByRole('button', { name: /Más filtros.*2/ })).toBeInTheDocument();
    const chips = screen.getByLabelText('Filtros aplicados');
    expect(chips).toHaveTextContent('Bebidas');
    expect(chips).toHaveTextContent('Inactivo');
    expect(chips).toHaveTextContent('Propio');
    fireEvent.click(
        screen
            .getAllByLabelText('Close')
            .find((button) => button.parentElement?.textContent?.includes('Tipo de stock'))!
    );
    expect(setFilters).toHaveBeenLastCalledWith({
        category_id: 'cat-1',
        is_active: false,
        is_sellable: true,
    });
});

test('debounces the unified search and clears all filters', () => {
    renderSearchBar({ stock_type: 'own' });
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'PRODUCTO-1' } });
    act(() => vi.advanceTimersByTime(500));
    expect(setFilters).toHaveBeenLastCalledWith({ q: 'PRODUCTO-1', stock_type: 'own' });
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(setFilters).toHaveBeenLastCalledWith({});
});
