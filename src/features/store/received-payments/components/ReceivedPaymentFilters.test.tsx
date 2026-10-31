import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReceivedPaymentsService } from '../services/received-payments.service';
import { ReceivedPaymentFilters } from './ReceivedPaymentFilters';

vi.mock('../services/received-payments.service');

const filters = { page: 1, per_page: 20 };

beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    vi.mocked(ReceivedPaymentsService.getFilterOptions).mockResolvedValue({
        payment_methods: [],
        collectors: [],
    });
});

test('keeps text focus and debounces reference searches', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<ReceivedPaymentFilters filters={filters} onChange={onChange} onReset={vi.fn()} />);
    const input = screen.getByLabelText('Referencia');
    input.focus();
    fireEvent.change(input, { target: { value: 'P-000022' } });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('P-000022');
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ operation_number: 'P-000022' })
    );
    vi.useRealTimers();
});

test('clears all filters', async () => {
    const onReset = vi.fn();
    render(
        <ReceivedPaymentFilters
            filters={{ ...filters, customer: 'Sandra' }}
            onChange={vi.fn()}
            onReset={onReset}
        />
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Limpiar' })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(onReset).toHaveBeenCalledOnce();
});

test('keeps secondary filters hidden until more filters is opened', () => {
    render(<ReceivedPaymentFilters filters={filters} onChange={vi.fn()} onReset={vi.fn()} />);
    expect(screen.queryByLabelText('Medio')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Más filtros' }));
    expect(screen.getByLabelText('Medio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Más filtros/ })).toHaveAttribute(
        'aria-expanded',
        'true'
    );
});

test('uses a batch filter drawer on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    const onChange = vi.fn();
    render(<ReceivedPaymentFilters filters={filters} onChange={onChange} onReset={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Referencia')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    fireEvent.change(screen.getByLabelText('Referencia'), { target: { value: 'P-000022' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ operation_number: 'P-000022' })
    );
});

test('keeps the mobile filter entry point usable at 320px', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    render(<ReceivedPaymentFilters filters={filters} onChange={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Filtros/ })).toBeVisible();
});

test('shows active filter tags on desktop and mobile and removes only the closed filter', () => {
    const onChange = vi.fn();
    const applied = {
        ...filters,
        operation_number: 'P-000022',
        origin: 'route_collection' as const,
    };
    const { rerender } = render(
        <ReceivedPaymentFilters filters={applied} onChange={onChange} onReset={vi.fn()} />
    );
    expect(screen.getByText('P-000022')).toBeInTheDocument();
    expect(screen.getByText('Cobranza de ruta')).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText('Close')[0]);
    expect(onChange).toHaveBeenCalledWith({ operation_number: undefined });

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    rerender(<ReceivedPaymentFilters filters={applied} onChange={onChange} onReset={vi.fn()} />);
    expect(screen.getByText('P-000022')).toBeInTheDocument();
    expect(screen.getByText('Cobranza de ruta')).toBeInTheDocument();
});

test('keeps clear enabled and advanced drawer filters applied only after Apply', () => {
    const onChange = vi.fn();
    const applied = { ...filters, status: 'active' as const };
    render(<ReceivedPaymentFilters filters={applied} onChange={onChange} onReset={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Limpiar' })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Más filtros/ }));
    expect(screen.getByText('Más filtros', { selector: '.ant-drawer-title' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Limpiar' })[1]);
    expect(onChange).not.toHaveBeenCalled();
});

test('preserves a date filter when applying a payment method from the drawer (case A)', () => {
    const onChange = vi.fn();
    render(
        <ReceivedPaymentFilters
            filters={{ ...filters, date_from: '2026-10-01' }}
            onChange={onChange}
            onReset={vi.fn()}
        />
    );
    fireEvent.click(screen.getByRole('button', { name: /Más filtros/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ store_payment_method_id: undefined })
    );
    expect(onChange.mock.calls[0][0]).not.toHaveProperty('date_from');
});

test('preserves a payment method when changing customer (case B)', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
        <ReceivedPaymentFilters
            filters={{ ...filters, store_payment_method_id: 'cash' }}
            onChange={onChange}
            onReset={vi.fn()}
        />
    );
    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Ana' } });
    act(() => vi.advanceTimersByTime(300));
    expect(onChange).toHaveBeenCalledWith({ customer: 'Ana' });
    vi.useRealTimers();
});

test('keeps date, customer, method and origin represented together (case C)', () => {
    render(
        <ReceivedPaymentFilters
            filters={{
                ...filters,
                date_from: '2026-10-01',
                customer: 'Ana',
                store_payment_method_id: 'cash',
                origin: 'route_collection',
            }}
            onChange={vi.fn()}
            onReset={vi.fn()}
        />
    );
    const chips = screen.getByLabelText('Filtros aplicados');
    expect(chips).toHaveTextContent('Fecha');
    expect(chips).toHaveTextContent('Cliente');
    expect(chips).toHaveTextContent('Medio');
    expect(chips).toHaveTextContent('Origen');
});

test('removing the method chip changes only the method (case D)', () => {
    const onChange = vi.fn();
    render(
        <ReceivedPaymentFilters
            filters={{
                ...filters,
                customer: 'Ana',
                store_payment_method_id: 'cash',
                origin: 'route_collection',
            }}
            onChange={onChange}
            onReset={vi.fn()}
        />
    );
    fireEvent.click(
        screen
            .getAllByLabelText('Close')
            .find((button) => button.parentElement?.textContent?.includes('Medio'))!
    );
    expect(onChange).toHaveBeenCalledWith({ store_payment_method_id: undefined });
});

test('cancels a pending text debounce before applying the drawer (case E)', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<ReceivedPaymentFilters filters={filters} onChange={onChange} onReset={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Valor viejo' } });
    fireEvent.click(screen.getByRole('button', { name: /Más filtros/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    act(() => vi.advanceTimersByTime(300));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).not.toHaveProperty('customer');
    vi.useRealTimers();
});

test('loads collectors from filter-options and renders a removable collected-by chip', async () => {
    vi.mocked(ReceivedPaymentsService.getFilterOptions).mockResolvedValue({
        payment_methods: [],
        collectors: [{ id: 'hector', name: 'Hector Videla' }],
    });
    const onChange = vi.fn();
    render(
        <ReceivedPaymentFilters
            filters={{ ...filters, collected_by: 'hector' }}
            onChange={onChange}
            onReset={vi.fn()}
        />
    );
    await waitFor(() => expect(screen.getByText('Hector Videla')).toBeInTheDocument());
    fireEvent.click(
        screen
            .getAllByLabelText('Close')
            .find((button) => button.parentElement?.textContent?.includes('Cobrado por'))!
    );
    expect(onChange).toHaveBeenCalledWith({ collected_by: undefined });
});
