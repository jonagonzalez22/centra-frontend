import { useEffect } from 'react';
import { DatePicker, Form } from 'antd';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import Modal from '@/components/Modal/Modal';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

interface RescheduleFormValues {
    new_date: Dayjs;
    reason: string;
    observation: string;
}

interface RescheduleModalProps {
    open: boolean;
    currentDate: string | null;
    loading: boolean;
    onConfirm: (values: { new_date: string; reason: string; observation?: string }) => void;
    onClose: () => void;
}

const REASON_OPTIONS = [
    { label: 'Solicitud del cliente', value: 'customer_requested_reschedule' },
    { label: 'Cliente ausente', value: 'customer_absent' },
    { label: 'Domicilio cerrado', value: 'address_closed' },
    { label: 'Condiciones climáticas', value: 'weather_conditions' },
    { label: 'Problema operativo', value: 'operational_issue' },
    { label: 'Otro', value: 'other' },
];

const RescheduleModal: React.FC<RescheduleModalProps> = ({
    open,
    currentDate,
    loading,
    onConfirm,
    onClose,
}) => {
    const [form] = Form.useForm<RescheduleFormValues>();
    const reasonValue = Form.useWatch('reason', form);

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleFinish = (values: RescheduleFormValues) => {
        onConfirm({
            new_date: values.new_date.format('YYYY-MM-DD'),
            reason: values.reason,
            observation: values.observation || undefined,
        });
    };

    const disabledDate = (current: Dayjs) => {
        return current.isBefore(dayjs().startOf('day'));
    };

    const footer = (
        <>
            <Button variant="default" label="Cancelar" action={onClose} disabled={loading} />
            <Button
                variant="primary"
                label="Reprogramar"
                loading={loading}
                action={() => {
                    form.submit();
                }}
            />
        </>
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Reprogramar fecha de entrega"
            width={480}
            footer={footer}
            loading={loading}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                id="rescheduleForm"
            >
                <Form.Item
                    name="new_date"
                    label="Nueva fecha"
                    rules={[
                        { required: true, message: 'La nueva fecha es obligatoria.' },
                        {
                            validator: (_, value: Dayjs) => {
                                if (!value) return Promise.resolve();
                                if (currentDate && value.format('YYYY-MM-DD') === currentDate) {
                                    return Promise.reject(
                                        new Error('La nueva fecha debe ser diferente a la actual.')
                                    );
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        placeholder="Seleccionar nueva fecha"
                        disabledDate={disabledDate}
                        disabled={loading}
                    />
                </Form.Item>

                <SelectField
                    name="reason"
                    label="Motivo"
                    placeholder="Seleccionar motivo"
                    options={REASON_OPTIONS}
                    rules={[{ required: true, message: 'El motivo es obligatorio.' }]}
                    disabled={loading}
                />

                {reasonValue === 'other' && (
                    <InputField
                        name="observation"
                        label="Observación"
                        placeholder="Detalle del motivo"
                        rules={[{ required: true, message: 'La observación es obligatoria.' }]}
                        disabled={loading}
                    />
                )}
            </Form>
        </Modal>
    );
};

export default RescheduleModal;
