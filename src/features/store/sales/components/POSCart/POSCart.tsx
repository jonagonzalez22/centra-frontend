import { Button, Select, Table, message } from 'antd';
import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { QuantityInput } from '@/components/QuantityInput';
import { usePOSStore } from '../../stores/usePOSStore';
import type { POSItem } from '../../interfaces/sale.interface';
import { addDecimalStrings, compareDecimalStrings, formatQuantityWithUnit, isMultipleOfDecimalStrings, isPositiveDecimal } from '@/utils/quantity';
import { formatDiscountPercentage } from '@/features/store/price-lists/types/priceList.types';
import './POSCart.css';

export const POSCart: React.FC = () => {
  const items = usePOSStore((s) => s.items);
  const updateQuantity = usePOSStore((s) => s.updateQuantity);
  const removeItem = usePOSStore((s) => s.removeItem);
  const priceLists = usePOSStore((s) => s.available_price_lists);
  const changeItemPriceList = usePOSStore((s) => s.changeItemPriceList);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const changeQuantity = (item: POSItem, value: string | null) => {
    if (value === null) return;
    try {
      if (!isPositiveDecimal(value) || !isMultipleOfDecimalStrings(value, item.sale_quantity_step)) {
        message.error(item.sale_quantity_step === '1.0000'
          ? 'Este producto se vende por unidad.'
          : `Este producto se vende en cantidades de ${formatQuantityWithUnit(item.sale_quantity_step, item.stock_measurement_unit_symbol)}.`);
        return;
      }
      if (compareDecimalStrings(value, item.commercial_available_quantity) > 0) {
        message.error(`Disponible: ${formatQuantityWithUnit(item.commercial_available_quantity, item.stock_measurement_unit_symbol)}.`);
        return;
      }
      updateQuantity(item.line_key, value);
    } catch {
      message.error('Ingresá una cantidad válida.');
    }
  };

  const changePriceList = (item: POSItem, value: string) => {
    const selectedList = priceLists.find((list) => list.id === value);
    const nextLineKey = `${item.product_id}:${selectedList?.id ?? 'common'}`;
    changeItemPriceList(
      item.line_key,
      selectedList?.id ?? null,
      selectedList?.name ?? null,
      Number(selectedList?.discount_percentage ?? 0),
    );
    setQuantityInputs((current) => {
      const next = { ...current };
      delete next[item.line_key];
      delete next[nextLineKey];
      return next;
    });
  };

  const priceListSelector = (record: POSItem) => (
    <Select
      aria-label={`Lista de precios de ${record.name}`}
      size="small"
      value={record.price_list_id ?? '__common__'}
      className="w-full max-w-[170px]"
      options={[
        { value: '__common__', label: 'Común' },
        ...priceLists.map((list) => ({
          value: list.id,
          label: `${list.name} · ${formatDiscountPercentage(list.discount_percentage)}`,
        })),
      ]}
      onChange={(value) => changePriceList(record, value)}
    />
  );

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        No hay productos en el carrito
      </div>
    );
  }

  const columns: ColumnsType<POSItem> = [
    {
      title: 'Producto',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm">{record.name}</div>
          <div className="text-xs text-gray-400">{record.sku}</div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1 text-xs text-gray-500 md:hidden">
            <span className="shrink-0">Lista:</span>
            {priceListSelector(record)}
          </div>
          <div className="text-xs text-gray-500 md:hidden">Precio unitario: ${Number(record.price).toLocaleString('es-AR')}</div>
          {record.discount_amount > 0 && (
            <div className="text-xs text-emerald-700">Descuento: -${record.discount_amount.toLocaleString('es-AR')}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Lista',
      key: 'price_list',
      width: 160,
      responsive: ['md'],
      render: (_, record) => priceListSelector(record),
    },
    {
      title: 'Cant.',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 170,
      render: (_, record) => {
        const canDecrease = compareDecimalStrings(record.quantity, record.sale_quantity_step) > 0;
        const nextQuantity = addDecimalStrings(record.quantity, record.sale_quantity_step);
        const canIncrease = compareDecimalStrings(nextQuantity, record.commercial_available_quantity) <= 0;
        return <QuantityInput
          ariaLabel={`Cantidad de ${record.name}`}
          value={quantityInputs[record.line_key] ?? record.quantity}
          min={record.sale_quantity_step}
          max={record.commercial_available_quantity}
          step={record.sale_quantity_step}
          onChange={(value) => setQuantityInputs((current) => ({ ...current, [record.line_key]: value ?? '' }))}
          onCommit={() => {
            changeQuantity(record, quantityInputs[record.line_key] ?? record.quantity);
            setQuantityInputs((current) => {
              const next = { ...current };
              delete next[record.line_key];
              return next;
            });
          }}
          onDecrease={() => changeQuantity(record, addDecimalStrings(record.quantity, `-${record.sale_quantity_step}`))}
          onIncrease={() => changeQuantity(record, nextQuantity)}
          decreaseAriaLabel={`Reducir cantidad de ${record.name}`}
          increaseAriaLabel={`Aumentar cantidad de ${record.name}`}
          decreaseDisabled={!canDecrease}
          increaseDisabled={!canIncrease}
          unitSymbol={record.stock_measurement_unit_symbol}
          unitClassName="text-xs text-gray-500"
          className="w-20 [&_.ant-input-number-input]:text-center"
        />;
      },
    },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      align: 'right',
      render: (_, record) => (
        <span className="text-sm">
          ${Number(record.price).toLocaleString('es-AR')}
        </span>
      ),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <span className="text-sm font-medium">
          ${Math.max(0, record.subtotal - record.discount_amount).toLocaleString('es-AR')}
        </span>
      ),
    },
    {
      key: 'actions',
      width: 44,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<Trash2 size={14} />}
          onClick={() => removeItem(record.line_key)}
        />
      ),
    },
  ];

  return (
    <div ref={scrollContainerRef} className="pos-cart-scroll min-h-0 lg:h-full lg:flex-1">
      <Table
        className="pos-cart-table"
        columns={columns}
        dataSource={items}
        rowKey="line_key"
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
        sticky={{ getContainer: () => scrollContainerRef.current ?? document.body }}
      />
    </div>
  );
};
