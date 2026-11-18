import { useEffect, useState } from 'react';
import { Alert, Breadcrumb, Form, Input, message } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import Modal from '@/components/Modal/Modal';
import SelectField from '@/components/SelectField/SelectField';
import { useVehiclesManagement } from '@/features/store/logistics/vehicles/hooks/useVehiclesManagement';
import { VehicleFormModal } from '@/features/store/logistics/vehicles/components/VehicleFormModal';
import { VehiclesTable } from '@/features/store/logistics/vehicles/components/VehiclesTable';
import { VehicleFilters } from '@/features/store/logistics/vehicles/components/VehicleFilters';
import { VehicleManagementService } from '@/features/store/logistics/vehicles/services/vehicles.service';
import type {
    Vehicle,
    VehicleType,
} from '@/features/store/logistics/vehicles/interfaces/vehicle.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './VehiclesPage.css';

const reasonLabels: Record<string, string> = {
    maintenance: 'Mantenimiento',
    repair: 'Reparación',
    accident: 'Accidente',
    unavailable: 'No disponible',
    other: 'Otro',
};

export const VehiclesPage = () => {
    const {
        items,
        total,
        per_page,
        current_page,
        loading,
        error,
        filters,
        setFilters,
        setPage,
        refresh,
    } = useVehiclesManagement();
    const [types, setTypes] = useState<VehicleType[]>([]);
    const [reasons, setReasons] = useState<string[]>([]);
    const [formOpen, setFormOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>();
    const [toDeactivate, setToDeactivate] = useState<Vehicle>();
    const [actionLoadingId, setActionLoadingId] = useState<string>();
    const [deactivationForm] = Form.useForm<{
        inactivation_reason: string;
        inactivation_notes?: string;
    }>();
    const reason = Form.useWatch('inactivation_reason', deactivationForm);

    useEffect(() => {
        VehicleManagementService.getTypes()
            .then(setTypes)
            .catch(() => setTypes([]));
        VehicleManagementService.getInactivationReasons()
            .then(setReasons)
            .catch(() => setReasons([]));
    }, []);

    const handleAction = async (
        vehicle: Vehicle,
        action: () => Promise<void>,
        fallback: string
    ) => {
        setActionLoadingId(vehicle.id);
        try {
            await action();
            refresh();
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || fallback);
        } finally {
            setActionLoadingId(undefined);
        }
    };
    const closeForm = () => {
        setFormOpen(false);
        setSelectedVehicle(undefined);
    };
    const openCreate = () => {
        setSelectedVehicle(undefined);
        setFormOpen(true);
    };
    const openDeactivate = (vehicle: Vehicle) => {
        deactivationForm.resetFields();
        setToDeactivate(vehicle);
    };
    const confirmDeactivation = async (values: {
        inactivation_reason: string;
        inactivation_notes?: string;
    }) => {
        if (!toDeactivate) return;
        await handleAction(
            toDeactivate,
            async () => {
                await VehicleManagementService.toggleActive(toDeactivate.id, {
                    is_active: false,
                    ...values,
                });
                message.success('Vehículo desactivado correctamente.');
                setToDeactivate(undefined);
            },
            'No se pudo desactivar el vehículo.'
        );
    };

    return (
        <div className="vehiclesPage">
            <Breadcrumb
                className="vehiclesPageBreadcrumb"
                items={[
                    { title: <Link to="/tienda/dashboard">Tienda</Link> },
                    { title: 'Logística' },
                    { title: 'Vehículos' },
                ]}
            />
            <div className="vehiclesPageHeader">
                <div className="vehiclesPageHeaderText">
                    <h1 className="vehiclesPageTitle">Vehículos</h1>
                    <p className="vehiclesPageDescription">
                        Administrá los vehículos disponibles para las rutas de tu tienda.
                    </p>
                </div>
                <CanDo permission="vehicles.create">
                    <Button
                        variant="primary"
                        label="Nuevo vehículo"
                        icon={<PlusOutlined />}
                        action={openCreate}
                    />
                </CanDo>
            </div>
            <VehicleFilters
                filters={filters}
                types={types}
                onChange={setFilters}
                onReset={() =>
                    setFilters({ search: undefined, type: undefined, is_active: undefined })
                }
            />
            {error && (
                <Alert className="vehiclesPageAlert" type="error" description={error} showIcon />
            )}
            <VehiclesTable
                items={items}
                total={total}
                current={current_page}
                pageSize={per_page}
                loading={loading}
                onPageChange={setPage}
                onEdit={(vehicle) => {
                    setSelectedVehicle(vehicle);
                    setFormOpen(true);
                }}
                onDeactivate={openDeactivate}
                onActivate={(vehicle) =>
                    handleAction(
                        vehicle,
                        async () => {
                            await VehicleManagementService.toggleActive(vehicle.id, {
                                is_active: true,
                            });
                            message.success('Vehículo reactivado correctamente.');
                        },
                        'No se pudo reactivar el vehículo.'
                    )
                }
                onDelete={(vehicle) =>
                    handleAction(
                        vehicle,
                        async () => {
                            await VehicleManagementService.delete(vehicle.id);
                            message.success('Vehículo eliminado correctamente.');
                        },
                        'No se pudo eliminar el vehículo.'
                    )
                }
                actionLoadingId={actionLoadingId}
            />
            <VehicleFormModal
                open={formOpen}
                vehicle={selectedVehicle}
                onClose={closeForm}
                onSuccess={() => {
                    closeForm();
                    refresh();
                }}
            />
            <Modal
                open={Boolean(toDeactivate)}
                onClose={() => setToDeactivate(undefined)}
                title="Desactivar vehículo"
                width={480}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="default"
                            label="Cancelar"
                            action={() => setToDeactivate(undefined)}
                            disabled={Boolean(actionLoadingId)}
                        />
                        <Button
                            variant="warning"
                            label="Desactivar"
                            loading={Boolean(actionLoadingId)}
                            action={() => deactivationForm.submit()}
                        />
                    </div>
                }
            >
                <p>El vehículo no podrá asignarse a nuevas rutas.</p>
                <Form form={deactivationForm} layout="vertical" onFinish={confirmDeactivation}>
                    <SelectField
                        name="inactivation_reason"
                        label="Motivo"
                        placeholder="Seleccionar motivo"
                        options={reasons.map((item) => ({
                            value: item,
                            label: reasonLabels[item] ?? item,
                        }))}
                        rules={[
                            {
                                required: true,
                                message: 'El motivo de inactivación es obligatorio.',
                            },
                        ]}
                    />
                    <Form.Item
                        name="inactivation_notes"
                        label="Notas"
                        rules={
                            reason === 'other'
                                ? [
                                      {
                                          required: true,
                                          message:
                                              'Las notas son obligatorias para el motivo Otro.',
                                      },
                                      { max: 1000, message: 'Máximo 1000 caracteres.' },
                                  ]
                                : [{ max: 1000, message: 'Máximo 1000 caracteres.' }]
                        }
                    >
                        <Input.TextArea rows={3} placeholder="Opcional" maxLength={1000} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
