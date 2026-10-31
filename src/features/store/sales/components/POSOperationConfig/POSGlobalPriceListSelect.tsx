import { Select } from 'antd';
import { formatDiscountPercentage } from '@/features/store/price-lists/types/priceList.types';
import { usePOSStore } from '../../stores/usePOSStore';

interface POSGlobalPriceListSelectProps {
  ariaLabel?: string;
  className?: string;
  size?: 'small' | 'middle' | 'large';
}

/**
 * Shared global/default price-list control. It intentionally only changes the
 * default used by the POS store, matching the existing configuration behavior.
 */
export const POSGlobalPriceListSelect: React.FC<POSGlobalPriceListSelectProps> = ({
  ariaLabel = 'Lista de precios global',
  className = 'w-full',
  size,
}) => {
  const selectedPriceListId = usePOSStore((s) => s.selected_price_list_id);
  const setSelectedPriceListId = usePOSStore((s) => s.setSelectedPriceListId);
  const priceLists = usePOSStore((s) => s.available_price_lists);

  return (
    <Select
      aria-label={ariaLabel}
      size={size}
      value={selectedPriceListId ?? '__common__'}
      onChange={(value) => {
        const list = priceLists.find((candidate) => candidate.id === value);
        setSelectedPriceListId(list?.id ?? null, list?.name ?? null, Number(list?.discount_percentage ?? 0));
      }}
      options={[
        { value: '__common__', label: 'Común' },
        ...priceLists.map((list) => ({ value: list.id, label: `${list.name} · ${formatDiscountPercentage(list.discount_percentage)}` })),
      ]}
      className={className}
    />
  );
};
