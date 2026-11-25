import { Empty, Spin } from 'antd';
import { formatCurrencyWithCents } from '@/utils/formatters';
import { formatQuantityWithUnit } from '@/utils/quantity';
import { formatDiscountPercentage } from '@/features/store/price-lists/types/priceList.types';
import type { OrderItem } from '../../interfaces/order.interface';
import { getOrderItemTotal } from '../../utils/orderMoney';

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
        <>
            <div
                className="hidden rounded border border-gray-200 md:block"
                data-testid="order-items-table"
            >
            <table className="w-full table-fixed text-sm">
                <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[10%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                </colgroup>
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left p-2 font-medium">Producto</th>
                        <th className="text-center p-2 font-medium">Cantidad</th>
                        <th className="text-right p-2 font-medium">Precio Unit.</th>
                        <th className="text-right p-2 font-medium">Subtotal</th>
                        <th className="text-right p-2 font-medium">Descuento</th>
                        <th className="text-right p-2 font-medium">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100">
                            <td className="break-words p-2">
                                <div className="font-medium text-gray-800">{item.product_name}</div>
                                {item.price_list_id && item.price_list_name && (
                                    <div className="mt-0.5 text-xs text-gray-500">
                                        {item.price_list_name} · {formatDiscountPercentage(String(item.discount_percentage ?? 0))}
                                    </div>
                                )}
                            </td>
                            <td className="p-2 text-center">
                                {formatQuantityWithUnit(item.quantity, item.stock_measurement_unit?.symbol)}
                            </td>
                            <td className="whitespace-nowrap p-2 text-right">{formatCurrencyWithCents(item.price)}</td>
                            <td className="whitespace-nowrap p-2 text-right">{formatCurrencyWithCents(item.subtotal)}</td>
                            <td className="whitespace-nowrap p-2 text-right">
                                {item.discount_amount > 0 ? `-${formatCurrencyWithCents(item.discount_amount)}` : '—'}
                            </td>
                            <td className="whitespace-nowrap p-2 text-right font-semibold text-gray-900">
                                {formatCurrencyWithCents(getOrderItemTotal(item))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            <div className="space-y-2 md:hidden" data-testid="order-items-mobile">
                {items.map((item) => (
                    <article key={item.id} className="rounded border border-gray-200 p-3 text-sm">
                        <div className="break-words font-medium text-gray-800">{item.product_name}</div>
                        {item.price_list_id && item.price_list_name && (
                            <div className="mt-0.5 text-xs text-gray-500">
                                {item.price_list_name} · {formatDiscountPercentage(String(item.discount_percentage ?? 0))}
                            </div>
                        )}
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                                <dt className="text-xs text-gray-500">Cantidad</dt>
                                <dd className="mt-0.5 text-right font-medium">
                                    {formatQuantityWithUnit(item.quantity, item.stock_measurement_unit?.symbol)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Precio unitario</dt>
                                <dd className="mt-0.5 text-right font-medium">{formatCurrencyWithCents(item.price)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Subtotal</dt>
                                <dd className="mt-0.5 text-right font-medium">{formatCurrencyWithCents(item.subtotal)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Descuento</dt>
                                <dd className="mt-0.5 text-right font-medium">
                                    {item.discount_amount > 0 ? `-${formatCurrencyWithCents(item.discount_amount)}` : '—'}
                                </dd>
                            </div>
                            <div className="col-span-2 flex items-center justify-between border-t border-gray-100 pt-2">
                                <dt className="font-semibold text-gray-900">Total</dt>
                                <dd className="font-semibold text-gray-900">
                                    {formatCurrencyWithCents(getOrderItemTotal(item))}
                                </dd>
                            </div>
                        </dl>
                    </article>
                ))}
            </div>
        </>
    );
};

export default OrderDrawerItems;
