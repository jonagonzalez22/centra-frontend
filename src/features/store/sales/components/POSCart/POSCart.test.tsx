import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { usePOSStore } from '../../stores/usePOSStore';
import { POSCart } from './POSCart';
import { POSTotals } from '../POSTotals/POSTotals';

interface TestSelectProps {
    'aria-label': string;
    value: string;
    options: Array<{ value: string; label: ReactNode }>;
    onChange: (value: string) => void;
}

vi.mock('antd', async (importOriginal) => {
    const actual = await importOriginal<typeof import('antd')>();
    return {
        ...actual,
        Select: ({ 'aria-label': ariaLabel, value, options, onChange }: TestSelectProps) => (
            <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)}>
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        ),
    };
});

const product = {
    id: 'paper-1', name: 'Papel higiénico', sku: 'PAP-1', barcode: null, price: 25000,
    commercial_available_quantity: '10.0000', sale_quantity_step: '1.0000',
    stock_measurement_unit_symbol: 'u',
};

const liquidProduct = {
    ...product,
    id: 'bleach-1',
    name: 'Cloro suelto',
    commercial_available_quantity: '100.0000',
    sale_quantity_step: '0.2500',
    stock_measurement_unit_symbol: 'L',
};

const lists = [
    { id: 'wholesale-id', name: 'Mayorista', discount_percentage: '10.00', is_active: true, created_at: '', updated_at: '' },
    { id: 'distributor-id', name: 'Distribuidor', discount_percentage: '15.00', is_active: true, created_at: '', updated_at: '' },
    { id: 'zero-id', name: 'Convenio Empresa X', discount_percentage: '0.00', is_active: true, created_at: '', updated_at: '' },
];

beforeEach(() => {
    usePOSStore.getState().resetPOS();
    usePOSStore.getState().setAvailablePriceLists(lists);
    usePOSStore.getState().addItem(product);
});

test('shows the line selector with virtual Common and active lists and changes only that line', async () => {
    const { container } = render(<POSCart />);

    const selectors = screen.getAllByRole('combobox', { name: 'Lista de precios de Papel higiénico' });
    expect(container.querySelector('.pos-cart-scroll')).toHaveClass(
        'min-h-0',
        'lg:h-full',
        'lg:flex-1'
    );
    expect(container.querySelector('.pos-cart-table')).toBeInTheDocument();
    expect(selectors).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Común' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Distribuidor · 15%' })).toBeInTheDocument();
    fireEvent.change(selectors[0], { target: { value: 'wholesale-id' } });

    expect(usePOSStore.getState().items[0]).toMatchObject({
        line_key: 'paper-1:wholesale-id',
        price_list_id: 'wholesale-id',
        discount_percentage: 10,
        discount_amount: 2500,
        subtotal: 25000,
    });
});

test('offers a real zero percent list as a distinct option from Common', async () => {
    render(<POSCart />);

    const selectors = screen.getAllByRole('combobox', { name: 'Lista de precios de Papel higiénico' });
    expect(screen.getByRole('option', { name: 'Común' })).toBeInTheDocument();
    fireEvent.change(selectors[0], { target: { value: 'zero-id' } });

    expect(usePOSStore.getState().items[0]).toMatchObject({
        line_key: 'paper-1:zero-id',
        price_list_id: 'zero-id',
        price_list_name: 'Convenio Empresa X',
        discount_percentage: 0,
        discount_amount: 0,
    });
});

test('merges a changed line into the matching line and updates operation totals immediately', () => {
    const store = usePOSStore.getState();
    store.resetPOS();
    store.setAvailablePriceLists(lists);
    store.setSelectedPriceListId('wholesale-id', 'Mayorista', 10);
    store.addItem(product);
    store.updateQuantity('paper-1:wholesale-id', '2.0000');
    store.setSelectedPriceListId(null);
    store.addItem(product);

    render(<><POSCart /><POSTotals /></>);
    const lineSelectors = screen.getAllByRole('combobox', { name: 'Lista de precios de Papel higiénico' });
    fireEvent.change(lineSelectors[1], { target: { value: 'wholesale-id' } });

    expect(usePOSStore.getState().items).toHaveLength(1);
    expect(usePOSStore.getState().items[0]).toMatchObject({
        line_key: 'paper-1:wholesale-id', quantity: '3.0000', subtotal: 75000, discount_amount: 7500,
    });
    expect(screen.getByText('$75.000')).toBeInTheDocument();
    expect(screen.getByText('-$7.500')).toBeInTheDocument();
    expect(screen.getAllByText('$67.500')).toHaveLength(2);
});

test.each([
    ['1.0000', '1'],
    ['5.0000', '5'],
    ['0.5000', '0,5'],
    ['0.2500', '0,25'],
    ['10.5000', '10,5'],
    ['100.0000', '100'],
])('renders the complete localized quantity %s as %s in the POS stepper', (quantity, displayedQuantity) => {
    const store = usePOSStore.getState();
    store.resetPOS();
    store.setAvailablePriceLists(lists);
    store.addItem(liquidProduct);
    store.updateQuantity('bleach-1:common', quantity);

    render(<POSCart />);

    const input = screen.getByRole('spinbutton', { name: 'Cantidad de Cloro suelto' });
    expect(input).toHaveValue(displayedQuantity);
    expect(input.closest('.ant-input-number')).toHaveClass('w-20');
    expect(screen.getByText('L')).toBeInTheDocument();
});
