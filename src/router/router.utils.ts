import { UserRole } from '@/entities/User';
import { ROLE_CONFIG } from './roles.config';

function normalizeRoles(roles: unknown): UserRole[] {
    if (!Array.isArray(roles)) {
        return [];
    }

    return roles.filter((role): role is UserRole => role in ROLE_CONFIG);
}

export function getHomePath(roles: UserRole[] | unknown): string {
    const safeRoles = normalizeRoles(roles);
    const sorted = [...safeRoles].sort(
        (a, b) => (ROLE_CONFIG[a]?.priority ?? 99) - (ROLE_CONFIG[b]?.priority ?? 99)
    );

    for (const role of sorted) {
        const config = ROLE_CONFIG[role];
        if (config) return config.homePath;
    }

    return '/login';
}

export function hasAccessToPath(roles: UserRole[] | unknown, path: string): boolean {
    const safeRoles = normalizeRoles(roles);

    return safeRoles.some((role) => {
        const config = ROLE_CONFIG[role];
        if (!config) return false;
        return config.allowedPaths.some((allowed) => path.startsWith(allowed));
    });
}
