import { Empty, Spin } from 'antd';
import { formatCurrency } from '@/utils/formatters';
import type { OrderPayment } from '../../interfaces/order.interface';

interface OrderDrawerPaymentsProps {
    payments: OrderPayment[];
    loading: boolean;
}

const OrderDrawerPayments: React.FC<OrderDrawerPaymentsProps> = ({ payments, loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spin />
            </div>
        );
    }

    if (payments.length === 0) {
        return <Empty description="Sin pagos registrados" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
        <div className="space-y-2">
            {payments.map((payment) => (
                <div
                    key={payment.id}
                    className="flex justify-between items-center p-2 border border-gray-200 rounded"
                >
                    <span className="text-sm font-medium">
                        {payment.store_payment_method.name}
                    </span>
                    <span className="text-sm font-semibold">
                        {formatCurrency(payment.amount)}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default OrderDrawerPayments;
