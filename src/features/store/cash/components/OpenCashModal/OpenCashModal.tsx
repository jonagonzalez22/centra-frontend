import { useEffect } from 'react';
import { Form, InputNumber, Input } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { useCashSessionForm } from '../../hooks/useCashSessionForm';

const { TextArea } = Input;

interface OpenCashModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const OpenCashModal: React.FC<OpenCashModalProps> = ({
    open,
    onClose,
    onSuccess,
}) => {
    const [form] = Form.useForm();

    const { loading, openCashSession } = useCashSessionForm({ onSuccess });

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleSubmit = async (values: {
        opening_amount: number;
        notes?: string;
    }) => {
        await openCashSession(values);
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Abrir Caja"
            width={480}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button
                        variant="default"
                        label="Cancelar"
                        action={handleClose}
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        label="Abrir Caja"
                        loading={loading}
                        htmlType="button"
                        action={() => {
                            const formEl = document.getElementById(
                                'openCashForm'
                            ) as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(
                                    new Event('submit', { cancelable: true, bubbles: true })
                                );
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <Form
                id="openCashForm"
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="opening_amount"
                    label="Monto inicial"
                    rules={[
                        { required: true, message: 'El monto inicial es obligatorio.' },
                        {
                            type: 'number',
                            min: 0,
                            message: 'El monto debe ser mayor o igual a 0.',
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        precision={2}
                        prefix="$"
                        placeholder="0.00"
                        disabled={loading}
                    />
                </Form.Item>

                <Form.Item name="notes" label="Notas">
                    <TextArea rows={3} placeholder="Notas opcionales" disabled={loading} />
                </Form.Item>
            </Form>
        </Modal>
    );
};
