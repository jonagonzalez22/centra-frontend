import { useEffect } from 'react';
import { Form, DatePicker, Input, message } from 'antd';
import dayjs from 'dayjs';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import SelectField from '@/components/SelectField/SelectField';
import { useRouteForm } from '../../hooks/useRouteForm';
import { useVehicles } from '../../hooks/useVehicles';
import { useDrivers } from '../../hooks/useDrivers';
import type { CreateRouteDto } from '../../interfaces/route.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface RouteFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RouteFormModal = ({ open, onClose, onSuccess }: RouteFormModalProps) => {
    const [form] = Form.useForm();
    const { loading, createRoute } = useRouteForm({ onSuccess });
    const { vehicles, vehiclesLoading } = useVehicles();
    const { drivers, driversLoading } = useDrivers();

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleSubmit = async (values: {
        operational_date: dayjs.Dayjs;
        vehicle_id: string;
        driver_id: string;
        observations?: string;
    }) => {
        const dto: CreateRouteDto = {
            operational_date: values.operational_date.format('YYYY-MM-DD'),
            vehicle_id: values.vehicle_id,
            driver_id: values.driver_id,
            observations: values.observations || undefined,
        };
        try {
            await createRoute(dto);
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errors) {
                const fieldErrors = Object.entries(apiError.errors).map(([field, messages]) => ({
                    name: [field],
                    errors: messages,
                }));
                form.setFields(fieldErrors as any);
            }
        }
    };

    const handleClose = () => {
        if (!loading) onClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Crear Ruta"
            width={520}
            destroyOnClose={false}
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
                        label="Crear"
                        loading={loading}
                        action={() => {
                            const formEl = document.getElementById(
                                'routeForm'
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
        >
            <Form
                id="routeForm"
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onFinishFailed={() =>
                    message.error('Por favor, revisá los campos marcados en rojo.')
                }
                validateTrigger="onBlur"
            >
                <Form.Item
                    name="operational_date"
                    label="Fecha Operativa"
                    rules={[{ required: true, message: 'La fecha operativa es obligatoria.' }]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        placeholder="Seleccionar fecha"
                        format="DD/MM/YYYY"
                        disabled={loading}
                    />
                </Form.Item>

                <SelectField
                    name="vehicle_id"
                    label="Vehículo"
                    placeholder="Seleccionar vehículo"
                    options={vehicles.map((v) => ({
                        label: `${v.name} (${v.plate})`,
                        value: v.id,
                    }))}
                    rules={[{ required: true, message: 'El vehículo es obligatorio.' }]}
                    showSearch
                    filterOption={(input, option) => {
                        const opt = option as { label: string; value: string } | undefined;
                        return (
                            opt?.label?.toLowerCase().includes(input.toLowerCase()) ?? false
                        );
                    }}
                    loading={vehiclesLoading}
                    disabled={loading}
                />

                <SelectField
                    name="driver_id"
                    label="Conductor"
                    placeholder="Seleccionar conductor"
                    options={drivers.map((d) => ({ label: d.name, value: d.id }))}
                    rules={[{ required: true, message: 'El conductor es obligatorio.' }]}
                    showSearch
                    filterOption={(input, option) => {
                        const opt = option as { label: string; value: string } | undefined;
                        return (
                            opt?.label?.toLowerCase().includes(input.toLowerCase()) ?? false
                        );
                    }}
                    loading={driversLoading}
                    disabled={loading}
                />

                <Form.Item name="observations" label="Observaciones">
                    <Input.TextArea
                        placeholder="Observaciones de la ruta (opcional)"
                        rows={3}
                        disabled={loading}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
