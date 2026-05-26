import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';

import { RootRedirect } from './RootRedirect';
import LoginPage from '@/pages/auth/LoginPage';
import { StoresPage } from '@/pages/admin/stores/StoresPage';
import { StoreShowPage } from '@/pages/admin/stores/StoreShowPage';
import { UsersPage } from '@/pages/admin/users/UsersPage';
import { DashboardPage } from '@/pages/admin/dashboard/DashboardPage';
import { PermissionRoute } from './PermissionRoute';
import { NotFoundPage } from '@/pages/not-found';
import { BusinessTypePage } from '@/pages/admin/settings/BusinessType/BusinessTypePage';
import { FeaturesPage } from '@/pages/admin/settings/Feature/FeaturesPage';
import { RolesPage } from '@/pages/admin/settings/Roles/RolesPage';
import { PlansPage } from '@/pages/admin/plans/PlansPage';

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
                    { path: 'dashboard', element: <DashboardPage /> },

                    {
                        element: <PermissionRoute permission="stores.view" />,
                        children: [
                            { path: 'tiendas', element: <StoresPage /> },
                            { path: 'tiendas/:id', element: <StoreShowPage /> },
                        ],
                    },

                    {
                        element: <PermissionRoute permission="users.view" />,
                        children: [
                            { path: 'usuarios', element: <UsersPage /> },
                        ],
                    },

                    {
                        element: <PermissionRoute permission="plans.view" />,
                        children: [{ path: 'planes', element: <PlansPage /> }],
                    },

                    {
                        element: <PermissionRoute permission="settings.view" />,
                        children: [
                            {
                                path: 'configuraciones/tipos-de-negocio',
                                element: <BusinessTypePage />,
                            },
                            {
                                path: 'configuraciones/funcionalidades',
                                element: <FeaturesPage />,
                            },
                            {
                                path: 'configuraciones/roles',
                                element: <RolesPage />,
                            },
                        ],
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
