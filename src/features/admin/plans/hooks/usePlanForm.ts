import { useState, useCallback } from 'react';
import { message } from 'antd';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { PlansService } from '../services/plans.service';
import type { CreatePlanDto, Plan, UpdatePlanDto } from '../types/plan.types';

interface UsePlanFormReturn {
    loading: boolean;
    createPlan: (data: CreatePlanDto) => Promise<void>;
    updatePlan: (id: string, data: UpdatePlanDto) => Promise<void>;
    reset: () => void;
}

interface UsePlanFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const usePlanForm = (options?: UsePlanFormOptions): UsePlanFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);

    const createPlan = useCallback(
        async (data: CreatePlanDto) => {
            setLoading(true);
            try {
                await PlansService.create(data);
                message.success('Plan creado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al crear el plan.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const updatePlan = useCallback(
        async (id: string, data: UpdatePlanDto) => {
            setLoading(true);
            try {
                await PlansService.update(id, data);
                message.success('Plan actualizado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al actualizar el plan.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const reset = useCallback(() => {
        setLoading(false);
    }, []);

    return { loading, createPlan, updatePlan, reset };
};

export const buildInitialValuesFromPlan = (plan: Plan): Partial<CreatePlanDto> => ({
    name: plan.name,
    description: plan.description,
    price: plan.price,
    billing_cycle: plan.billing_cycle,
    is_trial: plan.is_trial,
    is_active: plan.is_active,
});
