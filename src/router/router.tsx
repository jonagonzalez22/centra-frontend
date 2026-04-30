import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StoreLayout } from '@/layouts/StoreLayout';

//TODO create not found page
// import { NotFoundPage } from '@/pages/NotFoundPage';
import { RootRedirect } from './RootRedirect';
import LoginPage from '@/pages/auth/LoginPage';

export const router = createBrowserRouter([
    // ── Raíz ─────────────────────────────────────────
    {
        path: '/',
        element: <RootRedirect />,
    },

    // ── Auth ──────────────────────────────────────────
    //TODO: Include Authlayout with login page.
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
                element: <AdminLayout />,
                children: [
                    /* { index: true, element: <Navigate to="dashboard" replace /> }, */
                    { path: 'dashboard', element: <div>Admin</div> },
                    //TODO: Include admin pages.
                    //{ path: 'dashboard', element: <AdminDashboardPage /> },
                ],
            },
        ],
    },

    // ── Tienda ────────────────────────────────────────
    {
        path: 'tienda',
        children: [
            // Rutes STORE_ADMIN
            {
                element: <ProtectedRoute allowedRoles={['STORE_ADMIN']} />,
                children: [
                    {
                        element: (
                            <StoreLayout>
                                <div>Store</div>
                            </StoreLayout>
                        ),
                        children: [
                            { index: true, element: <Navigate to="dashboard" replace /> },
                            //TODO: Include store admin pages.
                            //{ path: 'dashboard', element: <StoreDashboardPage /> },
                        ],
                    },
                ],
            },

            // TODO: Routes shared between STORE_ADMIN y others (e.g. STORE_LOGISTICS)
            /* {
                element: <ProtectedRoute allowedRoles={['STORE_ADMIN']} />,
                children: [
                    {
                        element: <StoreLayout />,
                        children: [],
                    },
                ],
            }, */
        ],
    },

    // ── 404 ───────────────────────────────────────────
    //TODO: Create a NotFoundPage and include it here.
    /* {
        path: '*',
        element: <NotFoundPage />,
    }, */
]);
