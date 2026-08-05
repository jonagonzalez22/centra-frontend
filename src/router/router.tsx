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
import { FeatureRoute } from './FeatureRoute';
import { NotFoundPage } from '@/pages/not-found';
import { BusinessTypePage } from '@/pages/admin/settings/BusinessType/BusinessTypePage';
import { PaymentMethodsPage } from '@/pages/admin/payment-methods/PaymentMethodsPage';
import { FeaturesPage } from '@/pages/admin/settings/Feature/FeaturesPage';
import { RolesPage } from '@/pages/admin/settings/Roles/RolesPage';
import { PlansPage } from '@/pages/admin/plans/PlansPage';
import { CategoriesPage } from '@/features/store/categories/CategoriesPage';
import { CustomersPage } from '@/pages/store/customers/CustomersPage';
import { CustomerShowPage } from '@/pages/store/customers/CustomerShowPage';
import { CustomersCreatePage } from '@/pages/store/customers/CustomersCreatePage';
import { CommercialGroupsPage } from '@/pages/store/commercial-groups/CommercialGroupsPage';
import { ProductsPage } from '@/pages/store/products/ProductsPage';
import { InventoryMovementsPage } from '@/pages/store/inventory/InventoryMovementsPage';
import { StoreUsersPage } from '@/pages/store/users/StoreUsersPage';
import { CashPage } from '@/pages/store/cash';
import { POSPage } from '@/pages/store/sales';
import { OrdersPage } from '@/pages/store/orders';
import { StorePaymentMethodsPage } from '@/pages/store/payment-methods/StorePaymentMethodsPage';
import { StoreDashboardPage } from '@/pages/store/dashboard';
import { RoutesPage } from '@/pages/store/logistics/RoutesPage';
import { RouteDetailPage } from '@/pages/store/logistics/RouteDetailPage';

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
                        children: [{ path: 'usuarios', element: <UsersPage /> }],
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
                            {
                                path: 'configuraciones/metodos-de-pago',
                                element: <PaymentMethodsPage />,
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
        element: <ProtectedRoute allowedRoles={['STORE_ADMIN', 'STORE_USER']} />,
        children: [
            {
                element: <AppLayout title="Mi Tienda" />,
                children: [
                    { index: true, element: <Navigate to="dashboard" replace /> },
                    { path: 'dashboard', element: <StoreDashboardPage /> },

                    {
                        element: <FeatureRoute feature="inventory" />,
                        children: [
                            {
                                element: <PermissionRoute permission="inventory.view" redirectTo="/tienda/dashboard" />,
                                children: [
                                    { path: 'productos', element: <ProductsPage /> },
                                ],
                            },
                            {
                                element: <PermissionRoute permission="inventory.view" redirectTo="/tienda/dashboard" />,
                                children: [
                                    { path: 'inventario/movimientos', element: <InventoryMovementsPage /> },
                                ],
                            },
                            {
                                element: <PermissionRoute permission="categories.view" redirectTo="/tienda/dashboard" />,
                                children: [
                                    { path: 'categorias', element: <CategoriesPage /> },
                                ],
                            },
                        ],
                    },

                    {
                        element: <FeatureRoute feature="multi_user" />,
                        children: [
                            {
                                element: <PermissionRoute permission="store_users.view" redirectTo="/tienda/dashboard" />,
                                children: [{ path: 'usuarios', element: <StoreUsersPage /> }],
                            },
                        ],
                    },

                    {
                        element: <FeatureRoute feature="customers" />,
                        children: [
                            {
                                element: <PermissionRoute permission="customers.view" redirectTo="/tienda/dashboard" />,
                                children: [
                                    { index: true, element: <Navigate to="clientes" replace /> },
                                    { path: 'clientes', element: <CustomersPage /> },
                                    { path: 'clientes/:id', element: <CustomerShowPage /> },
                                    {
                                        element: <PermissionRoute permission="customers.create" redirectTo="/tienda/clientes" />,
                                        children: [
                                            { path: 'clientes/nuevo', element: <CustomersCreatePage /> },
                                        ],
                                    },
                                ],
                            },
                            {
                                element: <PermissionRoute permission="commercial_groups.view" redirectTo="/tienda/dashboard" />,
                                children: [{ path: 'clientes/grupos', element: <CommercialGroupsPage /> }],
                            },
                        ],
                    },

                    {
                        element: <FeatureRoute feature="cash" />,
                        children: [
                            {
                                element: <PermissionRoute permission="cash.view" />,
                                children: [
                                    { path: 'caja', element: <CashPage /> },
                                ],
                            },
                        ],
                    },

                    {
                        element: <FeatureRoute feature="pos" />,
                        children: [
                            {
                                element: <PermissionRoute permission="pos.view" />,
                                children: [
                                    {
                                        path: 'ventas/pos',
                                        element: <POSPage />,
                                    },
                                ],
                            },
                            {
                                element: <PermissionRoute permission="orders.view" redirectTo="/tienda/dashboard" />,
                                children: [
                                    { path: 'ventas/pedidos', element: <OrdersPage /> },
                                ],
                            },
                        ],
                    },

                    {
                        element: <FeatureRoute feature="deliveries" />,
                        children: [
                            {
                                element: <PermissionRoute permission="logistics.routes.view" redirectTo="/tienda/dashboard" />,
                                children: [
                                    { path: 'logistica/rutas', element: <RoutesPage /> },
                                    { path: 'logistica/rutas/:id', element: <RouteDetailPage /> },
                                ],
                            },
                        ],
                    },

                    {
                        element: <FeatureRoute feature="store_settings" />,
                        children: [
                            {
                                element: <PermissionRoute permission="store_payment_methods.view" />,
                                children: [
                                    {
                                        path: 'configuraciones/medios-de-pago',
                                        element: <StorePaymentMethodsPage />,
                                    },
                                ],
                            },
                        ],
                    },
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
