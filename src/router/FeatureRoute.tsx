// @/router/FeatureRoute.tsx
import { useAuthStore } from '@/store/useAuthStore.store';
import { Navigate, Outlet } from 'react-router-dom';
import { FeatureCode } from '@/entities/User';
import { hasFeature } from './router.utils';

interface FeatureRouteProps {
    feature: FeatureCode;
    redirectTo?: string;
}

export function FeatureRoute({ feature, redirectTo = '/tienda/dashboard' }: FeatureRouteProps) {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!hasFeature(user, feature)) {
        console.warn(`Acceso denegado: El plan requiere la feature [${feature}]`);
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
}
