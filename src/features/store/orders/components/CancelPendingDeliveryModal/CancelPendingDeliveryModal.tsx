import { Form, Input } from 'antd';
import Modal from '@/components/Modal/Modal';
import { Button } from '@/components/Button';
import type { DeliverySummaryItem } from '../../interfaces/order.interface';

interface Props {
    open: boolean;
    items: DeliverySummaryItem[];
    loading: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const CancelPendingDeliveryModal: React.FC<Props> = ({ open, items, loading, onClose, onConfirm }) => {
    const [form] = Form.useForm<{ reason: string }>();

    const footer = <>
        <Button variant="default" label="Volver" action={onClose} disabled={loading} />
        <Button variant="danger" label="Cancelar pendiente" action={() => form.submit()} loading={loading} />
    </>;

    return (
        <Modal open={open} onClose={onClose} title="Cancelar mercadería pendiente" width={520} footer={footer} loading={loading}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    Se cancelará toda la mercadería que todavía falta entregar. Lo ya entregado se mantendrá intacto y el total del pedido será recalculado.
                </p>
                <div className="border border-gray-200 rounded-md divide-y divide-gray-100">
                    {items.filter((item) => item.pending_quantity > 0).map((item) => (
                        <div key={item.product_id} className="flex justify-between gap-3 p-2 text-sm">
                            <span>{item.product_name || 'Producto'}</span>
                            <span className="font-medium whitespace-nowrap">
                                {item.pending_quantity} {item.pending_quantity === 1 ? 'unidad' : 'unidades'}
                            </span>
                        </div>
                    ))}
                </div>
                <Form form={form} layout="vertical" onFinish={({ reason }) => onConfirm(reason)}>
                    <Form.Item name="reason" label="Motivo" rules={[
                        { required: true, message: 'El motivo es obligatorio.' },
                        { min: 3, message: 'El motivo debe tener al menos 3 caracteres.' },
                        { max: 500, message: 'El motivo no puede superar los 500 caracteres.' },
                    ]}>
                        <Input.TextArea rows={3} disabled={loading} placeholder="Cliente ya no necesita la mercadería" />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default CancelPendingDeliveryModal;
