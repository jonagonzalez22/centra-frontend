import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { usePOSStore } from '../../stores/usePOSStore';
import { SalesService } from '../../services/sales.service';
import { POSPaymentModal } from './POSPaymentModal';

vi.mock('../../services/sales.service', () => ({
  SalesService: { getPaymentMethods: vi.fn(), createOperation: vi.fn() },
}));

beforeEach(() => {
  usePOSStore.getState().resetPOS();
  usePOSStore.getState().addItem({
    id: 'product-1',
    name: 'Martillo',
    sku: 'MAR-1',
    barcode: null,
    price: 1000,
    available_stock: "10.0000",
  });
  vi.mocked(SalesService.getPaymentMethods).mockResolvedValue([
    {
      id: 'cash-store',
      name: 'Efectivo',
      code: 'cash',
      requires_reference: false,
    },
    {
      id: 'transfer-store',
      name: 'Transferencia',
      code: 'transfer',
      requires_reference: false,
    },
  ]);
  vi.mocked(SalesService.createOperation).mockResolvedValue({
    id: 'sale-1',
    operation_number: 'V-000123',
    type: 'sale',
    status: 'confirmed',
    total: 1000,
    customer_display_name: null,
    created_at: '2026-09-19 11:03:00',
  });
});

test('resets the POS and reports the created sale to its parent after payment succeeds', async () => {
  const user = userEvent.setup();
  const onSuccess = vi.fn();
  render(<POSPaymentModal open onClose={vi.fn()} onSuccess={onSuccess} />);

  await waitFor(() => expect(SalesService.getPaymentMethods).toHaveBeenCalled());
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByText('Efectivo'));
  await user.type(screen.getByRole('spinbutton'), '1000');
  await user.click(screen.getByRole('button', { name: /Cobrar/ }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'sale-1' })));
  expect(SalesService.createOperation).toHaveBeenCalledWith(expect.objectContaining({
    payments: [{ store_payment_method_id: 'cash-store', amount: 1000 }],
  }));
  expect(usePOSStore.getState().items).toEqual([]);
});

test('applies only the sale total when cash received is greater and shows the change', async () => {
  const user = userEvent.setup();
  render(<POSPaymentModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

  await waitFor(() => expect(SalesService.getPaymentMethods).toHaveBeenCalled());
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByText('Efectivo'));
  await user.type(screen.getByRole('spinbutton', { name: 'Efectivo recibido' }), '2000');

  const summary = screen.getByRole('region', { name: 'Resumen del pago' });
  expect(summary).toHaveTextContent('Efectivo recibido');
  expect(summary).toHaveTextContent('2.000,00');
  expect(summary).toHaveTextContent('Importe aplicado');
  expect(summary).toHaveTextContent('1.000,00');
  expect(summary).toHaveTextContent('Vuelto');
  expect(summary).toHaveTextContent('1.000,00');

  await user.click(screen.getByRole('button', { name: /Cobrar/ }));
  await waitFor(() => expect(SalesService.createOperation).toHaveBeenCalledWith(expect.objectContaining({
    payments: [{ store_payment_method_id: 'cash-store', amount: 1000 }],
  })));
});

test('keeps insufficient cash as a partial amount and does not submit a sale', async () => {
  const user = userEvent.setup();
  render(<POSPaymentModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

  await waitFor(() => expect(SalesService.getPaymentMethods).toHaveBeenCalled());
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByText('Efectivo'));
  await user.type(screen.getByRole('spinbutton', { name: 'Efectivo recibido' }), '800');

  expect(screen.getByRole('region', { name: 'Resumen del pago' })).toHaveTextContent('Falta');
  expect(screen.getByRole('button', { name: /Cobrar/ })).toBeDisabled();
});

test('prevents duplicate payment creation while the first submission is pending', async () => {
  const user = userEvent.setup();
  const onSuccess = vi.fn();
  let resolveOperation: (operation: {
    id: string;
    operation_number: string;
    type: 'sale';
    status: string;
    total: number;
    customer_display_name: null;
    created_at: string;
  }) => void;
  const pendingOperation = new Promise<{
    id: string;
    operation_number: string;
    type: 'sale';
    status: string;
    total: number;
    customer_display_name: null;
    created_at: string;
  }>((resolve) => {
    resolveOperation = resolve;
  });
  vi.mocked(SalesService.createOperation).mockClear();
  vi.mocked(SalesService.createOperation).mockImplementationOnce(() => pendingOperation);
  render(<POSPaymentModal open onClose={vi.fn()} onSuccess={onSuccess} />);

  await waitFor(() => expect(SalesService.getPaymentMethods).toHaveBeenCalled());
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByText('Efectivo'));
  await user.type(screen.getByRole('spinbutton', { name: 'Efectivo recibido' }), '1000');
  const submit = screen.getByRole('button', { name: /Cobrar/ });
  await user.click(submit);
  await user.click(submit);

  expect(SalesService.createOperation).toHaveBeenCalledTimes(1);
  resolveOperation!({
    id: 'sale-1', operation_number: 'V-000123', type: 'sale', status: 'confirmed', total: 1000,
    customer_display_name: null, created_at: '2026-09-19 11:03:00',
  });
  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
});

test('applies cash only to the balance after a transfer in mixed payments', async () => {
  const user = userEvent.setup();
  usePOSStore.setState((state) => ({
    items: state.items.map((item) => ({ ...item, quantity: '20.0000', subtotal: 20000 })),
  }));
  render(<POSPaymentModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

  await waitFor(() => expect(SalesService.getPaymentMethods).toHaveBeenCalled());
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByText('Transferencia'));
  await user.type(screen.getByRole('spinbutton', { name: 'Importe aplicado' }), '8000');
  await user.click(screen.getByRole('button', { name: 'Agregar otro medio de pago' }));
  await user.click(screen.getAllByRole('combobox')[1]);
  const cashOptions = await screen.findAllByText('Efectivo');
  await user.click(cashOptions[cashOptions.length - 1]);
  await user.type(screen.getByRole('spinbutton', { name: 'Efectivo recibido' }), '15000');

  expect(screen.getByRole('region', { name: 'Resumen del pago' })).toHaveTextContent('Vuelto');
  expect(screen.getByRole('region', { name: 'Resumen del pago' })).toHaveTextContent('3.000,00');
  await user.click(screen.getByRole('button', { name: /Cobrar/ }));

  await waitFor(() => expect(SalesService.createOperation).toHaveBeenCalledWith(expect.objectContaining({
    payments: [
      { store_payment_method_id: 'transfer-store', amount: 8000 },
      { store_payment_method_id: 'cash-store', amount: 12000 },
    ],
  })));
});

test('preserves cents for a discounted sale and clears a received amount when its method changes', async () => {
  const user = userEvent.setup();
  usePOSStore.getState().changeItemPriceList('product-1:common', 'wholesale', 'Mayorista', 10);
  render(<POSPaymentModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

  await waitFor(() => expect(SalesService.getPaymentMethods).toHaveBeenCalled());
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByText('Efectivo'));
  await user.type(screen.getByRole('spinbutton', { name: 'Efectivo recibido' }), '950.75');
  expect(screen.getByRole('region', { name: 'Resumen del pago' })).toHaveTextContent('50,75');

  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByText('Transferencia'));
  expect(screen.getByRole('spinbutton', { name: 'Importe aplicado' })).toHaveValue('');
});

test('uses the mobile payment drawer summary and keeps its actions separate from multiple payment rows', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<POSPaymentModal open onClose={onClose} onSuccess={vi.fn()} />);

  await waitFor(() => expect(SalesService.getPaymentMethods).toHaveBeenCalled());
  expect(screen.getByText('Total a cobrar')).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Resumen del pago' })).toHaveTextContent('Total');
  expect(screen.getByRole('region', { name: 'Resumen del pago' })).toHaveTextContent('Importe aplicado');
  expect(screen.getByRole('region', { name: 'Resumen del pago' })).toHaveTextContent('Falta');
  expect(screen.getByRole('region', { name: 'Resumen del pago' })).not.toHaveTextContent('Descuentos');
  expect(screen.getByRole('button', { name: /Cobrar/ })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: 'Agregar otro medio de pago' }));
  expect(screen.getAllByRole('combobox')).toHaveLength(2);

  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('shows the persisted line discount in the mobile payment summary', async () => {
  usePOSStore.getState().changeItemPriceList('product-1:common', 'wholesale', 'Mayorista', 10);
  render(<POSPaymentModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

  await waitFor(() => expect(SalesService.getPaymentMethods).toHaveBeenCalled());
  const summary = screen.getByRole('region', { name: 'Resumen del pago' });
  expect(summary).toHaveTextContent('Subtotal');
  expect(summary).toHaveTextContent('Descuentos');
  expect(summary).toHaveTextContent('Total');
  expect(summary).toHaveTextContent('100');
  expect(summary).toHaveTextContent('900');
});
