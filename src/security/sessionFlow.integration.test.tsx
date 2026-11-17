import { useEffect, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { InternalAxiosRequestConfig } from 'axios';
import api from '@/api/api.config';
import type { User } from '@/entities/User';
import { authService } from '@/features/auth/services/auth.service';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { useAuthStore } from '@/store/useAuthStore.store';
import { clearActiveSession } from './sessionContext';

vi.mock('@/features/auth/services/auth.service');

const mockAuthService = vi.mocked(authService);

function PrivateModule() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        void api.get('/v1/store/orders').then(() => setLoaded(true));
    }, []);

    return <div>{loaded ? 'Módulo privado cargado' : 'Cargando módulo'}</div>;
}

describe('session flow after login', () => {
    const originalAdapter = api.defaults.adapter;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        clearActiveSession('logout');
        useAuthStore.setState({ isAuthenticated: false, user: null, token: null, loading: false });
    });

    afterEach(() => {
        api.defaults.adapter = originalAdapter;
        localStorage.clear();
    });

    test('successful login navigates through the guard and sends the first private request without invalidating the session', async () => {
        const loginUser: User = {
            id: 1,
            is_active: true,
            email: 'store@example.com',
            name: 'Store User',
            // Backend login supplies the store relation; it does not include store_id.
            store: { id: 'store-a', name: 'Store A', business_type: 'retail' },
            roles: ['STORE_ADMIN'],
            permissions: ['orders.view'],
            features: [],
        };
        mockAuthService.logIn.mockResolvedValue({
            status: 'success',
            message: 'Login successful',
            data: {
                user: loginUser,
                token: 'token-a',
                store: loginUser.store!,
            },
            errors: null,
        });
        let requestConfig: InternalAxiosRequestConfig | undefined;
        api.defaults.adapter = async (config) => {
            requestConfig = config;
            return {
                data: { status: 'success', data: { items: [] } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
            };
        };

        await useAuthStore.getState().logIn('store@example.com', 'password');

        render(
            <MemoryRouter initialEntries={['/tienda/pedidos']}>
                <Routes>
                    <Route
                        path="/tienda"
                        element={<ProtectedRoute allowedRoles={['STORE_ADMIN']} />}
                    >
                        <Route path="pedidos" element={<PrivateModule />} />
                    </Route>
                    <Route path="/login" element={<div>Login</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText('Módulo privado cargado')).toBeInTheDocument();
        await waitFor(() => expect(requestConfig).toBeDefined());
        expect(requestConfig?.headers.Authorization).toBe('Bearer token-a');
        expect(useAuthStore.getState()).toMatchObject({
            isAuthenticated: true,
            token: 'token-a',
            user: { id: 1 },
        });
        expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });
});
