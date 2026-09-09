import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Alert } from 'antd';
import Modal from '@/components/Modal/Modal';
import { Button } from '@/components/Button';
import { SalesService } from '@/features/store/sales/services/sales.service';
import { formatCurrency } from '@/utils/formatters';
import type { StorePaymentMethod } from '@/features/store/payment-methods/interfaces/store-payment-method.interface';

interface Props {
    open: boolean;
    pendingAmount: number;
    onClose: () => void;
    onSubmit: (payload: {
        store_payment_method_id: string;
        amount: number;
        reference?: string;
    }) => Promise<void>;
}

export const RegisterOrderPaymentModal = ({ open, pendingAmount, onClose, onSubmit }: Props) => {
    const [form] = Form.useForm();
    const [methods, setMethods] = useState<StorePaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const methodId = Form.useWatch('store_payment_method_id', form);
    const amount = Form.useWatch('amount', form);
    const isAmountValid = typeof amount === 'number' && amount > 0 && amount <= pendingAmount;
    const selectedMethod = methods.find(
        (method) => (method.store_payment_method_id ?? method.id) === methodId
    );

    useEffect(() => {
        if (!open) return;
        form.resetFields();
        setError(null);
        SalesService.getPaymentMethods()
            .then(setMethods)
            .catch(() => {
                setError('No se pudieron cargar los medios de pago.');
            });
    }, [open, form]);

    const submit = async (values: {
        store_payment_method_id: string;
        amount: number;
        reference?: string;
    }) => {
        setLoading(true);
        setError(null);
        try {
            await onSubmit(values);
            onClose();
        } catch (err) {
            const apiError = err as {
                response?: { data?: { message?: string; errors?: Record<string, string[]> } };
                message?: string;
            };
            const firstValidation = Object.values(apiError.response?.data?.errors ?? {})[0]?.[0];
            setError(
                firstValidation ||
                    apiError.response?.data?.message ||
                    apiError.message ||
                    'No se pudo registrar el pago.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Registrar pago"
            width={480}
            destroyOnClose={false}
            footer={
                <div className="flex justify-end gap-2">
                    <Button
                        variant="default"
                        label="Cancelar"
                        action={onClose}
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        label="Registrar pago"
                        action={() => form.submit()}
                        loading={loading}
                        disabled={loading || !isAmountValid}
                    />
                </div>
            }
        >
            <div className="mb-4 text-sm">
                Saldo pendiente: <strong>{formatCurrency(pendingAmount)}</strong>
            </div>
            {error && <Alert className="mb-3" type="error" message={error} showIcon />}
            <Form form={form} layout="vertical" onFinish={submit}>
                <Form.Item
                    name="amount"
                    label="Monto"
                    rules={[
                        { required: true, message: 'Ingresá el monto.' },
                        { type: 'number', min: 0.01, message: 'El monto debe ser mayor a cero.' },
                        {
                            type: 'number',
                            max: pendingAmount,
                            message: `El importe no puede superar el saldo pendiente de ${formatCurrency(pendingAmount)}.`,
                        },
                    ]}
                >
                    <InputNumber
                        min={0.01}
                        precision={2}
                        prefix="$"
                        className="w-full"
                    />
                </Form.Item>
                <Form.Item
                    name="store_payment_method_id"
                    label="Medio de pago"
                    rules={[{ required: true, message: 'Seleccioná un medio de pago.' }]}
                >
                    <Select
                        options={methods.map((method) => ({
                            value: method.store_payment_method_id ?? method.id,
                            label: method.custom_name ?? method.name,
                        }))}
                    />
                </Form.Item>
                {selectedMethod?.requires_reference && (
                    <Form.Item
                        name="reference"
                        label="Referencia"
                        rules={[{ required: true, message: 'Ingresá la referencia.' }]}
                    >
                        <Input maxLength={255} />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};
