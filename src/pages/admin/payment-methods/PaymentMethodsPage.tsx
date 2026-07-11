import { useState } from 'react';
import { PaymentMethodModal } from '@/features/admin/payment-methods/components/PaymentMethodModal';
import { PaymentMethodsProvider } from '@/features/admin/payment-methods/contexts/PaymentMethodsProvider';
import { PaymentMethodsPageView } from './PaymentMethodsPageView';
import { usePaymentMethods } from '@/features/admin/payment-methods/hooks/usePaymentMethods';
import type { PaymentMethod } from '@/features/admin/payment-methods/types/payment-method.types';

const routeMetadata = {
    title: 'Medios de Pago',
    description: 'Administrá los medios de pago globales del sistema',
    breadcrumbs: [
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'Configuraciones', path: '/admin/configuraciones/metodos-de-pago' },
        { label: 'Medios de Pago' },
    ],
};

export const PaymentMethodsPage = () => {
    const paymentMethodsState = usePaymentMethods();

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>(undefined);

    const handleEdit = (paymentMethod: PaymentMethod) => {
        setSelectedPaymentMethod(paymentMethod);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedPaymentMethod(undefined);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedPaymentMethod(undefined);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setSelectedPaymentMethod(undefined);
        paymentMethodsState.refetch();
    };

    return (
        <PaymentMethodsProvider value={paymentMethodsState}>
            <PaymentMethodsPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                error={paymentMethodsState.error}
                onEdit={handleEdit}
                onCreate={handleCreate}
            />
            <PaymentMethodModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                paymentMethod={selectedPaymentMethod}
            />
        </PaymentMethodsProvider>
    );
};
