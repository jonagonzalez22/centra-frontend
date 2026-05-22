import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { PlanForm } from '../PlanForm';
import { usePlanForm, buildInitialValuesFromPlan } from '../../hooks/usePlanForm';
import type { Plan, CreatePlanDto } from '../../types/plan.types';

interface PlanModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plan?: Plan;
}

export const PlanModal: React.FC<PlanModalProps> = ({ open, onClose, onSuccess, plan }) => {
    const [form] = Form.useForm();
    const { loading, createPlan, updatePlan } = usePlanForm({ onSuccess });

    const isEditing = !!plan;
    const title = isEditing ? 'Editar Plan' : 'Crear Plan';

    useEffect(() => {
        if (open) {
            if (plan) {
                form.setFieldsValue(buildInitialValuesFromPlan(plan));
            } else {
                form.resetFields();
            }
        }
    }, [open, plan, form]);

    const handleSubmit = async (values: CreatePlanDto) => {
        if (isEditing && plan) {
            await updatePlan(plan.id, values);
        } else {
            await createPlan(values);
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
            width={720}
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
                        label={isEditing ? 'Actualizar' : 'Crear'}
                        loading={loading}
                        htmlType="button"
                        action={() => {
                            const formEl = document.getElementById(
                                'planForm'
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
            <PlanForm formId="planForm" form={form} loading={loading} onSubmit={handleSubmit} />
        </Modal>
    );
};
