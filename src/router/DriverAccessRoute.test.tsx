import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore.store';
import { DriverAccessRoute } from './DriverAccessRoute';

vi.mock('@/store/useAuthStore.store', () => ({ useAuthStore: vi.fn() }));

const mockStore = vi.mocked(useAuthStore);

const renderRoute = (features: { code: 'deliveries'; limit: null }[]) => {
    mockStore.mockReturnValue({
        isAuthenticated: true,
        user: {
            id: 1,
            name: 'Repartidor',
            email: 'driver@example.com',
            store_id: 1,
            store: null,
            is_active: true,
            roles: ['STORE_DRIVER'],
            permissions: [],
            features,
        },
    } as never);

    render(
        <MemoryRouter initialEntries={['/tienda/conductor/rutas']}>
            <Routes>
                <Route path="/tienda/conductor" element={<DriverAccessRoute />}>
                    <Route path="rutas" element={<div>Mis rutas autorizadas</div>} />
                </Route>
                <Route path="/tienda/dashboard" element={<div>Dashboard</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('DriverAccessRoute', () => {
    test('allows a STORE_DRIVER with deliveries and no administrative permissions', () => {
        renderRoute([{ code: 'deliveries', limit: null }]);

        expect(screen.getByText('Mis rutas autorizadas')).toBeInTheDocument();
    });

    test('redirects a STORE_DRIVER without deliveries to the store dashboard', () => {
        renderRoute([]);

        expect(screen.queryByText('Mis rutas autorizadas')).not.toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
});
