import { useEffect } from 'react';
import { Form, Input, InputNumber } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import type { CashSessionBlind } from '@/entities/CashSession';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { useCashSessionForm } from '../../hooks/useCashSessionForm';

const { TextArea } = Input;

interface SubmitCashModalProps {
    session: CashSessionBlind | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const SubmitCashModal = ({ session, onClose, onSuccess }: SubmitCashModalProps) => {
    const [form] = Form.useForm();
    const { loading, submitCashSession } = useCashSessionForm({ onSuccess });

    useEffect(() => {
        if (session) form.resetFields();
    }, [form, session]);

    const handleSubmit = async (values: {
        declared_amount: number;
        declaration_notes?: string;
    }) => {
        if (!session) return;
        try {
            await submitCashSession(session.id, values);
        } catch (error) {
            const apiError = error as ApiError;
            if (apiError.errors) {
                form.setFields(
                    Object.entries(apiError.errors).map(([name, errors]) => ({ name, errors }))
                );
            }
        }
    };

    return (
        <Modal
            open={Boolean(session)}
            onClose={() => !loading && onClose()}
            title="Finalizar turno"
            width={480}
            loading={loading}
            footer={
                <div className="flex justify-end gap-2">
                    <Button
                        label="Cancelar"
                        variant="default"
                        action={onClose}
                        disabled={loading}
                    />
                    <Button
                        label="Enviar a control"
                        loading={loading}
                        action={() => form.submit()}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <p className="mb-4 text-gray-600">
                Declarás el efectivo que entregás. El control definitivo será realizado por otro
                usuario autorizado.
            </p>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    name="declared_amount"
                    label="Efectivo que entregás"
                    rules={[
                        { required: true, message: 'El efectivo entregado es obligatorio.' },
                        {
                            type: 'number',
                            min: 0,
                            message: 'El importe debe ser mayor o igual a 0.',
                        },
                    ]}
                >
                    <InputNumber
                        className="w-full"
                        min={0}
                        precision={2}
                        prefix="$"
                        disabled={loading}
                    />
                </Form.Item>
                <Form.Item name="declaration_notes" label="Observaciones">
                    <TextArea rows={3} maxLength={1000} disabled={loading} />
                </Form.Item>
            </Form>
        </Modal>
    );
};
