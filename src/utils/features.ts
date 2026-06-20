import { FeatureCode, User } from '@/entities/User';

export function hasFeature(user: User | null, feature: FeatureCode): boolean {
    if (!user) return false;

    return user.features.some((f) => f.code === feature);
}

export function getFeatureLimit(user: User | null, feature: FeatureCode): number | null {
    if (!user) return null;

    const flag = user.features.find((f) => f.code === feature);
    return flag?.limit ?? null;
}
