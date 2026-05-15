import { useState } from 'react';
import { StoresPageView } from './StoresPageView';
import { StoreModal } from '@/features/admin/stores/components/StoreModal';
import { StoreDetailDrawer } from '@/features/admin/stores/components/StoreDetailDrawer';
import { useStores } from '@/features/admin/stores/hooks/useStores';
import { useAuthStore } from '@/store/useAuthStore.store';
import { StoresProvider } from '@/features/admin/stores/contexts/StoresProvider';
import type { Store } from '@/features/admin/stores/types/store.types';

const routeMetadata = {
    title: 'Gestión de Tiendas',
    description: 'Administra las tiendas registradas en el sistema',
    breadcrumbs: [
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'Tiendas' },
    ],
};

export const StoresPage = () => {
    const storesState = useStores();
    const { user } = useAuthStore();
    const canCreateStore = user?.permissions.includes('stores.create') ?? false;

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | undefined>(undefined);
    const [viewStoreId, setViewStoreId] = useState<string | undefined>(undefined);

    const handleEdit = (store: Store) => {
        setSelectedStore(store);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedStore(undefined);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedStore(undefined);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setSelectedStore(undefined);
        storesState.refetch();
    };

    const handleView = (storeId: string) => {
        setViewStoreId(storeId);
    };

    const handleViewClose = () => {
        setViewStoreId(undefined);
    };

    return (
        <StoresProvider value={storesState}>
            <StoresPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                canCreateStore={canCreateStore}
                error={storesState.error}
                onEdit={handleEdit}
                onCreate={handleCreate}
                onView={handleView}
            />
            <StoreModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                store={selectedStore}
                filterOptions={storesState.filterOptions}
                filterOptionsLoading={storesState.filterOptionsLoading}
            />
            <StoreDetailDrawer
                open={!!viewStoreId}
                onClose={handleViewClose}
                storeId={viewStoreId}
            />
        </StoresProvider>
    );
};