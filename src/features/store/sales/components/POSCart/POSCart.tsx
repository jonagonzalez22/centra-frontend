import { Button, Empty, Select, Table, message } from 'antd';
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

  const priceListSelector = (
    record: POSItem,
    className = 'w-full max-w-[170px]',
    size: 'small' | 'middle' = 'small'
  ) => (
    <Select
      aria-label={`Lista de precios de ${record.name}`}
      size={size}
      value={record.price_list_id ?? '__common__'}
      className={className}
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

  const quantityInput = (record: POSItem, className: string, unitClassName: string) => {
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
      unitClassName={unitClassName}
      className={className}
    />;
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={(
            <div className="space-y-1">
              <div className="text-sm text-gray-600">No hay productos en el carrito</div>
              <div className="text-xs text-gray-400">Buscá un producto para comenzar la venta.</div>
            </div>
          )}
        />
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
        return quantityInput(record, 'w-20 [&_.ant-input-number-input]:text-center', 'text-xs text-gray-500');
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
          aria-label={`Eliminar ${record.name}`}
          icon={<Trash2 size={14} />}
          onClick={() => removeItem(record.line_key)}
        />
      ),
    },
  ];

  const mobileCards = (
    <div className="pos-cart-mobile space-y-3 md:hidden" data-testid="pos-cart-mobile">
      {items.map((item) => {
        const finalSubtotal = Math.max(0, item.subtotal - item.discount_amount);

        return (
          <article className="min-w-0 rounded-lg border border-gray-200 bg-white p-4" key={item.line_key}>
            <header className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="m-0 break-words text-sm font-semibold text-gray-900">{item.name}</h3>
                <p className="mt-1 break-all text-xs text-gray-500">{item.sku}</p>
              </div>
              <Button
                type="text"
                danger
                size="small"
                aria-label={`Eliminar ${item.name}`}
                className="min-h-10 min-w-10 shrink-0"
                icon={<Trash2 size={14} />}
                onClick={() => removeItem(item.line_key)}
              />
            </header>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-600">Lista de precios</label>
              {priceListSelector(item, 'w-full', 'middle')}
            </div>

            <div className="mt-4 flex min-w-0 items-center justify-center gap-3">
              {quantityInput(
                item,
                'w-24 [&_.ant-input-number-input]:text-center',
                'shrink-0 text-sm font-medium text-gray-600'
              )}
            </div>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-gray-100 pt-3">
              <div className="text-xs text-gray-500">
                <div>Precio unitario</div>
                <div className="mt-1 text-sm font-medium text-gray-800">
                  ${Number(item.price).toLocaleString('es-AR')}/{item.stock_measurement_unit_symbol}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Subtotal</div>
                <div className="mt-1 text-base font-semibold text-gray-900">
                  ${finalSubtotal.toLocaleString('es-AR')}
                </div>
              </div>
            </div>

            {item.discount_amount > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm text-emerald-700">
                <span>Descuento</span>
                <span className="font-medium">-${item.discount_amount.toLocaleString('es-AR')}</span>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );

  return <>
    {mobileCards}
    <div ref={scrollContainerRef} className="pos-cart-scroll hidden min-h-0 md:block lg:h-full lg:flex-1" data-testid="pos-cart-desktop">
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
  </>;
};
