import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore.store';
import StoreDashboardPage from './StoreDashboardPage';

vi.mock('@/store/useAuthStore.store', () => ({ useAuthStore: vi.fn() }));

const mockStore = vi.mocked(useAuthStore);

describe('StoreDashboardPage', () => {
    test('prioritizes the driver module for a driver with deliveries and no permissions', () => {
        mockStore.mockImplementation((selector) =>
            selector({
                user: {
                    id: 1,
                    name: 'Repartidor',
                    email: 'driver@example.com',
                    store_id: 1,
                    store: null,
                    is_active: true,
                    roles: ['STORE_DRIVER'],
                    permissions: [],
                    features: [{ code: 'deliveries', limit: null }],
                },
            } as never)
        );

        render(
            <MemoryRouter initialEntries={['/tienda/dashboard']}>
                <Routes>
                    <Route path="/tienda/dashboard" element={<StoreDashboardPage />} />
                    <Route path="/tienda/conductor/rutas" element={<div>Mis Rutas</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Mis Rutas')).toBeInTheDocument();
        expect(screen.queryByText('Sin módulos disponibles')).not.toBeInTheDocument();
    });

    test('keeps the no-modules state for a driver without deliveries', () => {
        mockStore.mockImplementation((selector) =>
            selector({
                user: {
                    id: 1,
                    name: 'Repartidor',
                    email: 'driver@example.com',
                    store_id: 1,
                    store: null,
                    is_active: true,
                    roles: ['STORE_DRIVER'],
                    permissions: [],
                    features: [],
                },
            } as never)
        );

        render(<StoreDashboardPage />);

        expect(screen.getByText('Sin módulos disponibles')).toBeInTheDocument();
    });
});
