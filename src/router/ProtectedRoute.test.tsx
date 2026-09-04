import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store/useAuthStore.store';

vi.mock('@/store/useAuthStore.store', () => ({ useAuthStore: vi.fn() }));

const mockStore = vi.mocked(useAuthStore);
const user = (roles: string[]) => ({
    id: 1,
    name: 'Test',
    email: 'test@example.com',
    store_id: 1,
    store: null,
    is_active: true,
    roles,
    permissions: ['drivers.view'],
    features: [],
});

const renderRoute = (roles: string[]) => {
    mockStore.mockReturnValue({
        isAuthenticated: true,
        user: user(roles) as never,
    } as never);
    render(
        <MemoryRouter initialEntries={['/driver'] }>
            <Routes>
                <Route
                    path="/driver"
                    element={<ProtectedRoute allowedRoles={['STORE_DRIVER']} />}
                >
                    <Route index element={<div>Driver page</div>} />
                </Route>
                <Route path="/tienda" element={<div>Store home</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('ProtectedRoute driver role boundary', () => {
    beforeEach(() => vi.clearAllMocks());

    test('allows STORE_DRIVER', () => {
        renderRoute(['STORE_DRIVER']);
        expect(screen.getByText('Driver page')).toBeInTheDocument();
    });

    test('does not mount driver content for STORE_ADMIN', () => {
        renderRoute(['STORE_ADMIN']);
        expect(screen.queryByText('Driver page')).not.toBeInTheDocument();
    });
});
