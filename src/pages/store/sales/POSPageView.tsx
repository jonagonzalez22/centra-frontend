import { Switch } from 'antd';
import Card from '@/components/Card/Card';
import { POSProductSearch } from '@features/store/sales/components/POSProductSearch';
import { POSCart } from '@features/store/sales/components/POSCart';
import { POSOperationConfig } from '@features/store/sales/components/POSOperationConfig';
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
  const items = usePOSStore((s) => s.items);
  const type = usePOSStore((s) => s.type);
  const customer = usePOSStore((s) => s.customer);
  const requested_delivery_date = usePOSStore((s) => s.requested_delivery_date);

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      <div className="lg:col-span-2 space-y-4">
        <POSProductSearch />
        <Card title="Productos">
          <POSCart />
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-4">
        <Card title="Configuración">
          <POSOperationConfig />
        </Card>

        <Card title="Totales">
          <POSTotals />
        </Card>

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

        <Button
          variant="primary"
          label={type === 'order' ? 'Registrar pedido' : `Cobrar $${total.toLocaleString('es-AR')}`}
          action={handleAction}
          disabled={!canCheckout()}
          block
          size="large"
        />
      </div>
    </div>
  );
};
