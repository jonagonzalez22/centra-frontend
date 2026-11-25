import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { CashService } from '@/features/store/cash/services/cash.service';
import { SalesService } from '@/features/store/sales/services/sales.service';
import { usePOSStore } from '@/features/store/sales/stores/usePOSStore';
import { useAuthStore } from '@/store/useAuthStore.store';
import { POSPage } from './POSPage';

vi.mock('@/features/store/cash/services/cash.service', () => ({
  CashService: { getCurrent: vi.fn() },
}));

vi.mock('@/features/store/sales/services/sales.service', () => ({
  SalesService: { createOperation: vi.fn() },
}));

vi.mock('./POSPageView', async () => {
  const { usePOSStore } = await import('@/features/store/sales/stores/usePOSStore');

  return {
    POSPageView: ({
      onCheckout,
      onRegisterOrder,
      canCreateOperations,
      allowOrders,
      lockOrderType,
    }: {
      onCheckout: () => void;
      onRegisterOrder: () => void;
      canCreateOperations: boolean;
      allowOrders: boolean;
      lockOrderType: boolean;
    }) => {
      const type = usePOSStore((state) => state.type);

      return (
        <div>
          <button disabled={!canCreateOperations} onClick={onCheckout}>
            Abrir cobro
          </button>
          <button onClick={onRegisterOrder}>Registrar pedido</button>
          <output data-testid="allow-orders">{String(allowOrders)}</output>
          <output data-testid="lock-order-type">{String(lockOrderType)}</output>
          <output data-testid="current-operation-type">{type}</output>
          {allowOrders && (
            <>
              <button onClick={() => usePOSStore.getState().setType('sale')}>
                Venta por mostrador
              </button>
              <button onClick={() => usePOSStore.getState().setType('order')}>
                Pedido programado
              </button>
            </>
          )}
        </div>
      );
    },
  };
});

vi.mock('@/features/store/sales/components/POSPaymentModal', () => ({
  POSPaymentModal: ({
    open,
    onSuccess,
  }: {
    open: boolean;
    onSuccess: (operation: { id: string; operation_number: string; type: 'sale' }) => void;
  }) =>
    open ? (
      <button
        onClick={() => onSuccess({ id: 'sale-1', operation_number: 'V-000123', type: 'sale' })}
      >
        Confirmar venta
      </button>
    ) : null,
}));

vi.mock('@/features/store/sales/components/SaleSuccessModal', () => ({
  SaleSuccessModal: ({
    sale,
    onClose,
  }: {
    sale: { operation_number: string };
    onClose: () => void;
  }) => (
    <div>
      Venta lista: {sale.operation_number}
      <button onClick={onClose}>Cerrar éxito</button>
    </div>
  ),
}));

beforeEach(() => {
  usePOSStore.getState().resetPOS();
  useAuthStore.setState({
    user: {
      id: 1,
      name: 'Cajero',
      email: 'cajero@example.com',
      store_id: 1,
      store: { id: 'store-1', name: 'Tienda', business_type: 'ferreteria' },
      roles: ['STORE_USER'],
      is_active: true,
      permissions: ['pos.view', 'pos.create'],
      features: [{ code: 'pos', limit: null }],
      cash_session: { id: 'cash-1', status: 'open', business_date: '2026-09-19' },
    },
  });
  vi.mocked(CashService.getCurrent).mockResolvedValue({
    id: 'cash-1',
    status: 'open',
    business_date: '2026-09-19',
    opening_amount: 0,
    declared_amount: null,
    opened_at: '2026-09-19 08:00:00',
    submitted_at: null,
    notes: null,
    declaration_notes: null,
  });
});

test.each([
  ['sin descuento ni pago', 1000, 1000],
  ['con descuento del 10%', 1000, 900],
  ['con descuento del 100%', 1000, 0],
  ['con múltiples productos', 3000, 2525],
  ['con cantidad fraccionaria y precio decimal', 1234.56, 771.69],
])(
  'uses the backend pending balance when registering an order %s',
  async (_scenario, localSubtotal, pendingAmount) => {
    const user = userEvent.setup();
    usePOSStore.setState({
      type: 'order',
      items: [
        {
          line_key: 'product-1:common',
          product_id: 'product-1',
          name: 'Producto',
          sku: 'SKU-1',
          barcode: null,
          quantity: '1.0000',
          price: localSubtotal,
          price_list_id: null,
          price_list_name: null,
          discount_percentage: 0,
          discount_amount: 0,
          subtotal: localSubtotal,
          sale_quantity_step: '1.0000',
          commercial_available_quantity: '10.0000',
          stock_measurement_unit_symbol: null,
        },
      ],
    });
    vi.mocked(SalesService.createOperation).mockResolvedValue({
      id: 'order-1',
      operation_number: 'P-000001',
      type: 'order',
      status: 'open',
      total: pendingAmount,
      paid_amount: 0,
      pending_amount: pendingAmount,
      customer_display_name: null,
      created_at: '2026-11-24 10:00:00',
    });
    const success = vi.spyOn((await import('antd')).message, 'success');

    render(<POSPage />);
    await user.click(await screen.findByRole('button', { name: 'Registrar pedido' }));

    await waitFor(() =>
      expect(SalesService.createOperation).toHaveBeenCalledWith(
        expect.objectContaining({ payments: [] })
      )
    );
    expect(success).toHaveBeenCalledWith(
      `Pedido registrado. Saldo pendiente: ${new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
      }).format(pendingAmount)}`
    );
  }
);

test('opens the post-sale modal with the operation reference and allows closing it', async () => {
  const user = userEvent.setup();
  render(<POSPage />);

  await user.click(await screen.findByRole('button', { name: 'Abrir cobro' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar venta' }));

  expect(screen.getByText('Venta lista: V-000123')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Confirmar venta' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Cerrar éxito' }));
  await waitFor(() => expect(screen.queryByText('Venta lista: V-000123')).not.toBeInTheDocument());
  expect(screen.getByTestId('allow-orders')).toHaveTextContent('false');
  expect(screen.getByTestId('lock-order-type')).toHaveTextContent('false');
});

test('does not enable checkout when pos.create is absent', async () => {
  useAuthStore.setState((state) => ({
    user: state.user ? { ...state.user, permissions: ['pos.view'] } : null,
  }));

  render(<POSPage />);

  expect(await screen.findByRole('button', { name: 'Abrir cobro' })).toBeDisabled();
  expect(screen.getByTestId('allow-orders')).toHaveTextContent('false');
  expect(screen.getByTestId('lock-order-type')).toHaveTextContent('false');
});

test('locks Caja to a scheduled order for an orders-only employee', async () => {
  useAuthStore.setState((state) => ({
    user: state.user
      ? {
          ...state.user,
          permissions: ['orders.create'],
          features: [{ code: 'orders', limit: null }],
        }
      : null,
  }));

  render(<POSPage />);

  expect(await screen.findByTestId('lock-order-type')).toHaveTextContent('true');
  expect(screen.getByTestId('allow-orders')).toHaveTextContent('false');
  expect(screen.getByRole('button', { name: 'Abrir cobro' })).toBeEnabled();
});

test('only exposes the operation selector when both modes are authorized', async () => {
  useAuthStore.setState((state) => ({
    user: state.user
      ? {
          ...state.user,
          permissions: ['pos.view', 'pos.create', 'orders.create'],
          features: [
            { code: 'pos', limit: null },
            { code: 'orders', limit: null },
          ],
        }
      : null,
  }));

  render(<POSPage />);

  expect(await screen.findByTestId('allow-orders')).toHaveTextContent('true');
  expect(screen.getByTestId('lock-order-type')).toHaveTextContent('false');
});

test('keeps rendering while an authorized user switches between sale and order', async () => {
  useAuthStore.setState((state) => ({
    user: state.user
      ? {
          ...state.user,
          permissions: ['pos.view', 'pos.create', 'orders.create'],
          features: [
            { code: 'pos', limit: null },
            { code: 'orders', limit: null },
          ],
        }
      : null,
  }));
  const user = userEvent.setup();

  render(<POSPage />);

  expect(await screen.findByTestId('current-operation-type')).toHaveTextContent('sale');
  await user.click(screen.getByRole('button', { name: 'Pedido programado' }));
  expect(screen.getByTestId('current-operation-type')).toHaveTextContent('order');
  await user.click(screen.getByRole('button', { name: 'Venta por mostrador' }));
  expect(screen.getByTestId('current-operation-type')).toHaveTextContent('sale');
});
