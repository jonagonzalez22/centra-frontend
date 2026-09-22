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
    available_stock: 10,
  });
  vi.mocked(SalesService.getPaymentMethods).mockResolvedValue([
    {
      id: 'cash-global',
      store_payment_method_id: 'cash-store',
      name: 'Efectivo',
      code: 'cash',
      icon: null,
      is_active: true,
      is_enabled: true,
      custom_name: null,
      requires_reference: false,
      account_details: null,
      sort_order: 0,
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
  expect(usePOSStore.getState().items).toEqual([]);
});
