import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore.store';
import { Button } from './components/Button';
import { AuthLayout } from './layouts/AuthLayout/AuthLayout';

function App() {
    const { user, token, isAuthenticated, logIn, logout } = useAuthStore();
    useEffect(() => {
        console.log('Auth state:', { user, token, isAuthenticated });
    }, [user, token, isAuthenticated]);

    const handleLogin = async () => {
        try {
            await logIn('admin@centra.com', 'password');
            console.log('Login exitoso');
        } catch (error) {
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
                <p>isAuthenticated: {String(isAuthenticated)}</p>
                <p>user: {user ? JSON.stringify(user) : 'null'}</p>
                <p>token: {token ?? 'null'}</p>
                <Button action={handleLogin} label="Login" />
                <Button action={handleLogout} label="Logout" variant="danger" />
            </div>
        </AuthLayout>
    );
}

export default App;
