import { useEffect } from 'react';
import { Alert, Form } from 'antd';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import Modal from '@/components/Modal/Modal';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import type { OrderDetail, OrderListItem } from '../../interfaces/order.interface';

interface CancelFormValues {
    reason_code: string;
    reason_note: string;
}

interface OrderCancellationModalProps {
    open: boolean;
    order: OrderListItem | OrderDetail | null;
    loading: boolean;
    onConfirm: (values: { reason_code: string; reason_note?: string }) => void;
    onClose: () => void;
}

const REASON_OPTIONS = [
    { label: 'Cancelado por el cliente', value: 'customer_cancelled' },
    { label: 'Pago fallido', value: 'payment_failed' },
    { label: 'Sin stock', value: 'out_of_stock' },
    { label: 'Error de precio', value: 'pricing_error' },
    { label: 'Pedido duplicado', value: 'duplicate_order' },
    { label: 'Otro', value: 'other' },
];

const isToday = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
};

const OrderCancellationModal: React.FC<OrderCancellationModalProps> = ({
    open,
    order,
    loading,
    onConfirm,
    onClose,
}) => {
    const [form] = Form.useForm<CancelFormValues>();
    const reasonCode = Form.useWatch('reason_code', form);

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleFinish = (values: CancelFormValues) => {
        onConfirm({
            reason_code: values.reason_code,
            reason_note: values.reason_note || undefined,
        });
    };

    const warningMessage = isToday(order?.requested_delivery_date ?? null)
        ? 'Este pedido corresponde al día de hoy. La cancelación puede requerir control operativo de la mercadería enviada o pendiente de devolución.'
        : 'Al cancelar este pedido, se liberará la mercadería reservada.';

    const footer = (
        <>
            <Button variant="default" label="Volver" action={onClose} disabled={loading} />
            <Button
                variant="danger"
                label="Cancelar pedido"
                loading={loading}
                action={() => {
                    form.submit();
                }}
            />
        </>
    );

    if (!order) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Cancelar pedido"
            width={480}
            footer={footer}
            loading={loading}
        >
            <div className="space-y-4">
                <div className="text-sm space-y-1">
                    <div>
                        <span className="text-gray-500">Pedido: </span>
                        <span className="font-semibold">{order.operation_number}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Cliente: </span>
                        <span>{order.customer.name}</span>
                    </div>
                    {order.requested_delivery_date && (
                        <div>
                            <span className="text-gray-500">Entrega: </span>
                            <span>{formatDateShort(order.requested_delivery_date)}</span>
                        </div>
                    )}
                    <div>
                        <span className="text-gray-500">Total: </span>
                        <span className="font-semibold">{formatCurrency(order.total)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Pendiente: </span>
                        <span className={order.pending_amount > 0 ? 'font-semibold text-amber-600' : ''}>
                            {formatCurrency(order.pending_amount)}
                        </span>
                    </div>
                </div>

                <Alert
                    message={warningMessage}
                    type="warning"
                    showIcon
                    className="text-sm"
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    id="cancelForm"
                >
                    <SelectField
                        name="reason_code"
                        label="Motivo de cancelación"
                        placeholder="Seleccionar motivo"
                        options={REASON_OPTIONS}
                        rules={[{ required: true, message: 'El motivo es obligatorio.' }]}
                        disabled={loading}
                    />

                    {reasonCode === 'other' && (
                        <InputField
                            name="reason_note"
                            label="Observación"
                            placeholder="Detalle del motivo de cancelación"
                            rules={[{ required: true, message: 'La observación es obligatoria.' }]}
                            disabled={loading}
                        />
                    )}
                </Form>
            </div>
        </Modal>
    );
};

export default OrderCancellationModal;
