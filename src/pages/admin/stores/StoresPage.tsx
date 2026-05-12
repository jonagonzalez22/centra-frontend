import { StoresPageView } from './StoresPageView';
import { useStores } from '@/features/admin/stores/hooks/useStores';
import { useAuthStore } from '@/store/useAuthStore.store';
import { StoresProvider } from '@/features/admin/stores/contexts/StoresProvider';

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

    return (
        <StoresProvider value={storesState}>
            <StoresPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                canCreateStore={canCreateStore}
                error={storesState.error}
            />
        </StoresProvider>
    );
};