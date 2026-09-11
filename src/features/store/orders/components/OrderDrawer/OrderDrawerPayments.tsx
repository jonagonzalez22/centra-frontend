import { Empty, Spin } from 'antd';
import { Button } from '@/components/Button';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { OrderPayment } from '../../interfaces/order.interface';
import { getPaymentOriginLabel } from '@/utils/paymentOrigin';

interface OrderDrawerPaymentsProps {
    payments: OrderPayment[];
    paidAmount: number;
    pendingAmount: number;
    loading: boolean;
    canCollect: boolean;
    onRegisterPayment: () => void;
}

const OrderDrawerPayments: React.FC<OrderDrawerPaymentsProps> = ({
    payments,
    paidAmount,
    pendingAmount,
    loading,
    canCollect,
    onRegisterPayment,
}) => {
    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spin />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1 text-sm">
                <div className="flex justify-between font-semibold">
                    <span>Total pagado</span>
                    <span>{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                    <span>Saldo pendiente</span>
                    <span className={pendingAmount > 0 ? 'text-amber-600' : ''}>
                        {formatCurrency(pendingAmount)}
                    </span>
                </div>
            </div>
            {payments.length === 0 ? (
                <Empty description="Sin pagos registrados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                payments.map((payment) => (
                    <div key={payment.id} className="p-3 border border-gray-200 rounded">
                        <div className="flex justify-between gap-3">
                            <span className="text-sm font-medium">
                                {payment.store_payment_method.name}
                            </span>
                            <span className="text-sm font-semibold">
                                {formatCurrency(payment.amount)}
                            </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                            {payment.created_at && <div>{formatDate(payment.created_at)}</div>}
                            {payment.reference && <div>Referencia: {payment.reference}</div>}
                            <div>{getPaymentOriginLabel(payment.origin)}</div>
                            {payment.registered_by && (
                                <div>Registrado por {payment.registered_by.name}</div>
                            )}
                        </div>
                    </div>
                ))
            )}
            {pendingAmount > 0 && canCollect && (
                <div className="flex justify-end pt-1 pb-2">
                    <Button variant="primary" label="Registrar pago" action={onRegisterPayment} />
                </div>
            )}
        </div>
    );
};

export default OrderDrawerPayments;
