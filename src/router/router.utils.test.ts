import { describe, expect, test } from 'vitest';
import { canAccessReturnPath, getHomePath, getPageNavigation } from './router.utils';
import type { User } from '@/entities/User';

const user = (overrides: Partial<User> = {}): User => ({
    id: 1,
    name: 'Test',
    email: 'test@example.com',
    store_id: 1,
    store: null,
    is_active: true,
    roles: ['STORE_DRIVER'],
    permissions: ['drivers.view'],
    features: [{ code: 'deliveries', limit: null }],
    ...overrides,
});

describe('router utils', () => {
    test('returns configured navigation for the stores admin page', () => {
        expect(getPageNavigation('/admin/tiendas')).toEqual({
            title: 'Gestión de Tiendas',
            breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
        });
    });

    test('normalizes trailing slashes before resolving navigation', () => {
        expect(getPageNavigation('/admin/tiendas/').title).toBe('Gestión de Tiendas');
    });

    test('builds fallback navigation from the pathname', () => {
        expect(getPageNavigation('/admin/plans')).toEqual({
            title: 'Planes',
            breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Planes' }],
        });
    });

    test('allows a driver deep link only for an authorized driver', () => {
        expect(canAccessReturnPath(user(), '/tienda/conductor/parada/route/stop')).toBe(true);
        expect(
            canAccessReturnPath(
                user({ roles: ['STORE_ADMIN'], permissions: ['drivers.view'] }),
                '/tienda/conductor/parada/route/stop'
            )
        ).toBe(false);
    });

    test('rejects unsafe or unknown return paths and falls back by role', () => {
        expect(canAccessReturnPath(user(), '/login')).toBe(false);
        expect(canAccessReturnPath(user(), '/')).toBe(false);
        expect(canAccessReturnPath(user(), '/unknown')).toBe(false);
        expect(getHomePath(['STORE_ADMIN'])).toBe('/tienda');
    });
});
