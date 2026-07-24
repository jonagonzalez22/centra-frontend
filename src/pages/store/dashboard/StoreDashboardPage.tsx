import { Empty, Result } from 'antd';
import { useAuthStore } from '@/store/useAuthStore.store';

const StoreDashboardPage: React.FC = () => {
    const user = useAuthStore((s) => s.user);

    const hasAny = (user?.permissions?.length ?? 0) > 0;

    if (!hasAny) {
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
