import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PermissionRoute } from './PermissionRoute';
import { useAuthStore } from '@/store/useAuthStore.store';
import type { User } from '@/entities/User';

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: vi.fn(),
}));

const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    store_id: null,
    store: null,
    roles: [],
    permissions: [],
    features: [],
};

describe('PermissionRoute', () => {
    const renderWithAuth = (userMock: User | null, isAuth: boolean) => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: userMock,
            isAuthenticated: isAuth,
        } as unknown as ReturnType<typeof useAuthStore>);

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route path="/admin/dashboard" element={<div>Dashboard</div>} />
                    <Route path="/fallback" element={<div>Fallback</div>} />
                    <Route
                        path="/protected"
                        element={
                            <PermissionRoute permission="stores.view" redirectTo="/fallback" />
                        }
                    >
                        <Route index element={<div>Protected Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
    };

    test('redirects to /login when not authenticated', () => {
        renderWithAuth(null, false);

        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('redirects to /login when user is null', () => {
        renderWithAuth(null, true);

        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    test('renders outlet when user is SUPER_ADMIN with required permission', () => {
        renderWithAuth(
            { ...mockUser, id: 1, roles: ['SUPER_ADMIN'], permissions: ['stores.view'] },
            true
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('redirects when SUPER_ADMIN lacks required permission', () => {
        renderWithAuth(
            { ...mockUser, id: 2, roles: ['SUPER_ADMIN'], permissions: [] },
            true
        );

        expect(screen.getByText('Fallback')).toBeInTheDocument();
    });

    test('renders outlet when user has required permission', () => {
        renderWithAuth(
            { ...mockUser, id: 2, roles: ['STORE_ADMIN'], permissions: ['stores.view'] },
            true
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('redirects to fallback when user lacks required permission', () => {
        renderWithAuth(
            { ...mockUser, id: 3, roles: ['STORE_ADMIN'], permissions: [] },
            true
        );

        expect(screen.getByText('Fallback')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('redirects to custom redirectTo when specified', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { ...mockUser, id: 4, roles: ['STORE_ADMIN'], permissions: [] },
            isAuthenticated: true,
        } as unknown as ReturnType<typeof useAuthStore>);

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/custom" element={<div>Custom Redirect</div>} />
                    <Route
                        path="/protected"
                        element={
                            <PermissionRoute permission="stores.view" redirectTo="/custom" />
                        }
                    >
                        <Route index element={<div>Protected Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Custom Redirect')).toBeInTheDocument();
    });

    test('BACKOFFICE_USER without permission is redirected', () => {
        renderWithAuth(
            { ...mockUser, id: 5, roles: ['BACKOFFICE_USER'], permissions: [] },
            true
        );

        expect(screen.getByText('Fallback')).toBeInTheDocument();
    });
});