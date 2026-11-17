import { describe, expect, test } from 'vitest';
import {
    canAccessReturnPath,
    getHomePath,
    getPageNavigation,
} from './router.utils';
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

    test('protects each store settings route with its own feature and permission', () => {
        const priceListsOnly = user({
            roles: ['STORE_ADMIN'],
            permissions: ['price_lists.view'],
            features: [{ code: 'pos', limit: null }],
        });

        expect(
            canAccessReturnPath(priceListsOnly, '/tienda/configuraciones/listas-de-precios')
        ).toBe(true);
        expect(
            canAccessReturnPath(priceListsOnly, '/tienda/configuraciones/medios-de-pago')
        ).toBe(false);

        const paymentMethodsOnly = user({
            roles: ['STORE_ADMIN'],
            permissions: ['store_payment_methods.view'],
            features: [{ code: 'store_settings', limit: null }],
        });

        expect(
            canAccessReturnPath(paymentMethodsOnly, '/tienda/configuraciones/medios-de-pago')
        ).toBe(true);
        expect(
            canAccessReturnPath(paymentMethodsOnly, '/tienda/configuraciones/listas-de-precios')
        ).toBe(false);
    });

    test('requires reports.view and reports for the reports return path', () => {
        const authorized = user({
            roles: ['STORE_USER'],
            permissions: ['reports.view'],
            features: [{ code: 'reports', limit: null }],
        });

        expect(canAccessReturnPath(authorized, '/tienda/informes/resumen')).toBe(true);
        expect(
            canAccessReturnPath({ ...authorized, permissions: [] }, '/tienda/informes/resumen')
        ).toBe(false);
        expect(
            canAccessReturnPath({ ...authorized, features: [] }, '/tienda/informes/resumen')
        ).toBe(false);
    });

    test('requires categories.view and inventory for the categories return path', () => {
        const authorized = user({
            roles: ['STORE_USER'],
            permissions: ['categories.view'],
            features: [{ code: 'inventory', limit: null }],
        });

        expect(canAccessReturnPath(authorized, '/tienda/categorias')).toBe(true);
        expect(
            canAccessReturnPath({ ...authorized, permissions: [] }, '/tienda/categorias')
        ).toBe(false);
        expect(
            canAccessReturnPath(
                { ...authorized, features: [{ code: 'categories', limit: null }] },
                '/tienda/categorias'
            )
        ).toBe(false);
    });

    test('requires inventory.view and inventory for the products return path', () => {
        const authorized = user({
            roles: ['STORE_USER'],
            permissions: ['inventory.view'],
            features: [{ code: 'inventory', limit: null }],
        });

        expect(canAccessReturnPath(authorized, '/tienda/productos')).toBe(true);
        expect(
            canAccessReturnPath({ ...authorized, permissions: [] }, '/tienda/productos')
        ).toBe(false);
        expect(
            canAccessReturnPath({ ...authorized, features: [] }, '/tienda/productos')
        ).toBe(false);
    });

    test('requires payments.view and POS for the received payments return path', () => {
        const authorized = user({
            roles: ['STORE_USER'],
            permissions: ['payments.view'],
            features: [{ code: 'pos', limit: null }],
        });

        expect(canAccessReturnPath(authorized, '/tienda/ventas/pagos-recibidos')).toBe(true);
        expect(
            canAccessReturnPath(
                { ...authorized, permissions: ['payments.reverse'] },
                '/tienda/ventas/pagos-recibidos'
            )
        ).toBe(false);
        expect(
            canAccessReturnPath({ ...authorized, features: [] }, '/tienda/ventas/pagos-recibidos')
        ).toBe(false);
    });
});
