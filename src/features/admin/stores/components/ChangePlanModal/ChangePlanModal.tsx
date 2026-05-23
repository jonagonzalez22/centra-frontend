import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import Select from 'antd/es/select';
import Tag from '@/components/Tag/Tag';
import { Card } from '@/components/Card';
import { message, Spin } from 'antd';
import { Form } from 'antd';
import { PlansService } from '@/features/admin/plans/services/plans.service';
import { StoresService } from '../../services/stores.service';
import type { Plan } from '@/features/admin/plans/types/plan.types';

interface ChangePlanModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeId: string;
    currentPlanId?: string;
}

const formatPrice = (price: number): string =>
    `$ ${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
    open,
    onClose,
    onSuccess,
    storeId,
    currentPlanId,
}) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);

    const getErrorMessage = (err: unknown, fallback: string): string => {
        if (err && typeof err === 'object') {
            if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
                return (err as { message: string }).message;
            }
            if ('data' in err && (err as { data?: { message?: string } }).data?.message) {
                return (err as { data: { message: string } }).data.message;
            }
        }
        return fallback;
    };

    const fetchPlans = useCallback(async () => {
        setFetching(true);
        try {
            const response = await PlansService.getAll();
            setPlans(response.items);
        } catch (err) {
            message.error(getErrorMessage(err, 'Error al cargar los planes disponibles.'));
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchPlans();
        } else {
            setPlans([]);
            setSelectedPlanId(null);
        }
    }, [open, fetchPlans]);

    const handleSubmit = async () => {
        if (!selectedPlanId) {
            message.warning('Seleccioná un plan para continuar.');
            return;
        }

        if (selectedPlanId === currentPlanId) {
            message.warning('El plan seleccionado es el mismo que el actual.');
            return;
        }

        setLoading(true);
        try {
            await StoresService.update(storeId, { plan_id: selectedPlanId });
            message.success('Plan actualizado correctamente.');
            onSuccess();
        } catch (err) {
            message.error(getErrorMessage(err, 'Error al cambiar el plan.'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    const planOptions = plans.map((p) => ({
        label: p.name,
        value: p.id,
    }));

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Cambiar Plan"
            width={520}
            footer={
                <div className="flex justify-end gap-3">
                    <Button
                        variant="default"
                        label="Cancelar"
                        action={handleClose}
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        label="Cambiar Plan"
                        loading={loading}
                        action={handleSubmit}
                    />
                </div>
            }
            destroyOnClose
        >
            {fetching ? (
                <div className="flex justify-center py-8">
                    <Spin />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <Form.Item
                        name="plan_id"
                        label="Nuevo Plan"
                        labelCol={{ style: { paddingBottom: 1 } }}
                    >
                        <Select
                            placeholder="Seleccionar un plan"
                            options={planOptions}
                            value={selectedPlanId}
                            onChange={(value) => setSelectedPlanId(value as string)}
                            loading={fetching}
                            disabled={loading}
                        />
                    </Form.Item>

                    {selectedPlan && (
                        <Card>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">
                                        {selectedPlan.name}
                                    </span>
                                    <Tag
                                        color={
                                            selectedPlan.billing_cycle === 'monthly'
                                                ? 'blue'
                                                : 'purple'
                                        }
                                    >
                                        {selectedPlan.billing_cycle === 'monthly'
                                            ? 'Mensual'
                                            : 'Anual'}
                                    </Tag>
                                    {selectedPlan.is_trial && (
                                        <Tag color="orange">Trial</Tag>
                                    )}
                                </div>

                                <div className="text-lg font-semibold">
                                    {formatPrice(selectedPlan.price)}
                                </div>

                                <div className="text-xs text-gray-500">
                                    {selectedPlan.description || 'Sin descripción'}
                                </div>

                                <div className="text-xs text-gray-500 mt-1">
                                    Funcionalidades:
                                </div>
                                <div
                                    className={`grid gap-1 ${selectedPlan.features.length > 6 ? 'grid-cols-3' : selectedPlan.features.length > 3 ? 'grid-cols-2' : 'grid-cols-1'}`}
                                >
                                    {selectedPlan.features.map((f) => (
                                        <div key={f.id} className="text-xs">
                                            • {f.limit_value !== null
                                                ? `${f.name}: ${f.limit_value}`
                                                : f.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {!selectedPlan && plans.length > 0 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                            Seleccioná un plan para ver el resumen
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};