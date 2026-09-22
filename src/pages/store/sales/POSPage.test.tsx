import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { CashService } from '@/features/store/cash/services/cash.service';
import { useAuthStore } from '@/store/useAuthStore.store';
import { POSPage } from './POSPage';

vi.mock('@/features/store/cash/services/cash.service', () => ({
  CashService: { getCurrent: vi.fn() },
}));

vi.mock('./POSPageView', () => ({
  POSPageView: ({ onCheckout }: { onCheckout: () => void }) => (
    <button onClick={onCheckout}>Abrir cobro</button>
  ),
}));

vi.mock('@/features/store/sales/components/POSPaymentModal', () => ({
  POSPaymentModal: ({ open, onSuccess }: { open: boolean; onSuccess: (operation: { id: string; operation_number: string; type: 'sale' }) => void }) =>
    open ? (
      <button onClick={() => onSuccess({ id: 'sale-1', operation_number: 'V-000123', type: 'sale' })}>
        Confirmar venta
      </button>
    ) : null,
}));

vi.mock('@/features/store/sales/components/SaleSuccessModal', () => ({
  SaleSuccessModal: ({ sale, onClose }: { sale: { operation_number: string }; onClose: () => void }) => (
    <div>
      Venta lista: {sale.operation_number}
      <button onClick={onClose}>Cerrar éxito</button>
    </div>
  ),
}));

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 1,
      name: 'Cajero',
      email: 'cajero@example.com',
      store_id: 1,
      store: { id: 'store-1', name: 'Tienda', business_type: 'ferreteria' },
      roles: ['STORE_USER'],
      is_active: true,
      permissions: [],
      features: [],
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

test('opens the post-sale modal with the operation reference and allows closing it', async () => {
  const user = userEvent.setup();
  render(<POSPage />);

  await user.click(await screen.findByRole('button', { name: 'Abrir cobro' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar venta' }));

  expect(screen.getByText('Venta lista: V-000123')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Confirmar venta' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Cerrar éxito' }));
  await waitFor(() => expect(screen.queryByText('Venta lista: V-000123')).not.toBeInTheDocument());
});
