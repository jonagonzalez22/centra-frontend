import { fireEvent, render, screen } from '@testing-library/react';
import type { Dayjs } from 'dayjs';
import { vi } from 'vitest';
import type { Customer } from '@features/store/customers/types/customer.types';
import { usePOSStore } from '../../stores/usePOSStore';
import { POSOperationConfig } from './POSOperationConfig';

const customerSearch = vi.hoisted(() => ({
    query: '',
    results: [] as Array<{ id: string; display_name: string; document_number: string | null }>,
    loading: false,
    setQuery: vi.fn(),
}));

vi.mock('../../hooks/useCustomerSearch', () => ({
    useCustomerSearch: () => customerSearch,
}));

interface DatePickerProps {
    value?: Dayjs | null;
    format?: string;
    onChange?: (date: Dayjs | null) => void;
}

interface SelectOption {
  label: React.ReactNode;
  value?: string;
    options?: SelectOption[];
}

interface SelectProps {
  allowClear?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  searchValue?: string;
  value?: string;
  labelRender?: (props: { value?: string; label?: React.ReactNode }) => React.ReactNode;
  popupRender?: (menu: React.ReactNode) => React.ReactNode;
    onClear?: () => void;
    onSearch?: (value: string) => void;
    onSelect?: (value: string) => void;
}

vi.mock('antd', async () => {
    const dayjs = (await import('dayjs')).default;

    return {
        Segmented: () => <div />,
        Select: ({
            allowClear,
      options = [],
      placeholder,
      searchValue,
      value,
      labelRender,
      popupRender,
            onClear,
            onSearch,
            onSelect,
        }: SelectProps) => {
      const flattenedOptions = options.flatMap((option) => option.options ?? [option]);
      const selectedOption = flattenedOptions.find((option) => option.value === value);

      const menu = (
        <>
          {options
            .filter((option) => option.options)
            .map((option, index) => (
              <div key={`group-${index}`}>{option.label}</div>
            ))}
          {flattenedOptions.map((option) => (
            <button key={option.value} onClick={() => onSelect?.(option.value!)}>
              {option.label}
            </button>
          ))}
        </>
      );

      return (
        <div>
                    <input
                        aria-label={placeholder}
                        value={searchValue}
                        onChange={(event) => onSearch?.(event.target.value)}
                    />
          {allowClear && (
                        <button aria-label="Limpiar cliente" onClick={onClear}>
                            Limpiar
                        </button>
          )}
          {value && labelRender && (
            <div data-testid="selected-customer-value">
              {labelRender({ value, label: selectedOption?.label })}
            </div>
          )}
          {popupRender ? popupRender(menu) : menu}
                </div>
            );
        },
        DatePicker: ({ value, format, onChange }: DatePickerProps) => (
            <button aria-label="Fecha de entrega" onClick={() => onChange?.(dayjs('2026-09-20'))}>
                {value?.format(format)}
            </button>
        ),
    };
});

const customer = {
    id: 'customer-1',
    display_name: 'Pepe González',
    document_number: '20123456789',
    document_type: { name: 'CUIT' },
} as Customer;

beforeEach(() => {
    usePOSStore.getState().resetPOS();
    customerSearch.query = '';
    customerSearch.results = [];
    customerSearch.loading = false;
    customerSearch.setQuery.mockClear();
});

test('shows one hybrid customer control and delegates typed searches to the existing hook', () => {
    render(<POSOperationConfig />);

    const customerInput = screen.getByRole('textbox', { name: 'Buscar o ingresar nombre...' });
    expect(customerInput).toBeInTheDocument();
    expect(screen.queryByText('Ingresar nombre')).not.toBeInTheDocument();
    expect(screen.queryByText('Buscar cliente registrado')).not.toBeInTheDocument();

    fireEvent.change(customerInput, { target: { value: 'Pepe' } });
    expect(customerSearch.setQuery).toHaveBeenCalledWith('Pepe');
});

test('shows registered customers and an explicit one-time name option', () => {
    customerSearch.query = 'Pepe';
    customerSearch.results = [customer];

    render(<POSOperationConfig />);

    expect(screen.getByText('Pepe González')).toBeInTheDocument();
    expect(screen.queryByText('Clientes registrados')).not.toBeInTheDocument();
    expect(screen.getByText('CUIT 20123456789')).toBeInTheDocument();
    expect(screen.getByText('Usar “Pepe” para esta venta')).toBeInTheDocument();
});

test('selecting a registered customer clears the one-time name', () => {
    customerSearch.query = 'Pepe';
    customerSearch.results = [customer];
    usePOSStore.getState().setCustomerDisplayName('Federico');

    render(<POSOperationConfig />);
    fireEvent.click(screen.getByText('Pepe González'));

  expect(usePOSStore.getState()).toMatchObject({
    customer,
    customer_display_name: null,
    });
    expect(screen.getByTestId('selected-customer-value')).toHaveTextContent('Pepe González');
    expect(screen.getByTestId('selected-customer-value')).not.toHaveTextContent('Cliente registrado');
});

test('allows a name with no registered customer and clears it through the same control', () => {
    customerSearch.query = '  Federico  ';

    render(<POSOperationConfig />);
    fireEvent.click(screen.getByText('Usar “Federico” para esta venta'));

  expect(usePOSStore.getState()).toMatchObject({
    customer: null,
    customer_display_name: 'Federico',
  });
  expect(screen.getByTestId('selected-customer-value')).toHaveTextContent('Federico');
  expect(screen.getByTestId('selected-customer-value')).toHaveTextContent('Solo para esta venta');
  expect(screen.getByTestId('selected-customer-value')).not.toHaveTextContent('Usar');

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar cliente' }));
    expect(usePOSStore.getState()).toMatchObject({
        customer: null,
        customer_display_name: null,
    });
});

test('keeps orders restricted to registered customers and preserves the delivery date format', () => {
    usePOSStore.getState().setCustomerDisplayName('Federico');
    usePOSStore.getState().setType('order');
    usePOSStore.getState().setRequestedDeliveryDate('2026-09-18');
    customerSearch.query = 'Pepe';
    customerSearch.results = [customer];

    render(<POSOperationConfig />);

    expect(usePOSStore.getState().customer_display_name).toBeNull();
    expect(screen.getByText('Pepe González')).toBeInTheDocument();
    expect(screen.queryByText(/solo para esta venta/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fecha de entrega' })).toHaveTextContent(
        '18/09/2026'
    );
});

test('limits the searchable and one-time name text to 100 characters', () => {
    render(<POSOperationConfig />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar o ingresar nombre...' }), {
        target: { value: 'a'.repeat(101) },
    });

    expect(customerSearch.setQuery).toHaveBeenCalledWith('a'.repeat(100));
});
