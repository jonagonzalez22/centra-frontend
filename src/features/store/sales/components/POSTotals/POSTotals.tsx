import { usePOSStore } from '../../stores/usePOSStore';

export const POSTotals: React.FC = () => {
  const items = usePOSStore((s) => s.items);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = items.reduce((sum, item) => sum + Math.round(item.subtotal * item.discount_percentage / 100), 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>${subtotal.toLocaleString('es-AR')}</span>
      </div>
      {discount > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Descuentos</span><span>-${discount.toLocaleString('es-AR')}</span></div>}
      <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
        <span>Total</span>
        <span>${total.toLocaleString('es-AR')}</span>
      </div>
    </div>
  );
};
