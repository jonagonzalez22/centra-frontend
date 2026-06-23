import { InventoryMovementsPageView } from './InventoryMovementsPageView';
import { InventoryMovementsProvider } from '@/features/store/inventory/context/InventoryMovementsProvider';
import { useInventoryMovements } from '@/features/store/inventory/hooks/useInventoryMovements';

const routeMetadata = {
    title: 'Movimientos de Inventario',
    description: 'Historial de movimientos de stock de tu tienda',
    breadcrumbs: [
        { label: 'Tienda', path: '/tienda/dashboard' },
        { label: 'Inventario', path: '/tienda/productos' },
        { label: 'Movimientos' },
    ],
};

export const InventoryMovementsPage = () => {
    const movementsState = useInventoryMovements();

    return (
        <InventoryMovementsProvider value={movementsState}>
            <InventoryMovementsPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                error={movementsState.error}
            />
        </InventoryMovementsProvider>
    );
};
