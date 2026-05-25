import { describe, expect, test, beforeEach, vi } from 'vitest';
import api from '@/api/api.config';
import { RolesService } from './role.service';

vi.mock('@/api/api.config');

type MockApi = {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

const mockApi = vi.mocked(api) as unknown as MockApi;

const mockPermission = {
    id: 'p1',
    name: 'Ver Tiendas',
    code: 'stores.view',
    resource: 'Tiendas',
    description: 'Permite ver tiendas',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
};

const mockRole = {
    id: 'r1',
    name: 'Administrador',
    description: 'Rol de administrador',
    permissions: ['stores.view', 'stores.edit'],
    users_count: 5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
};

const mockSuccessResponse = {
    status: 'success' as const,
    message: 'Listado de roles obtenido correctamente.',
    data: {
        items: [mockRole],
        total: 1,
        per_page: 15,
        current_page: 1,
        last_page: 1,
    },
    errors: null,
};

const mockErrorResponse = {
    status: 'error' as const,
    message: 'No autorizado',
    data: null,
    errors: null,
};

describe('RolesService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAll', () => {
        test('returns roles list on success', async () => {
            mockApi.get.mockResolvedValue({ data: mockSuccessResponse });

            const result = await RolesService.getAll();

            expect(result).toEqual(mockSuccessResponse.data);
            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/roles');
        });

        test('throws error on API error status', async () => {
            mockApi.get.mockResolvedValue({ data: mockErrorResponse });

            await expect(RolesService.getAll()).rejects.toThrow('No autorizado');
        });

        test('throws error on network error', async () => {
            mockApi.get.mockRejectedValue(new Error('Network error'));

            await expect(RolesService.getAll()).rejects.toThrow('Network error');
        });
    });

    describe('getById', () => {
        test('returns role on success', async () => {
            const roleResponse = {
                status: 'success' as const,
                message: 'Rol obtenido correctamente.',
                data: mockRole,
                errors: null,
            };
            mockApi.get.mockResolvedValue({ data: roleResponse });

            const result = await RolesService.getById('r1');

            expect(result).toEqual(roleResponse.data);
            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/roles/r1');
        });

        test('throws error on API error status', async () => {
            mockApi.get.mockResolvedValue({ data: mockErrorResponse });

            await expect(RolesService.getById('r1')).rejects.toThrow('No autorizado');
        });
    });

    describe('update', () => {
        test('returns updated role on success', async () => {
            const updateResponse = {
                status: 'success' as const,
                message: 'Rol actualizado correctamente.',
                data: { ...mockRole, name: 'Administrador Actualizado' },
                errors: null,
            };
            mockApi.put.mockResolvedValue({ data: updateResponse });

            const result = await RolesService.update('r1', { name: 'Administrador Actualizado' });

            expect(result).toEqual(updateResponse.data);
            expect(mockApi.put).toHaveBeenCalledWith('/v1/admin/roles/r1', {
                name: 'Administrador Actualizado',
            });
        });

        test('throws error on API error status', async () => {
            mockApi.put.mockResolvedValue({ data: mockErrorResponse });

            await expect(
                RolesService.update('r1', { name: 'Administrador Actualizado' })
            ).rejects.toThrow('No autorizado');
        });
    });

    describe('getPermissions', () => {
        test('returns permissions list on success', async () => {
            const permissionsResponse = {
                status: 'success' as const,
                message: 'Listado de permisos obtenido correctamente.',
                data: {
                    items: [mockPermission],
                    total: 1,
                    per_page: 200,
                    current_page: 1,
                    last_page: 1,
                },
                errors: null,
            };
            mockApi.get.mockResolvedValue({ data: permissionsResponse });

            const result = await RolesService.getPermissions();

            expect(result).toEqual(permissionsResponse.data);
            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/permissions', {
                params: undefined,
            });
        });

        test('passes filters to request', async () => {
            const permissionsResponse = {
                status: 'success' as const,
                message: 'Listado de permisos obtenido correctamente.',
                data: {
                    items: [mockPermission],
                    total: 1,
                    per_page: 200,
                    current_page: 1,
                    last_page: 1,
                },
                errors: null,
            };
            mockApi.get.mockResolvedValue({ data: permissionsResponse });

            await RolesService.getPermissions({ resource: 'Tiendas' });

            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/permissions', {
                params: { resource: 'Tiendas' },
            });
        });

        test('throws error on API error status', async () => {
            mockApi.get.mockResolvedValue({ data: mockErrorResponse });

            await expect(RolesService.getPermissions()).rejects.toThrow('No autorizado');
        });
    });

    describe('syncPermissions', () => {
        test('resolves on success', async () => {
            const syncResponse = {
                status: 'success' as const,
                message: 'Permisos sincronizados correctamente.',
                data: null,
                errors: null,
            };
            mockApi.post.mockResolvedValue({ data: syncResponse });

            await expect(
                RolesService.syncPermissions('r1', { permissions: ['p1', 'p2'] })
            ).resolves.toBeUndefined();
            expect(mockApi.post).toHaveBeenCalledWith(
                '/v1/admin/roles/r1/sync-permissions',
                { permissions: ['p1', 'p2'] }
            );
        });

        test('throws error on API error status', async () => {
            mockApi.post.mockResolvedValue({ data: mockErrorResponse });

            await expect(
                RolesService.syncPermissions('r1', { permissions: ['p1'] })
            ).rejects.toThrow('No autorizado');
        });
    });
});