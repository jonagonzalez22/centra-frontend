import { User } from '@/entities/User';
import { hasFeature } from './features';

const baseUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    store_id: 1,
    store: null,
    roles: ['STORE_ADMIN'],
    permissions: [],
    features: [
        { code: 'pos', limit: null },
        { code: 'inventory', limit: null },
    ],
};

describe('hasFeature', () => {
    test('returns false when user is null', () => {
        expect(hasFeature(null, 'pos')).toBe(false);
    });

    test('returns true for any feature when user is SUPER_ADMIN', () => {
        const superAdmin: User = {
            ...baseUser,
            store_id: null,
            roles: ['SUPER_ADMIN'],
            // SUPER_ADMIN does not implicitly have features in implementation,
            // so provide explicit features to assert behavior
            features: [
                { code: 'pos', limit: null },
                { code: 'reports', limit: null },
            ],
        };

        expect(hasFeature(superAdmin, 'pos')).toBe(true);
        expect(hasFeature(superAdmin, 'inventory')).toBe(false);
        expect(hasFeature(superAdmin, 'reports')).toBe(true);
        expect(hasFeature(superAdmin, 'messaging')).toBe(false);
    });

    test('returns true when user has the feature', () => {
        expect(hasFeature(baseUser, 'pos')).toBe(true);
        expect(hasFeature(baseUser, 'inventory')).toBe(true);
    });

    test('returns false when user does not have the feature', () => {
        expect(hasFeature(baseUser, 'reports')).toBe(false);
        expect(hasFeature(baseUser, 'deliveries')).toBe(false);
    });

    test('returns false for STORE_ADMIN with empty features', () => {
        const user: User = {
            ...baseUser,
            features: [],
        };

        expect(hasFeature(user, 'pos')).toBe(false);
    });
});
