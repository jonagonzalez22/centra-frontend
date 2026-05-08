import { FeatureCode, User } from '@/entities/User';

export function hasFeature(user: User | null, feature: FeatureCode): boolean {
    if (!user) return false;

    if (user.roles.includes('SUPER_ADMIN')) return true;

    return user.features.includes(feature);
}
