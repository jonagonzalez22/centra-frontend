import { usePOSStore } from '../../stores/usePOSStore';
import { formatCurrencyWithCents } from '@/utils/formatters';
import { calculatePOSTotals } from '../../utils/posTotals';

export const POSTotals: React.FC = () => {
  const items = usePOSStore((s) => s.items);

  const { subtotal, discount, total } = calculatePOSTotals(items);

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>{formatCurrencyWithCents(subtotal)}</span>
      </div>
      {discount > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Descuentos</span><span>-{formatCurrencyWithCents(discount)}</span></div>}
      <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
        <span>Total</span>
        <span>{formatCurrencyWithCents(total)}</span>
      </div>
    </div>
  );
};
