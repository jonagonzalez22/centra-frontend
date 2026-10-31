import { act, fireEvent, render, screen } from '@testing-library/react';
import { usePOSStore } from '@/features/store/sales/stores/usePOSStore';
import { POSPageView } from './POSPageView';

vi.mock('antd', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" onClick={onClick} {...props}>{children}</button>
  ),
  Drawer: ({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) => open ? (
    <div role="dialog" aria-label={title}>
      <button type="button" onClick={onClose}>Cerrar configuración</button>
      {children}
    </div>
  ) : null,
  Switch: () => <input type="checkbox" />,
}));

vi.mock('@/components/Card/Card', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => <section aria-label={title}>{children}</section>,
}));

vi.mock('@/components/Button/Button', () => ({
  default: ({ label, action, disabled }: { label: string; action: () => void; disabled: boolean }) => (
    <button type="button" onClick={action} disabled={disabled}>{label}</button>
  ),
}));

vi.mock('@features/store/sales/components/POSProductSearch', () => ({
  POSProductSearch: () => <div>Buscador</div>,
}));

vi.mock('@features/store/sales/components/POSCart', () => ({
  POSCart: () => <div>Cards de productos</div>,
}));

vi.mock('@features/store/sales/components/POSOperationConfig', () => ({
  POSOperationConfig: () => <div>Configuración completa</div>,
  POSGlobalPriceListSelect: () => <div>Lista por defecto</div>,
}));

vi.mock('@features/store/sales/components/POSTotals', () => ({
  POSTotals: () => <div>Detalle de totales</div>,
}));

const product = {
  id: 'paper-1', name: 'Papel higiénico', sku: 'PAP-1', barcode: null, price: 25000,
  commercial_available_quantity: '10.0000', sale_quantity_step: '1.0000', stock_measurement_unit_symbol: 'u',
};

beforeEach(() => {
  usePOSStore.getState().resetPOS();
  usePOSStore.getState().addItem(product);
});

test('keeps mobile controls separate from the desktop panel, opens the drawer, and keeps checkout updated', () => {
  const onCheckout = vi.fn();
  const { container } = render(
    <POSPageView
      onCheckout={onCheckout}
      onRegisterOrder={vi.fn()}
      registerDepositNow={false}
      setRegisterDepositNow={vi.fn()}
    />
  );

  expect(screen.getByTestId('pos-mobile-toolbar')).toHaveClass('md:hidden');
  expect(screen.getByText('Tipo de lista')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Configuraciones' })).toBeEmptyDOMElement();
  expect(screen.getByText('Tipo de lista').closest('.sticky')).toHaveClass('top-0');
  expect(screen.getByTestId('pos-desktop-panel')).toHaveClass('hidden', 'md:block');
  expect(screen.getByTestId('pos-mobile-checkout')).toHaveClass('fixed', 'md:hidden');
  expect(screen.getByTestId('pos-mobile-checkout')).toHaveStyle({ paddingBottom: 'env(safe-area-inset-bottom)' });
  expect(container.firstElementChild).toHaveClass('pb-[calc(5.5rem+env(safe-area-inset-bottom))]');
  expect(screen.getByText('$25.000')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Configuraciones' }));
  expect(screen.getByRole('dialog', { name: 'Configuración' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar configuración' }));
  expect(screen.queryByRole('dialog', { name: 'Configuración' })).not.toBeInTheDocument();

  act(() => usePOSStore.getState().updateQuantity('paper-1:common', '2.0000'));
  expect(screen.getByText('$50.000')).toBeInTheDocument();

  act(() => usePOSStore.getState().changeItemPriceList('paper-1:common', 'wholesale', 'Mayorista', 10));
  expect(screen.getByText('$45.000')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }));
  expect(onCheckout).toHaveBeenCalledTimes(1);
});

test('hides totals and checkout controls while the cart is empty and restores them with the first product', () => {
  usePOSStore.getState().resetPOS();
  render(
    <POSPageView
      onCheckout={vi.fn()}
      onRegisterOrder={vi.fn()}
      registerDepositNow={false}
      setRegisterDepositNow={vi.fn()}
    />
  );

  expect(screen.getByText('Buscador')).toBeInTheDocument();
  expect(screen.getByText('Lista por defecto')).toBeInTheDocument();
  expect(screen.queryByText('Detalle de totales')).not.toBeInTheDocument();
  expect(screen.queryByTestId('pos-mobile-checkout')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cobrar' })).not.toBeInTheDocument();

  act(() => usePOSStore.getState().addItem(product));
  expect(screen.getAllByText('Detalle de totales')).toHaveLength(2);
  expect(screen.getByTestId('pos-mobile-checkout')).toBeInTheDocument();

  act(() => usePOSStore.getState().removeItem('paper-1:common'));
  expect(screen.queryByText('Detalle de totales')).not.toBeInTheDocument();
  expect(screen.queryByTestId('pos-mobile-checkout')).not.toBeInTheDocument();
});
