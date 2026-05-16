import { describe, expect, test, beforeEach, vi } from 'vitest';
import api from '@/api/api.config';
import { UsersService } from './users.service';

vi.mock('@/api/api.config');

type MockApi = {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

const mockApi = vi.mocked(api) as unknown as MockApi;

const mockUser = {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan@email.com',
    store_id: '1',
    roles: ['STORE_ADMIN'] as const,
    permissions: ['stores.view'],
    features: ['stores'] as const,
};

const mockSuccessListResponse = {
    status: 'success' as const,
    message: 'Usuarios obtenidos correctamente.',
    data: {
        items: [mockUser],
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

describe('UsersService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUsers', () => {
        test('returns users list on success', async () => {
            mockApi.get.mockResolvedValueOnce({ data: mockSuccessListResponse } as never);

            const result = await UsersService.getUsers({ store_id: '1' });

            expect(mockApi.get).toHaveBeenCalledWith('/v1/admin/users', {
                params: { store_id: '1' },
            });
            expect(result.items).toHaveLength(1);
            expect(result.items[0].name).toBe('Juan Pérez');
            expect(result.total).toBe(1);
        });

        test('throws ApiError on error response', async () => {
            mockApi.get.mockResolvedValueOnce({ data: mockErrorResponse } as never);

            await expect(UsersService.getUsers({})).rejects.toMatchObject({
                status: 0,
                message: 'No autorizado',
            });
        });

        test('throws on network error', async () => {
            mockApi.get.mockRejectedValueOnce(new Error('Network error') as never);

            await expect(UsersService.getUsers({})).rejects.toThrow('Network error');
        });
    });

    describe('create', () => {
        test('creates user on success', async () => {
            const createResponse = {
                status: 'success' as const,
                message: 'Usuario creado correctamente.',
                data: mockUser,
                errors: null,
            };
            mockApi.post.mockResolvedValueOnce({ data: createResponse } as never);

            const payload = {
                name: 'Juan Pérez',
                email: 'juan@email.com',
                password: 'password123',
                password_confirmation: 'password123',
                role: 'STORE_ADMIN',
                store_id: '1',
            };

            const result = await UsersService.create(payload);

            expect(mockApi.post).toHaveBeenCalledWith('/v1/admin/users', payload);
            expect(result.name).toBe('Juan Pérez');
        });

        test('throws ApiError on validation error', async () => {
            const errorResponse = {
                status: 'error' as const,
                message: 'Error de validación',
                data: null,
                errors: { email: ['El email ya está en uso.'] },
            };
            mockApi.post.mockResolvedValueOnce({ data: errorResponse } as never);

            await expect(UsersService.create({
                name: 'Juan',
                email: 'juan@email.com',
                password: 'password123',
                password_confirmation: 'password123',
                role: 'STORE_ADMIN',
                store_id: '1',
            })).rejects.toMatchObject({
                message: 'Error de validación',
                errors: { email: ['El email ya está en uso.'] },
            });
        });
    });

    describe('update', () => {
        test('updates user on success', async () => {
            const updateResponse = {
                status: 'success' as const,
                message: 'Usuario actualizado correctamente.',
                data: { ...mockUser, name: 'Juan Actualizado' },
                errors: null,
            };
            mockApi.put.mockResolvedValueOnce({ data: updateResponse } as never);

            const result = await UsersService.update(1, { name: 'Juan Actualizado' });

            expect(mockApi.put).toHaveBeenCalledWith('/v1/admin/users/1', { name: 'Juan Actualizado' });
            expect(result.name).toBe('Juan Actualizado');
        });

        test('throws ApiError on error response', async () => {
            mockApi.put.mockResolvedValueOnce({ data: mockErrorResponse } as never);

            await expect(UsersService.update(1, { name: 'Test' })).rejects.toMatchObject({
                status: 0,
                message: 'No autorizado',
            });
        });
    });

    describe('delete', () => {
        test('deletes user on success', async () => {
            const deleteResponse = {
                status: 'success' as const,
                message: 'Usuario eliminado.',
                data: null,
                errors: null,
            };
            mockApi.delete.mockResolvedValueOnce({ data: deleteResponse } as never);

            await expect(UsersService.delete(1)).resolves.toBeUndefined();
            expect(mockApi.delete).toHaveBeenCalledWith('/v1/admin/users/1');
        });

        test('throws ApiError on error response', async () => {
            mockApi.delete.mockResolvedValueOnce({ data: mockErrorResponse } as never);

            await expect(UsersService.delete(1)).rejects.toMatchObject({
                status: 0,
                message: 'No autorizado',
            });
        });
    });
});