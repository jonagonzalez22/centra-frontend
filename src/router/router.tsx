import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';

import { RootRedirect } from './RootRedirect';
import LoginPage from '@/pages/auth/LoginPage';
import { StoresPage } from '@/pages/admin/stores/StoresPage';
import { StoreShowPage } from '@/pages/admin/stores/StoreShowPage';
import { PermissionRoute } from './PermissionRoute';
import { NotFoundPage } from '@/pages/not-found';

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
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BACKOFFICE_USER']} />,
        children: [
            {
                element: <AppLayout title="Backoffice Admin" />,
                children: [
                    { index: true, element: <Navigate to="dashboard" replace /> },
                    { path: 'dashboard', element: <div>Admin</div> },

                    {
                        element: <PermissionRoute permission="stores.view" />,
                        children: [
        { path: 'tiendas', element: <StoresPage /> },
        { path: 'tiendas/:id', element: <StoreShowPage /> },
    ],
                    },

                    {
                        element: <PermissionRoute permission="plans.view" />,
                        children: [{ path: 'planes', element: <div>Planes</div> }],
                    },
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

    // ── Catch-all 404 ─────────────────────────────────
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);
