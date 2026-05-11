import { describe, expect, test } from 'vitest';
import { getPageNavigation } from './router.utils';

describe('router utils', () => {
    test('returns configured navigation for the stores admin page', () => {
        expect(getPageNavigation('/admin/stores')).toEqual({
            title: 'Gestión de Tiendas',
            breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
        });
    });

    test('normalizes trailing slashes before resolving navigation', () => {
        expect(getPageNavigation('/admin/stores/').title).toBe('Gestión de Tiendas');
    });

    test('builds fallback navigation from the pathname', () => {
        expect(getPageNavigation('/admin/plans')).toEqual({
            title: 'Planes',
            breadcrumbs: [{ label: 'Admin', path: '/admin' }, { label: 'Planes' }],
        });
    });
});
