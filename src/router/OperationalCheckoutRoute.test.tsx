import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OperationalCheckoutRoute } from './OperationalCheckoutRoute';
import { useAuthStore } from '@/store/useAuthStore.store';
import type { User } from '@/entities/User';

vi.mock('@/store/useAuthStore.store', () => ({ useAuthStore: vi.fn() }));

const user: User = {
    id: 1,
    name: 'Operador',
    email: 'operator@example.com',
    store_id: 1,
    store: null,
    is_active: true,
    roles: ['STORE_USER'],
    permissions: [],
    features: [],
};

const renderWith = (userMock: User) => {
    vi.mocked(useAuthStore).mockReturnValue({
        user: userMock,
        isAuthenticated: true,
    } as ReturnType<typeof useAuthStore>);

    render(
        <MemoryRouter initialEntries={['/tienda/ventas/pos']}>
            <Routes>
                <Route path="/tienda/dashboard" element={<div>Dashboard</div>} />
                <Route path="/tienda/ventas/pos" element={<OperationalCheckoutRoute />}>
                    <Route index element={<div>Caja operativa</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
};

test('allows Caja with POS view', () => {
    renderWith({ ...user, permissions: ['pos.view'], features: [{ code: 'pos', limit: null }] });

    expect(screen.getByText('Caja operativa')).toBeInTheDocument();
});

test('allows Caja for an order creator without POS view', () => {
    renderWith({ ...user, permissions: ['orders.create'], features: [{ code: 'orders', limit: null }] });

    expect(screen.getByText('Caja operativa')).toBeInTheDocument();
});

test('rejects orders.view without order creation or POS view', () => {
    renderWith({ ...user, permissions: ['orders.view'], features: [{ code: 'orders', limit: null }] });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
