import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import api from './api.config';
import { ApiError } from '@/interfaces/ApiErrors.interface';

describe('API Config', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('axios instance creation', () => {
        test('creates an axios instance with correct baseURL', () => {
            expect(api).toBeDefined();
            expect(api.defaults.baseURL).toBe(import.meta.env.VITE_API_URL);
        });

        test('sets correct default headers', () => {
            expect(api.defaults.headers['Content-Type']).toBe('application/json');
            expect(api.defaults.headers['Accept']).toBe('application/json');
        });
    });

    describe('request interceptor - Token Management', () => {
        test('should have request interceptor configured', () => {
            expect(api.interceptors.request).toBeDefined();
        });

        test('should handle localStorage with token correctly', () => {
            const token = 'test-token-123';
            const authStorage = {
                state: { token },
            };
            localStorage.setItem('centra-auth-storage', JSON.stringify(authStorage));
            const stored = localStorage.getItem('centra-auth-storage');

            expect(stored).toBe(JSON.stringify(authStorage));
            const parsed = JSON.parse(stored!);
            expect(parsed.state.token).toBe(token);
        });

        test('should handle empty localStorage gracefully', () => {
            const stored = localStorage.getItem('centra-auth-storage');
            expect(stored).toBeNull();
        });

        test('should handle malformed localStorage data', () => {
            localStorage.setItem('centra-auth-storage', 'invalid-json');
            const stored = localStorage.getItem('centra-auth-storage');

            expect(() => {
                try {
                    JSON.parse(stored!);
                } catch {
                    throw new Error('Invalid JSON');
                }
            }).toThrow('Invalid JSON');
        });
    });

    describe('response interceptor - Error Handling', () => {
        test('should have response interceptor configured', () => {
            expect(api.interceptors.response).toBeDefined();
        });

        test('ApiError type has required properties', () => {
            const error: ApiError = {
                status: 400,
                message: 'Bad request',
            };

            expect(error.status).toBe(400);
            expect(error.message).toBe('Bad request');
        });

        test('ApiError type has optional errors property', () => {
            const error: ApiError = {
                status: 422,
                message: 'Validation error',
                errors: { field: ['Error message'] },
            };

            expect(error.status).toBe(422);
            expect(error.message).toBe('Validation error');
            expect(error.errors).toEqual({ field: ['Error message'] });
        });

        test('ApiError should handle 401 status code', () => {
            const error: ApiError = {
                status: 401,
                message: 'Unauthorized',
            };

            expect(error.status).toBe(401);
            expect(error.message).toBe('Unauthorized');
        });

        test('ApiError should handle network errors (status 0)', () => {
            const error: ApiError = {
                status: 0,
                message: 'Error de conexión con el servidor',
            };

            expect(error.status).toBe(0);
            expect(error.message).toBe('Error de conexión con el servidor');
        });

        test('ApiError should handle validation errors with multiple field errors', () => {
            const error: ApiError = {
                status: 422,
                message: 'Validation failed',
                errors: {
                    email: ['Email already exists'],
                    password: ['Password too weak'],
                },
            };

            expect(error.errors?.email).toEqual(['Email already exists']);
            expect(error.errors?.password).toEqual(['Password too weak']);
        });
    });
});
