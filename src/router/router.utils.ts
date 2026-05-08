import type { FeatureCode, User, UserRole } from '@/entities/User';
import { ROLE_CONFIG } from './roles.config';

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
    '/admin/stores': {
        title: 'Gestión de Tiendas',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
    },
};

const segmentLabelMap: Record<string, string> = {
    admin: 'Admin',
    dashboard: 'Dashboard',
    plans: 'Planes',
    stores: 'Tiendas',
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

export function hasFeature(user: User | null, feature: FeatureCode): boolean {
    if (!user) return false;

    if (user.store_id === null) return true;

    return user.features.includes(feature);
}
