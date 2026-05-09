import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';

import { RootRedirect } from './RootRedirect';
import LoginPage from '@/pages/auth/LoginPage';
import { StoresPage } from '@/pages/admin/stores/StoresPage';

const adminMenuItems = [
    { key: '/admin', label: 'Dashboard' },
    { key: '/admin/stores', label: 'Tiendas' },
    { key: '/admin/plans', label: 'Planes' },
];

const storeMenuItems = [
    { key: '/tienda/stock', label: 'Stock' },
    { key: '/tienda/pos', label: 'POS' },
    { key: '/tienda/orders', label: 'Pedidos' },
];

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
                element: <AppLayout title="Backoffice Admin" menuItems={adminMenuItems} />,
                children: [
                    { index: true, element: <Navigate to="dashboard" replace /> },
                    { path: 'dashboard', element: <div>Admin</div> },
                    { path: 'stores', element: <StoresPage /> },
                ],
            },
        ],
    },

    // ── Tienda ────────────────────────────────────────
    {
        path: 'tienda',
        children: [
            {
                element: <ProtectedRoute allowedRoles={['STORE_ADMIN']} />,
                children: [
                    {
                        element: (
                            <AppLayout title="Mi Tienda" menuItems={storeMenuItems}>
                                <div>Store</div>
                            </AppLayout>
                        ),
                        children: [
                            { index: true, element: <Navigate to="dashboard" replace /> },
                        ],
                    },
                ],
            },
        ],
    },
]);