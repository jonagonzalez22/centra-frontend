import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useStorePaymentMethods, useStorePaymentMethodForm } from '@/features/store/payment-methods/hooks/useStorePaymentMethods';
import { StorePaymentMethodsTable } from '@/features/store/payment-methods/components/StorePaymentMethodsTable';
import { StorePaymentMethodDrawer } from '@/features/store/payment-methods/components/StorePaymentMethodDrawer';
import type { StorePaymentMethod, UpdateStorePaymentMethodDto } from '@/features/store/payment-methods/interfaces/store-payment-method.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { StorePaymentMethodsService } from '@/features/store/payment-methods/services/store-payment-methods.service';

export const StorePaymentMethodsPage = () => {
    const { paymentMethods, loading, refetch } = useStorePaymentMethods();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<StorePaymentMethod | null>(null);

    const handleDrawerSuccess = useCallback(() => {
        setDrawerOpen(false);
        setSelectedMethod(null);
        refetch();
    }, [refetch]);

    const { saving, updateMethod } = useStorePaymentMethodForm(handleDrawerSuccess);

    const handleConfigure = useCallback((method: StorePaymentMethod) => {
        setSelectedMethod(method);
        setDrawerOpen(true);
    }, []);

    const handleDrawerClose = useCallback(() => {
        setDrawerOpen(false);
        setSelectedMethod(null);
    }, []);

    const handleToggleEnabled = useCallback(
        async (method: StorePaymentMethod, enabled: boolean) => {
            try {
                const dto: UpdateStorePaymentMethodDto = { is_enabled: enabled };
                await StorePaymentMethodsService.update(method.id, dto);
                message.success(
                    `Medio ${enabled ? 'habilitado' : 'deshabilitado'} correctamente.`
                );
                refetch();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al cambiar el estado del medio de pago.');
            }
        },
        [refetch]
    );

    const handleSave = useCallback(
        async (id: string, dto: UpdateStorePaymentMethodDto) => {
            await updateMethod(id, dto);
        },
        [updateMethod]
    );

    return (
        <div>
            <StorePaymentMethodsTable
                paymentMethods={paymentMethods}
                loading={loading}
                onConfigure={handleConfigure}
                onToggleEnabled={handleToggleEnabled}
            />

            <StorePaymentMethodDrawer
                open={drawerOpen}
                method={selectedMethod}
                saving={saving}
                onClose={handleDrawerClose}
                onSave={handleSave}
            />
        </div>
    );
};
