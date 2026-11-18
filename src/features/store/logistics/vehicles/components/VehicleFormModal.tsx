import { useEffect, useState } from 'react';
import { Form, InputNumber, message } from 'antd';
import type { FormInstance } from 'antd';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import Modal from '@/components/Modal/Modal';
import SelectField from '@/components/SelectField/SelectField';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { requiredStringRules } from '@/utils/validationRules';
import { VehicleManagementService } from '../services/vehicles.service';
import type { Vehicle, VehicleDto } from '../interfaces/vehicle.interface';

interface VehicleFormModalProps {
    open: boolean;
    vehicle?: Vehicle;
    onClose: () => void;
    onSuccess: () => void;
}

const typeLabels: Record<string, string> = {
    auto: 'Auto',
    moto: 'Moto',
    bicicleta: 'Bicicleta',
    camioneta: 'Camioneta',
    camion: 'Camión',
};

export const VehicleFormModal = ({ open, vehicle, onClose, onSuccess }: VehicleFormModalProps) => {
    const [form] = Form.useForm<VehicleDto>();
    const [types, setTypes] = useState<Vehicle['type'][]>([]);
    const [loading, setLoading] = useState(false);
    const isEditing = Boolean(vehicle);

    useEffect(() => {
        if (!open) return;
        form.setFieldsValue(
            vehicle
                ? {
                      name: vehicle.name,
                      plate: vehicle.plate,
                      type: vehicle.type,
                      capacity_kg: vehicle.capacity_kg,
                  }
                : { name: '', plate: '', type: undefined, capacity_kg: null }
        );
        VehicleManagementService.getTypes()
            .then(setTypes)
            .catch((err: ApiError) =>
                message.error(err.message || 'No se pudieron cargar los tipos de vehículo.')
            );
    }, [form, open, vehicle]);

    const submit = async (values: VehicleDto) => {
        setLoading(true);
        try {
            const payload = { ...values, name: values.name.trim(), plate: values.plate.trim() };
            if (vehicle) await VehicleManagementService.update(vehicle.id, payload);
            else await VehicleManagementService.create(payload);
            message.success(
                isEditing ? 'Vehículo actualizado correctamente.' : 'Vehículo creado correctamente.'
            );
            onSuccess();
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'No se pudo guardar el vehículo.');
            if (apiError.errors) {
                form.setFields(
                    Object.entries(apiError.errors).map(([name, errors]) => ({
                        name: [name],
                        errors,
                    })) as Parameters<FormInstance['setFields']>[0]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => !loading && onClose()}
            title={isEditing ? 'Editar vehículo' : 'Nuevo vehículo'}
            width={520}
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
                        label={isEditing ? 'Guardar cambios' : 'Crear vehículo'}
                        loading={loading}
                        action={() => form.submit()}
                    />
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={submit}
                validateTrigger="onBlur"
                onFinishFailed={() =>
                    message.error('Por favor, revisá los campos marcados en rojo.')
                }
            >
                <InputField
                    name="name"
                    label="Nombre o identificador"
                    placeholder="Ej. Furgoneta blanca"
                    rules={requiredStringRules('El nombre del vehículo', 1, 255)}
                    disabled={loading}
                />
                <InputField
                    name="plate"
                    label="Patente"
                    placeholder="Ej. ABC123"
                    rules={requiredStringRules('La patente', 1, 255)}
                    disabled={loading}
                />
                <SelectField
                    name="type"
                    label="Tipo de vehículo"
                    placeholder="Seleccionar tipo"
                    options={types.map((type) => ({
                        value: type,
                        label: typeLabels[type] ?? type,
                    }))}
                    rules={[{ required: true, message: 'El tipo de vehículo es obligatorio.' }]}
                    loading={loading && !types.length}
                    disabled={loading}
                />
                <Form.Item
                    name="capacity_kg"
                    label="Capacidad (kg)"
                    rules={[
                        {
                            type: 'number',
                            min: 1,
                            message: 'La capacidad debe ser de al menos 1 kg.',
                        },
                    ]}
                >
                    <InputNumber
                        min={1}
                        precision={0}
                        className="w-full"
                        placeholder="Opcional"
                        disabled={loading}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
