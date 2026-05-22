import { useState } from 'react';
import { FeatureModal } from '@/features/admin/features/components/FeatureModal';
import { FeaturesProvider } from '@/features/admin/features/contexts/FeaturesProvider';
import { FeaturesPageView } from './FeaturesPageView';
import { useFeatures } from '@/features/admin/features/hooks/useFeatures';
import type { Feature } from '@/features/admin/features/types/feature.types';

const routeMetadata = {
    title: 'Funcionalidades',
    description: 'Administra las funcionalidades del sistema',
    breadcrumbs: [
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'Configuraciones', path: '/admin/configuraciones' },
        { label: 'Funcionalidades' },
    ],
};

export const FeaturesPage = () => {
    const featuresState = useFeatures();

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<Feature | undefined>(undefined);

    const handleEdit = (feature: Feature) => {
        setSelectedFeature(feature);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedFeature(undefined);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedFeature(undefined);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setSelectedFeature(undefined);
        featuresState.refetch();
    };

    return (
        <FeaturesProvider value={featuresState}>
            <FeaturesPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                error={featuresState.error}
                onEdit={handleEdit}
                onCreate={handleCreate}
            />
            <FeatureModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                feature={selectedFeature}
            />
        </FeaturesProvider>
    );
};