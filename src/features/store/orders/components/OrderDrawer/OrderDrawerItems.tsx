import { Empty, Spin } from 'antd';
import { formatCurrency } from '@/utils/formatters';
import type { OrderItem } from '../../interfaces/order.interface';

interface OrderDrawerItemsProps {
    items: OrderItem[];
    loading: boolean;
}

const OrderDrawerItems: React.FC<OrderDrawerItemsProps> = ({ items, loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spin />
            </div>
        );
    }

    if (items.length === 0) {
        return <Empty description="Sin ítems registrados" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
        <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left p-2 font-medium">Producto</th>
                        <th className="text-center p-2 font-medium">Cantidad</th>
                        <th className="text-right p-2 font-medium">Precio Unit.</th>
                        <th className="text-right p-2 font-medium">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100">
                            <td className="p-2">{item.product_name}</td>
                            <td className="text-center p-2">{item.quantity}</td>
                            <td className="text-right p-2">{formatCurrency(item.price)}</td>
                            <td className="text-right p-2">{formatCurrency(item.subtotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderDrawerItems;
