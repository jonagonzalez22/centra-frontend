import { useEffect } from 'react';
import { Alert, Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import SelectField from '@/components/SelectField/SelectField';
import type { RejectionReason } from '../../services/driver.service';

interface FailedDeliveryModalProps {
    open: boolean;
    rejectionReasons: RejectionReason[];
    loading: boolean;
    onConfirm: (rejectionReasonId: string) => void;
    onClose: () => void;
}

export const FailedDeliveryModal: React.FC<FailedDeliveryModalProps> = ({
    open,
    rejectionReasons,
    loading,
    onConfirm,
    onClose,
}) => {
    const [form] = Form.useForm<{ rejection_reason_id: string }>();

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleFinish = ({ rejection_reason_id }: { rejection_reason_id: string }) => {
        onConfirm(rejection_reason_id);
    };

    const reasonOptions = rejectionReasons.map((r) => ({
        label: r.label,
        value: r.id,
    }));

    const footer = (
        <>
            <Button variant="default" label="Cancelar" action={onClose} disabled={loading} />
            <Button
                variant="danger"
                label="Confirmar"
                loading={loading}
                action={() => form.submit()}
            />
        </>
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="No se pudo entregar"
            width={400}
            footer={footer}
            loading={loading}
        >
            <div className="space-y-4">
                <Alert
                    message="Se registrarán todos los productos con cantidad entregada cero."
                    type="warning"
                    showIcon
                    className="text-sm"
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    id="failedDeliveryForm"
                >
                    <SelectField
                        name="rejection_reason_id"
                        label="Motivo de rechazo"
                        placeholder="Seleccionar motivo"
                        options={reasonOptions}
                        rules={[{ required: true, message: 'El motivo es obligatorio.' }]}
                        disabled={loading}
                    />
                </Form>
            </div>
        </Modal>
    );
};
