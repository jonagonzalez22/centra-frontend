import { describe, expect, test } from 'vitest';
import {
    getPermissionContext,
    getPermissionContextLabel,
    inferDefaultTab,
    PREFIX_TO_CONTEXT,
} from '@/config/permissions.config';

describe('permissions.config', () => {
    describe('getPermissionContext', () => {
        test('devuelve store para permisos de tienda', () => {
            expect(getPermissionContext('categories.create')).toBe('store');
            expect(getPermissionContext('products.list')).toBe('store');
            expect(getPermissionContext('pos.create')).toBe('store');
            expect(getPermissionContext('sales.view')).toBe('store');
            expect(getPermissionContext('clients.edit')).toBe('store');
            expect(getPermissionContext('deliveries.delete')).toBe('store');
            expect(getPermissionContext('stock.view')).toBe('unknown');
        });

        test('devuelve admin para permisos de sistema', () => {
            expect(getPermissionContext('plans.view')).toBe('admin');
            expect(getPermissionContext('plans.edit')).toBe('admin');
            expect(getPermissionContext('features.create')).toBe('admin');
            expect(getPermissionContext('roles.view')).toBe('admin');
            expect(getPermissionContext('roles.edit')).toBe('admin');
            expect(getPermissionContext('permissions.list')).toBe('admin');
            expect(getPermissionContext('business-types.create')).toBe('admin');
            expect(getPermissionContext('backoffice_users.view')).toBe('admin');
            expect(getPermissionContext('users.view')).toBe('admin');
            expect(getPermissionContext('settings.edit')).toBe('admin');
            expect(getPermissionContext('stores.view')).toBe('admin');
            expect(getPermissionContext('stores.edit')).toBe('admin');
        });

        test('devuelve unknown para prefijos desconocidos', () => {
            expect(getPermissionContext('foo.bar')).toBe('unknown');
            expect(getPermissionContext('xyz.view')).toBe('unknown');
            expect(getPermissionContext('custom.action')).toBe('unknown');
        });

        test('maneja permisos sin prefijo', () => {
            expect(getPermissionContext('invalidcode')).toBe('unknown');
        });
    });

    describe('getPermissionContextLabel', () => {
        test('devuelve label correcto para cada contexto', () => {
            expect(getPermissionContextLabel('store')).toBe('Tienda');
            expect(getPermissionContextLabel('admin')).toBe('Sistema');
            expect(getPermissionContextLabel('unknown')).toBe('Sin clasificar');
        });
    });

    describe('inferDefaultTab', () => {
        test('devuelve store para roles STORE_', () => {
            expect(inferDefaultTab('STORE_ADMIN')).toBe('store');
            expect(inferDefaultTab('STORE_USER')).toBe('store');
            expect(inferDefaultTab('STORE_MANAGER')).toBe('store');
        });

        test('devuelve admin para SUPER_ADMIN y BACKOFFICE_USER', () => {
            expect(inferDefaultTab('SUPER_ADMIN')).toBe('admin');
            expect(inferDefaultTab('BACKOFFICE_USER')).toBe('admin');
        });

        test('devuelve all para otros roles', () => {
            expect(inferDefaultTab('CUSTOM_ROLE')).toBe('all');
            expect(inferDefaultTab('UNKNOWN_ROLE')).toBe('all');
            expect(inferDefaultTab('')).toBe('all');
        });
    });

    describe('PREFIX_TO_CONTEXT', () => {
        test('contiene todos los prefijos esperados', () => {
            const adminPrefixes = [
                'plans',
                'features',
                'roles',
                'permissions',
                'business-types',
                'backoffice_users',
                'users',
                'settings',
                'stores',
            ];
            const storePrefixes = [
                'categories',
                'products',
                'pos',
                'sales',
                'clients',
                'deliveries',
            ];

            adminPrefixes.forEach((prefix) => {
                expect(PREFIX_TO_CONTEXT[prefix]).toBe('admin');
            });

            storePrefixes.forEach((prefix) => {
                expect(PREFIX_TO_CONTEXT[prefix]).toBe('store');
            });
        });
    });
});
