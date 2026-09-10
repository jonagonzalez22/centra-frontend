import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderFilters from './OrderFilters';

const selectValue = (label: string) =>
    screen.getByLabelText(label).closest('.ant-select') as HTMLElement;

const option = (label: string) =>
    screen.getAllByText(label).find((element) => element.closest('.ant-select-item-option'))!;

const emptyFilters = { status: undefined, has_pending_balance: undefined };

test('starts with all states and all collection statuses', () => {
    render(
        <OrderFilters
            filters={emptyFilters}
            loading={false}
            onFilterChange={vi.fn()}
            onReset={vi.fn()}
        />
    );

    expect(selectValue('Estado')).toHaveTextContent('Todos');
    expect(selectValue('Cobranza')).toHaveTextContent('Todos');
});

test('sends explicit states and removes status when returning to all', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(
        <OrderFilters
            filters={emptyFilters}
            loading={false}
            onFilterChange={onFilterChange}
            onReset={vi.fn()}
        />
    );

    await user.click(screen.getByLabelText('Estado'));
    await user.click(option('Abierto'));
    await waitFor(() =>
        expect(onFilterChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ status: 'open' })
        )
    );

    await user.click(screen.getByLabelText('Estado'));
    await user.click(option('Entregados'));
    await waitFor(() =>
        expect(onFilterChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ status: 'delivered' })
        )
    );

    await user.click(screen.getByLabelText('Estado'));
    await user.click(option('Todos'));
    await waitFor(() =>
        expect(onFilterChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ status: undefined })
        )
    );
}, 10000);

test('clear filters restores both selectors to all', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(
        <OrderFilters
            filters={emptyFilters}
            loading={false}
            onFilterChange={vi.fn()}
            onReset={onReset}
        />
    );

    await user.click(screen.getByLabelText('Estado'));
    await user.click(option('Entregados'));
    await user.click(screen.getByLabelText('Cobranza'));
    await user.click(option('Con saldo pendiente'));
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(selectValue('Estado')).toHaveTextContent('Todos');
    expect(selectValue('Cobranza')).toHaveTextContent('Todos');
    expect(onReset).toHaveBeenCalledOnce();
}, 10000);
