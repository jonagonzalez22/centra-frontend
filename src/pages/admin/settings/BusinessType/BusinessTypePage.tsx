import { useState } from 'react';
import { BusinessTypeModal } from '@/features/admin/business-types/components/BusinessTypeModal';
import { BusinessTypesProvider } from '@/features/admin/business-types/contexts/BusinessTypesProvider';
import { BusinessTypesPageView } from './BusinessTypesPageView';
import { useBusinessTypes } from '@/features/admin/business-types/hooks/useBusinessTypes';
import type { BusinessType } from '@/features/admin/business-types/types/business-type.types';

const routeMetadata = {
    title: 'Tipos de Negocio',
    description: 'Administra los tipos de negocio del sistema',
    breadcrumbs: [
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'Configuraciones', path: '/admin/configuraciones/tipos-de-negocio' },
        { label: 'Tipos de Negocio' },
    ],
};

export const BusinessTypePage = () => {
    const businessTypesState = useBusinessTypes();

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | undefined>(undefined);

    const handleEdit = (businessType: BusinessType) => {
        setSelectedBusinessType(businessType);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedBusinessType(undefined);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedBusinessType(undefined);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setSelectedBusinessType(undefined);
        businessTypesState.refetch();
    };

    return (
        <BusinessTypesProvider value={businessTypesState}>
            <BusinessTypesPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                error={businessTypesState.error}
                onEdit={handleEdit}
                onCreate={handleCreate}
            />
            <BusinessTypeModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                businessType={selectedBusinessType}
            />
        </BusinessTypesProvider>
    );
};