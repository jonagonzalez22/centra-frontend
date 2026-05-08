import { UserRole } from '@/entities/User';
import { ROLE_CONFIG } from './roles.config';

export { hasFeature } from '@/utils/features';

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
