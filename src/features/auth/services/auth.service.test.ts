import { describe, test, expect, beforeEach, vi } from 'vitest';
import { authService } from './auth.service';
import api from '@/api/api.config';
import { AuthResponse, LogoutResponse } from '../interfaces/auth.interface';

vi.mock('@/api/api.config');

const mockApi = vi.mocked(api);

describe('Auth Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('logIn', () => {
        test('should call api.post with correct endpoint and payload', async () => {
            const mockResponse: AuthResponse = {
                status: 'success',
                message: 'Login successful',
                data: {
                    id: 1,
                    email: 'test@example.com',
                    name: 'Test User',
                    store_id: null,
                    roles: ['user'],
                    permissions: ['read'],
                    token: 'test-token',
                },
                errors: null,
            };

            mockApi.post = vi.fn().mockResolvedValue({ data: mockResponse });

            const result = await authService.logIn('test@example.com', 'password123');

            expect(mockApi.post).toHaveBeenCalledWith('/login', {
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result).toEqual(mockResponse);
        });

        test('should return authentication response with token and user data', async () => {
            const mockResponse: AuthResponse = {
                status: 'success',
                message: 'Login successful',
                data: {
                    id: 1,
                    email: 'user@example.com',
                    name: 'John Doe',
                    store_id: null,
                    roles: ['admin'],
                    permissions: ['create', 'read', 'update', 'delete'],
                    token: 'jwt-token-12345',
                },
                errors: null,
            };

            mockApi.post = vi.fn().mockResolvedValue({ data: mockResponse });

            const result = await authService.logIn('user@example.com', 'password');

            expect(result.data.token).toBe('jwt-token-12345');
            expect(result.data.email).toBe('user@example.com');
            expect(result.data.name).toBe('John Doe');
        });

        test('should throw error on login failure', async () => {
            const mockError = new Error('Invalid credentials');
            mockApi.post = vi.fn().mockRejectedValue(mockError);

            await expect(authService.logIn('test@example.com', 'wrongpassword')).rejects.toThrow(
                'Invalid credentials'
            );
        });

        test('should handle network errors', async () => {
            const networkError = {
                status: 0,
                message: 'Error de conexión con el servidor',
            };
            mockApi.post = vi.fn().mockRejectedValue(networkError);

            await expect(authService.logIn('test@example.com', 'password')).rejects.toEqual(
                networkError
            );
        });

        test('should handle validation errors from server', async () => {
            const validationError = {
                status: 422,
                message: 'Validation failed',
                errors: {
                    email: ['Email not found'],
                    password: ['Invalid password'],
                },
            };
            mockApi.post = vi.fn().mockRejectedValue(validationError);

            await expect(authService.logIn('test@example.com', 'password')).rejects.toEqual(
                validationError
            );
        });
    });

    describe('logOut', () => {
        test('should call api.post with logout endpoint', async () => {
            const mockResponse: LogoutResponse = {
                status: 'success',
                message: 'Logout successful',
                data: null,
                errors: null,
            };

            mockApi.post = vi.fn().mockResolvedValue({ data: mockResponse });

            const result = await authService.logOut();

            expect(mockApi.post).toHaveBeenCalledWith('/logout');
            expect(result).toEqual(mockResponse);
        });

        test('should return logout response', async () => {
            const mockResponse: LogoutResponse = {
                status: 'success',
                message: 'You have been logged out',
                data: null,
                errors: null,
            };

            mockApi.post = vi.fn().mockResolvedValue({ data: mockResponse });

            const result = await authService.logOut();

            expect(result.status).toBe('success');
            expect(result.data).toBeNull();
            expect(result.errors).toBeNull();
        });

        test('should handle logout failure', async () => {
            const mockError = new Error('Logout failed');
            mockApi.post = vi.fn().mockRejectedValue(mockError);

            await expect(authService.logOut()).rejects.toThrow('Logout failed');
        });

        test('should handle network errors during logout', async () => {
            const networkError = {
                status: 0,
                message: 'Error de conexión con el servidor',
            };
            mockApi.post = vi.fn().mockRejectedValue(networkError);

            await expect(authService.logOut()).rejects.toEqual(networkError);
        });

        test('should handle 401 Unauthorized during logout', async () => {
            const unauthorizedError = {
                status: 401,
                message: 'Unauthorized',
            };
            mockApi.post = vi.fn().mockRejectedValue(unauthorizedError);

            await expect(authService.logOut()).rejects.toEqual(unauthorizedError);
        });
    });
});
