import { Button as AntButton, Drawer, Switch } from 'antd';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import Card from '@/components/Card/Card';
import { POSProductSearch } from '@features/store/sales/components/POSProductSearch';
import { POSCart } from '@features/store/sales/components/POSCart';
import { POSGlobalPriceListSelect, POSOperationConfig } from '@features/store/sales/components/POSOperationConfig';
import { POSTotals } from '@features/store/sales/components/POSTotals';
import Button from '@/components/Button/Button';
import { usePOSStore } from '@features/store/sales/stores/usePOSStore';

interface POSPageViewProps {
  onCheckout: () => void;
  onRegisterOrder: () => void;
  registerDepositNow: boolean;
  setRegisterDepositNow: (value: boolean) => void;
}

export const POSPageView: React.FC<POSPageViewProps> = ({
  onCheckout,
  onRegisterOrder,
  registerDepositNow,
  setRegisterDepositNow,
}) => {
  const [mobileConfigurationOpen, setMobileConfigurationOpen] = useState(false);
  const items = usePOSStore((s) => s.items);
  const type = usePOSStore((s) => s.type);
  const customer = usePOSStore((s) => s.customer);
  const requested_delivery_date = usePOSStore((s) => s.requested_delivery_date);

  const total = items.reduce((sum, item) => sum + Math.max(0, Math.round(item.subtotal * (1 - item.discount_percentage / 100))), 0);

  const canCheckout = () => {
    if (items.length === 0) return false;
    if (type === 'order') {
      if (!customer) return false;
      if (!requested_delivery_date) return false;
    }
    return true;
  };

  const handleAction = () => {
    if (type === 'order' && !registerDepositNow) {
      onRegisterOrder();
    } else {
      onCheckout();
    }
  };

  return (
    // Desktop: viewport minus the 4rem app header and 3rem vertical content padding.
    <div className={`grid min-h-0 grid-cols-1 gap-4 ${items.length > 0 ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]' : 'pb-0'} md:pb-0 lg:h-[calc(100vh-7rem)] lg:grid-cols-3`}>
      <div className="flex min-h-0 flex-col gap-4 lg:col-span-2">
        <div className="mt-4 sticky top-0 z-30 shrink-0 border-b border-gray-200/80 bg-[#f5f5f5] pb-3 pt-3 md:static md:mt-0 md:border-b-0 md:bg-transparent md:py-0">
          <div className="flex min-w-0 items-center gap-0">
            <div className="min-w-0 flex-1"><POSProductSearch /></div>
            <AntButton
              type="text"
              icon={<Settings size={18} />}
              aria-label="Configuraciones"
              className="-mr-2 min-h-10 min-w-10 shrink-0 p-0 text-gray-600 md:hidden"
              onClick={() => setMobileConfigurationOpen(true)}
            />
          </div>
          <div className="mt-3 md:hidden" data-testid="pos-mobile-toolbar">
            <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de lista</label>
            <POSGlobalPriceListSelect ariaLabel="Tipo de lista" size="large" />
          </div>
        </div>

        <Card
          title="Productos"
          className="min-h-0 max-md:border-0 max-md:bg-transparent max-md:shadow-none max-md:[&_.ant-card-head]:min-h-0 max-md:[&_.ant-card-head]:border-b-0 max-md:[&_.ant-card-head]:px-0 max-md:[&_.ant-card-body]:px-0 lg:flex lg:flex-1 lg:flex-col"
          styles={{
            body: {
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
            },
          }}
        >
          <POSCart />
        </Card>

        {items.length > 0 && <div className="md:hidden">
          <Card title="Totales">
            <POSTotals />
          </Card>
        </div>}
      </div>

      <div className="hidden space-y-4 md:block lg:col-span-1 lg:self-start" data-testid="pos-desktop-panel">
        <Card title="Configuración">
          <POSOperationConfig />
        </Card>

        {items.length > 0 && <Card title="Totales">
          <POSTotals />
        </Card>}

        {type === 'order' && (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <span className="text-sm text-gray-700">Registrar seña ahora</span>
            <Switch
              checked={registerDepositNow}
              onChange={setRegisterDepositNow}
              size="small"
            />
          </div>
        )}

        {items.length > 0 && <Button
          variant="primary"
          label={type === 'order' ? 'Registrar pedido' : `Cobrar $${total.toLocaleString('es-AR')}`}
          action={handleAction}
          disabled={!canCheckout()}
          block
          size="large"
        />}
      </div>

      <Drawer
        title="Configuración"
        placement="bottom"
        height="80vh"
        open={mobileConfigurationOpen}
        onClose={() => setMobileConfigurationOpen(false)}
        rootClassName="md:hidden"
        styles={{ body: { paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' } }}
      >
        <POSOperationConfig loadPriceLists={false} />
        {type === 'order' && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-700">Registrar seña ahora</span>
            <Switch
              checked={registerDepositNow}
              onChange={setRegisterDepositNow}
              size="small"
            />
          </div>
        )}
      </Drawer>

      {items.length > 0 && <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        data-testid="pos-mobile-checkout"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs text-gray-500">Total</div>
            <div className="truncate text-lg font-bold text-centra-primary">${total.toLocaleString('es-AR')}</div>
          </div>
          <Button
            variant="primary"
            label={type === 'order' ? 'Registrar pedido' : 'Cobrar'}
            action={handleAction}
            disabled={!canCheckout()}
            size="large"
            className="shrink-0"
          />
        </div>
      </div>}
    </div>
  );
};
