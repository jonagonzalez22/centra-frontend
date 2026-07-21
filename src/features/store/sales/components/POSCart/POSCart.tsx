import { InputNumber, Button, Table } from 'antd';
import { Trash2 } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { usePOSStore } from '../../stores/usePOSStore';
import type { POSItem } from '../../interfaces/sale.interface';

export const POSCart: React.FC = () => {
  const items = usePOSStore((s) => s.items);
  const updateQuantity = usePOSStore((s) => s.updateQuantity);
  const removeItem = usePOSStore((s) => s.removeItem);

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
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={1}
          max={9999}
          value={record.quantity}
          onChange={(val) => updateQuantity(record.product_id, val ?? 1)}
          size="small"
          className="w-16"
        />
      ),
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
