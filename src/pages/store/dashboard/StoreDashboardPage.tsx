import { Empty, Result } from 'antd';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore.store';
import { canAccessDriverDeliveries } from '@/router/router.utils';

const StoreDashboardPage: React.FC = () => {
    const user = useAuthStore((s) => s.user);

    const isStoreAdmin = user?.roles.includes('STORE_ADMIN') ?? false;
    const hasAny = (user?.permissions?.length ?? 0) > 0;

    if (user && canAccessDriverDeliveries(user)) {
        return <Navigate to="/tienda/conductor/rutas" replace />;
    }

    // STORE_ADMIN siempre ve el dashboard; define permisos, no los recibe
    if (!isStoreAdmin && !hasAny) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Result
                    status="info"
                    title="Sin módulos disponibles"
                    subTitle="No tenés permisos asignados para ver ningún módulo de la aplicación. Comunicate con el administrador de la tienda para que te asigne los permisos correspondientes."
                />
            </div>
        );
    }

    return (
        <div className="p-4">
            <Empty
                description="Seleccioná un módulo del menú lateral para empezar."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        </div>
    );
};

export default StoreDashboardPage;
