import { FeatureCode, User, UserRole } from '@/entities/User';
import { ROLE_CONFIG } from './roles.config';

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

export function hasFeature(user: User | null, feature: FeatureCode): boolean {
    if (!user) return false;

    if (user.store_id === null) return true;

    return user.features.includes(feature);
}
