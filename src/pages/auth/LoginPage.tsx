import { Button } from '@/components/Button';
import { AuthLayout } from '@/layouts/AuthLayout/AuthLayout';
import { useAuthStore } from '@/store/useAuthStore.store';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getHomePath, hasAccessToPath } from '@/router/router.utils';

function LoginPage() {
    const { logIn, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async () => {
        try {
            await logIn('admin@centra.com', 'password');
            console.log('Login exitoso');

            const { user } = useAuthStore.getState();
            if (!user) return;

            const from = location.state?.from?.pathname as string | undefined;
            console.log('Intentando redirigir a:', from);
            const destination =
                from && hasAccessToPath(user.roles, from) ? from : getHomePath(user.roles);

            navigate(destination, { replace: true });
        } catch (error) {
            useAuthStore.persist.clearStorage();
            console.error('Error en login:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            console.log('Logout exitoso');
        } catch (error) {
            console.error('Error en logout:', error);
        }
    };
    return (
        <AuthLayout>
            <div>
                <Button action={handleLogin} label="Login" />
                <Button action={handleLogout} label="Logout" variant="danger" />
            </div>
        </AuthLayout>
    );
}

export default LoginPage;
