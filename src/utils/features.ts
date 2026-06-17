import { FeatureCode, User } from '@/entities/User';

export function hasFeature(user: User | null, feature: FeatureCode): boolean {
    if (!user) return false;

    if (user.roles.includes('SUPER_ADMIN')) return true;

    return user.features.some((f) => f.code === feature);
}

export function getFeatureLimit(user: User | null, feature: FeatureCode): number | null {
    if (!user) return null;

    if (user.roles.includes('SUPER_ADMIN')) return null;

    const flag = user.features.find((f) => f.code === feature);
    return flag?.limit ?? null;
}
