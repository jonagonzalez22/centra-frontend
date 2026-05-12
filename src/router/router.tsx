import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';

import { RootRedirect } from './RootRedirect';
import LoginPage from '@/pages/auth/LoginPage';
import { StoresPage } from '@/pages/admin/stores/StoresPage';

export const router = createBrowserRouter([
    // ── Raíz ─────────────────────────────────────────
    {
        path: '/',
        element: <RootRedirect />,
    },

    // ── Auth ──────────────────────────────────────────
    {
        path: 'login',
        element: <LoginPage />,
    },

    // ── Admin ─────────────────────────────────────────
    {
        path: 'admin',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
        children: [
            {
                element: <AppLayout title="Backoffice Admin" />,
                children: [
                    { index: true, element: <Navigate to="dashboard" replace /> },
                    { path: 'dashboard', element: <div>Admin</div> },
                    { path: 'tiendas', element: <StoresPage /> },
                ],
            },
        ],
    },

    // ── Tienda ────────────────────────────────────────
    {
        path: 'tienda',
        element: <ProtectedRoute allowedRoles={['STORE_ADMIN']} />,
        children: [
            {
                element: <AppLayout title="Mi Tienda" />,
                children: [
                    { index: true, element: <Navigate to="dashboard" replace /> },
                    { path: 'dashboard', element: <div>Admin</div> },
                ],
            },
        ],
    },
]);
