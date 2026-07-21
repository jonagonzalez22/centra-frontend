import { usePOSStore } from '../../stores/usePOSStore';

export const POSTotals: React.FC = () => {
  const items = usePOSStore((s) => s.items);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>${subtotal.toLocaleString('es-AR')}</span>
      </div>
      <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
        <span>Total</span>
        <span>${total.toLocaleString('es-AR')}</span>
      </div>
    </div>
  );
};
