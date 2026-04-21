import { useAuthStore } from '@/store/useAuthStore.store';
import { Navigate } from 'react-router-dom';
import { getHomePath } from './router.utils';

export function RootRedirect() {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to={getHomePath(user.roles)} replace />;
}
