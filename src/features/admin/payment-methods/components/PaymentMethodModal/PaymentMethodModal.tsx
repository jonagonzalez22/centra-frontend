import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { PaymentMethodForm } from '../PaymentMethodForm';
import { usePaymentMethodForm } from '../../hooks/usePaymentMethodForm';
import type { PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../../types/payment-method.types';

interface PaymentMethodModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    paymentMethod?: PaymentMethod;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
    open,
    onClose,
    onSuccess,
    paymentMethod,
}) => {
    const [form] = Form.useForm();
    const { loading, createPaymentMethod, updatePaymentMethod } = usePaymentMethodForm({ onSuccess });

    const isEditing = !!paymentMethod;
    const title = isEditing ? 'Editar Medio de Pago' : 'Crear Medio de Pago';

    useEffect(() => {
        if (open) {
            if (paymentMethod) {
                form.setFieldsValue({
                    name: paymentMethod.name,
                    code: paymentMethod.code,
                    icon: paymentMethod.icon ?? undefined,
                    is_active: paymentMethod.is_active,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, paymentMethod, form]);

    const handleSubmit = async (values: CreatePaymentMethodDto) => {
        if (isEditing && paymentMethod) {
            const payload: UpdatePaymentMethodDto = { ...values };
            if (values.code === paymentMethod.code) {
                delete payload.code;
            }
            await updatePaymentMethod(paymentMethod.id, payload);
        } else {
            await createPaymentMethod(values);
        }
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
            title={title}
            width={560}
            footer={
                <div className="flex flex-wrap justify-end gap-2 pt-4">
                    <Button
                        variant="default"
                        label="Cancelar"
                        action={handleClose}
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        label={isEditing ? 'Actualizar' : 'Crear'}
                        loading={loading}
                        htmlType="button"
                        action={() => {
                            const formEl = document.getElementById('paymentMethodForm') as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <PaymentMethodForm
                formId="paymentMethodForm"
                form={form}
                loading={loading}
                onSubmit={handleSubmit}
            />
        </Modal>
    );
};
