import { InputNumber, Button, Table, message, Space, Tooltip } from 'antd';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { usePOSStore } from '../../stores/usePOSStore';
import type { POSItem } from '../../interfaces/sale.interface';
import { addDecimalStrings, compareDecimalStrings, formatQuantityForDisplay, formatQuantityWithUnit, isMultipleOfDecimalStrings, isPositiveDecimal } from '@/utils/quantity';

export const POSCart: React.FC = () => {
  const items = usePOSStore((s) => s.items);
  const updateQuantity = usePOSStore((s) => s.updateQuantity);
  const removeItem = usePOSStore((s) => s.removeItem);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});

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
      updateQuantity(item.product_id, value);
    } catch {
      message.error('Ingresá una cantidad válida.');
    }
  };

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
        </div>
      ),
    },
    {
      title: 'Cant.',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 180,
      render: (_, record) => {
        const canDecrease = compareDecimalStrings(record.quantity, record.sale_quantity_step) > 0;
        const nextQuantity = addDecimalStrings(record.quantity, record.sale_quantity_step);
        const canIncrease = compareDecimalStrings(nextQuantity, record.commercial_available_quantity) <= 0;
        return <div className="flex self-center items-center gap-2"><Space.Compact>
          <Tooltip title="Reducir cantidad">
            <Button type="primary" styles={{ root: { boxShadow: 'none' } }} icon={<Minus size={14} />} disabled={!canDecrease}
              aria-label={`Reducir cantidad de ${record.name}`}
              onClick={() => changeQuantity(record, addDecimalStrings(record.quantity, `-${record.sale_quantity_step}`))} />
          </Tooltip>
          <InputNumber<string>
          stringMode
          precision={4}
          step={record.sale_quantity_step}
          min={record.sale_quantity_step}
          max={record.commercial_available_quantity}
          value={quantityInputs[record.product_id] ?? record.quantity}
          onChange={(val) => setQuantityInputs((current) => ({ ...current, [record.product_id]: val ?? '' }))}
          onBlur={() => {
            changeQuantity(record, quantityInputs[record.product_id] ?? record.quantity);
            setQuantityInputs((current) => {
              const next = { ...current };
              delete next[record.product_id];
              return next;
            });
          }}
          onPressEnter={() => {
            changeQuantity(record, quantityInputs[record.product_id] ?? record.quantity);
            setQuantityInputs((current) => {
              const next = { ...current };
              delete next[record.product_id];
              return next;
            });
          }}
          controls={false}
          variant="outlined"
          styles={{ root: { boxShadow: 'none' } }}
          className="w-16 [&_.ant-input-number-input]:text-center"
          formatter={(value) => value ? formatQuantityForDisplay(value) : ''}
          parser={(value) => value?.replace(',', '.') ?? ''}
          />
          <Tooltip title="Aumentar cantidad">
            <Button type="primary" styles={{ root: { boxShadow: 'none' } }} icon={<Plus size={14} />} disabled={!canIncrease}
              aria-label={`Aumentar cantidad de ${record.name}`}
              onClick={() => changeQuantity(record, nextQuantity)} />
          </Tooltip>
        </Space.Compact>{record.stock_measurement_unit_symbol && <span className="text-xs text-gray-500">{record.stock_measurement_unit_symbol}</span>}</div>;
      },
    },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      width: 100,
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
      width: 110,
      align: 'right',
      render: (_, record) => (
        <span className="text-sm font-medium">
          ${Number(record.subtotal).toLocaleString('es-AR')}
        </span>
      ),
    },
    {
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<Trash2 size={14} />}
          onClick={() => removeItem(record.product_id)}
        />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey="product_id"
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }}
    />
  );
};
