import { Alert, Descriptions, Form, Input, message, Select } from 'antd';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { formatCurrency } from '@/utils/formatters';
import { paymentReversalReasons } from '../constants/payment-reversal-reasons';
import type {
    ReceivedPayment,
    ReversePaymentPayload,
} from '../interfaces/received-payment.interface';
import { ReceivedPaymentsService } from '../services/received-payments.service';

type ReversalApiError = {
    status?: number;
    message?: string;
    errors?: Record<string, string[]>;
};

const errorMessage = (error: ReversalApiError): string => {
    const fieldMessage = error.errors && Object.values(error.errors).flat()[0];

    return error.message || fieldMessage || 'No se pudo anular el pago. Intentá nuevamente.';
};

interface ReversePaymentModalProps {
    payment: ReceivedPayment | null;
    open: boolean;
    onClose: () => void;
    onSuccess: (payment: ReceivedPayment) => void | Promise<void>;
    onEligibilityError: () => void | Promise<void>;
}

export const ReversePaymentModal = ({
    payment,
    open,
    onClose,
    onSuccess,
    onEligibilityError,
}: ReversePaymentModalProps) => {
    const [form] = Form.useForm<ReversePaymentPayload>();
    const [submitting, setSubmitting] = useState(false);
    const [businessError, setBusinessError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            form.resetFields();
            setBusinessError(null);
        }
    }, [form, open, payment?.id]);

    const close = () => {
        if (submitting) return;

        form.resetFields();
        setBusinessError(null);
        onClose();
    };

    const submit = async () => {
        if (!payment || submitting) return;

        let values: ReversePaymentPayload;
        try {
            values = await form.validateFields();
        } catch {
            return;
        }

        setSubmitting(true);
        setBusinessError(null);

        try {
            const reversedPayment = await ReceivedPaymentsService.reversePayment(payment.id, values);
            await onSuccess(reversedPayment);
            message.success('Pago anulado correctamente.');
            form.resetFields();
            onClose();
        } catch (error) {
            setBusinessError(errorMessage(error as ReversalApiError));
            await onEligibilityError();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={close}
            title="Anular pago"
            loading={submitting}
            width={520}
            footer={
                <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="default" label="Cancelar" action={close} disabled={submitting} />
                    <Button
                        variant="danger"
                        label="Anular pago"
                        action={() => void submit()}
                        loading={submitting}
                    />
                </div>
            }
        >
            {payment && (
                <>
                    <Descriptions className="mb-4" column={1} size="small">
                        <Descriptions.Item label="Importe">
                            <strong>{formatCurrency(payment.amount)}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Medio">
                            {payment.payment_method?.name ?? '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label={payment.operation?.type === 'sale' ? 'Venta' : 'Pedido'}>
                            {payment.operation?.operation_number ?? payment.reference ?? '—'}
                        </Descriptions.Item>
                        {payment.customer.display_name && (
                            <Descriptions.Item label="Cliente">
                                {payment.customer.display_name}
                            </Descriptions.Item>
                        )}
                        {payment.reference && (
                            <Descriptions.Item label="Referencia">
                                {payment.reference}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                    <p className="mb-5 text-gray-600">
                        El pago permanecerá registrado en el historial como revertido y el saldo
                        pendiente del pedido se actualizará.
                    </p>
                    {businessError && (
                        <Alert className="mb-4" type="error" message={businessError} showIcon />
                    )}
                    <Form form={form} layout="vertical" disabled={submitting}>
                        <Form.Item
                            name="reason_code"
                            label="Motivo"
                            rules={[{ required: true, message: 'El motivo de anulación es obligatorio.' }]}
                        >
                            <Select
                                placeholder="Seleccioná un motivo"
                                options={paymentReversalReasons}
                            />
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(previous, current) =>
                                previous.reason_code !== current.reason_code
                            }
                        >
                            {({ getFieldValue }) => (
                                <Form.Item
                                    name="reason_note"
                                    label="Observación"
                                    rules={[
                                        {
                                            required: getFieldValue('reason_code') === 'other',
                                            message: 'La observación es obligatoria cuando el motivo es Otro.',
                                        },
                                        {
                                            max: 1000,
                                            message: 'La observación no puede superar los 1000 caracteres.',
                                        },
                                    ]}
                                >
                                    <Input.TextArea rows={3} maxLength={1000} showCount />
                                </Form.Item>
                            )}
                        </Form.Item>
                    </Form>
                </>
            )}
        </Modal>
    );
};
