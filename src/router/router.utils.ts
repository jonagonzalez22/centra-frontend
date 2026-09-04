import type { User, UserRole } from '@/entities/User';
import { ROLE_CONFIG } from './roles.config';
import { hasFeature } from '@/utils/features';

export { hasFeature } from '@/utils/features';

export interface PageBreadcrumbItem {
    label: string;
    path?: string;
}

interface PageNavigation {
    title: string;
    breadcrumbs: PageBreadcrumbItem[];
}

const routeNavigationMap: Record<string, PageNavigation> = {
    '/admin/dashboard': {
        title: 'Dashboard',
        breadcrumbs: [{ label: 'Admin' }, { label: 'Dashboard' }],
    },
    '/admin/tiendas': {
        title: 'Gestión de Tiendas',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
    },
    '/admin/tiendas/:id': {
        title: 'Detalle de Tienda',
        breadcrumbs: [
            { label: 'Admin', path: '/admin/dashboard' },
            { label: 'Tiendas', path: '/admin/tiendas' },
            { label: 'Detalle' },
        ],
    },
    '/admin/usuarios': {
        title: 'Gestión de Usuarios',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Usuarios' }],
    },
};

const segmentLabelMap: Record<string, string> = {
    admin: 'Admin',
    dashboard: 'Dashboard',
    plans: 'Planes',
    stores: 'Tiendas',
    tiendas: 'Tiendas',
    usuarios: 'Usuarios',
};

export function getHomePath(roles: UserRole[]): string {
    const sorted = [...roles].sort(
        (a, b) => (ROLE_CONFIG[a]?.priority ?? 99) - (ROLE_CONFIG[b]?.priority ?? 99)
    );

    for (const role of sorted) {
        const config = ROLE_CONFIG[role];
        if (config) return config.homePath;
    }

    return '/login';
}

export function hasAccessToPath(roles: UserRole[], path: string): boolean {
    return roles.some((role) => {
        const config = ROLE_CONFIG[role];
        if (!config) return false;
        return config.allowedPaths.some((allowed) => path.startsWith(allowed));
    });
}

/**
 * Checks whether a post-login deep link is structurally covered by the same
 * role, permission and feature boundaries used by the router.
 */
export function canAccessReturnPath(user: User, path: string): boolean {
    if (!path.startsWith('/') || path === '/' || path === '/login') return false;

    const normalizedPath = path.replace(/\/+$/, '') || '/';
    const roles = user.roles ?? [];
    const hasRole = (allowed: UserRole[]) => roles.some((role) => allowed.includes(role));
    const hasPermission = (permission: string) => user.permissions.includes(permission);
    const hasStoreRole = hasRole(['STORE_ADMIN', 'STORE_USER', 'STORE_DRIVER']);
    const hasFeatureAccess = (feature: Parameters<typeof hasFeature>[1]) => hasFeature(user, feature);
    const matches = (pattern: RegExp) => pattern.test(normalizedPath);

    if (normalizedPath === '/admin' || normalizedPath === '/admin/dashboard') {
        return hasRole(['SUPER_ADMIN', 'BACKOFFICE_USER']);
    }
    if (matches(/^\/admin\/tiendas(?:\/[^/]+)?$/)) {
        return hasRole(['SUPER_ADMIN', 'BACKOFFICE_USER']) && hasPermission('stores.view');
    }
    if (matches(/^\/admin\/usuarios$/)) {
        return hasRole(['SUPER_ADMIN', 'BACKOFFICE_USER']) && hasPermission('users.view');
    }
    if (matches(/^\/admin\/planes$/)) {
        return hasRole(['SUPER_ADMIN', 'BACKOFFICE_USER']) && hasPermission('plans.view');
    }
    if (matches(/^\/admin\/configuraciones\/(tipos-de-negocio|funcionalidades|roles|metodos-de-pago)$/)) {
        return hasRole(['SUPER_ADMIN', 'BACKOFFICE_USER']) && hasPermission('settings.view');
    }

    if (normalizedPath === '/tienda' || normalizedPath === '/tienda/dashboard') {
        return hasStoreRole;
    }
    if (matches(/^\/tienda\/conductor\/(rutas|ruta\/[^/]+|parada\/[^/]+\/[^/]+)$/)) {
        return roles.includes('STORE_DRIVER') && hasPermission('drivers.view');
    }
    if (matches(/^\/tienda\/logistica\/rutas(?:\/[^/]+(?:\/rendicion)?)?$/)) {
        return hasStoreRole && hasFeatureAccess('deliveries') && hasPermission('logistics.routes.view');
    }
    if (matches(/^\/tienda\/productos$/) || matches(/^\/tienda\/inventario\/movimientos$/)) {
        return hasStoreRole && hasFeatureAccess('inventory') && hasPermission('inventory.view');
    }
    if (matches(/^\/tienda\/categorias$/)) {
        return hasStoreRole && hasFeatureAccess('inventory') && hasPermission('categories.view');
    }
    if (matches(/^\/tienda\/usuarios$/)) {
        return hasStoreRole && hasFeatureAccess('multi_user') && hasPermission('store_users.view');
    }
    if (matches(/^\/tienda\/clientes\/grupos$/)) {
        return hasStoreRole && hasFeatureAccess('customers') && hasPermission('commercial_groups.view');
    }
    if (matches(/^\/tienda\/clientes(?:\/[^/]+)?$/)) {
        return hasStoreRole && hasFeatureAccess('customers') && hasPermission('customers.view');
    }
    if (matches(/^\/tienda\/caja$/)) {
        return hasStoreRole && hasFeatureAccess('cash') && hasPermission('cash.view');
    }
    if (matches(/^\/tienda\/ventas\/pos$/)) {
        return hasStoreRole && hasFeatureAccess('pos') && hasPermission('pos.view');
    }
    if (matches(/^\/tienda\/ventas\/pedidos$/)) {
        return hasStoreRole && hasFeatureAccess('pos') && hasPermission('orders.view');
    }
    if (matches(/^\/tienda\/configuraciones\/medios-de-pago$/)) {
        return hasStoreRole && hasFeatureAccess('store_settings') && hasPermission('store_payment_methods.view');
    }

    return false;
}

export function getPageNavigation(pathname: string): PageNavigation {
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';
    const configuredNavigation = routeNavigationMap[normalizedPath];

    if (configuredNavigation) {
        return configuredNavigation;
    }

    const breadcrumbs = normalizedPath
        .split('/')
        .filter(Boolean)
        .map((segment, index, segments) => {
            const label = segmentLabelMap[segment] ?? segment;
            const path = `/${segments.slice(0, index + 1).join('/')}`;

            return index === segments.length - 1 ? { label } : { label, path };
        });

    return {
        title: breadcrumbs[breadcrumbs.length - 1]?.label ?? 'CENTRA',
        breadcrumbs,
    };
}
