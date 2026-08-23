import { useState, useEffect } from 'react';
import { Modal, Input, Form } from 'antd';

interface RejectCollectionModalProps {
    open: boolean;
    loading: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

export const RejectCollectionModal = ({
    open,
    loading,
    onClose,
    onConfirm,
}: RejectCollectionModalProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleConfirm = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            await onConfirm(values.rejection_reason);
        } catch {
            // Validation failed
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Rechazar Cobro"
            open={open}
            onCancel={onClose}
            confirmLoading={submitting || loading}
            onOk={handleConfirm}
            okText="Confirmar Rechazo"
            okButtonProps={{ danger: true }}
            cancelText="Cancelar"
            destroyOnClose
        >
            <Form form={form} layout="vertical" preserve={false}>
                <Form.Item
                    name="rejection_reason"
                    label="Motivo del Rechazo"
                    rules={[
                        { required: true, message: 'El motivo del rechazo es obligatorio.' },
                        { min: 3, message: 'El motivo debe tener al menos 3 caracteres.' },
                    ]}
                >
                    <Input.TextArea
                        rows={3}
                        placeholder="Ingrese el motivo del rechazo..."
                        maxLength={500}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
