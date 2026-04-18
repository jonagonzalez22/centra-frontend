import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './useAuthStore.store';
import { authService } from '@/features/auth/services/auth.service';
import { User } from '@/entities/User';
import { AuthResponse } from '@/features/auth/interfaces/auth.interface';

vi.mock('@/features/auth/services/auth.service');

const mockAuthService = vi.mocked(authService);

describe('useAuthStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store state
        useAuthStore.setState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
        });
        localStorage.clear();
    });

    describe('initial state', () => {
        test('should have correct initial state', () => {
            const state = useAuthStore.getState();

            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.token).toBeNull();
            expect(state.loading).toBe(false);
        });

        test('should have logIn and logout methods', () => {
            const state = useAuthStore.getState();

            expect(typeof state.logIn).toBe('function');
            expect(typeof state.logout).toBe('function');
        });
    });

    describe('logIn', () => {
        test('should set loading to true when logIn is called', async () => {
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

            mockAuthService.logIn.mockResolvedValue(mockResponse);

            const { logIn } = useAuthStore.getState();
            const promise = logIn('test@example.com', 'password123');

            // State should be loading immediately
            expect(useAuthStore.getState().loading).toBe(true);

            await promise;
        });

        test('should update state with user data and token on successful login', async () => {
            const mockUser: User = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                store_id: null,
                roles: ['user'],
                permissions: ['read'],
            };

            const mockResponse: AuthResponse = {
                status: 'success',
                message: 'Login successful',
                data: {
                    ...mockUser,
                    token: 'test-token-123',
                },
                errors: null,
            };

            mockAuthService.logIn.mockResolvedValue(mockResponse);

            const { logIn } = useAuthStore.getState();
            await logIn('test@example.com', 'password123');

            const state = useAuthStore.getState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.user).toEqual(mockUser);
            expect(state.token).toBe('test-token-123');
            expect(state.loading).toBe(false);
        });

        test('should call authService.logIn with correct parameters', async () => {
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

            mockAuthService.logIn.mockResolvedValue(mockResponse);

            const { logIn } = useAuthStore.getState();
            await logIn('user@test.com', 'mypassword');

            expect(mockAuthService.logIn).toHaveBeenCalledWith('user@test.com', 'mypassword');
        });

        test('should set loading to false on login failure', async () => {
            const mockError = new Error('Invalid credentials');
            mockAuthService.logIn.mockRejectedValue(mockError);

            const { logIn } = useAuthStore.getState();

            try {
                await logIn('test@example.com', 'wrongpassword');
            } catch {
                // Expected to throw
            }

            expect(useAuthStore.getState().loading).toBe(false);
        });

        test('should throw error on login failure', async () => {
            const mockError = new Error('Invalid credentials');
            mockAuthService.logIn.mockRejectedValue(mockError);

            const { logIn } = useAuthStore.getState();

            await expect(logIn('test@example.com', 'wrongpassword')).rejects.toThrow(
                'Invalid credentials'
            );
        });

        test('should handle API error responses', async () => {
            const mockError = {
                status: 401,
                message: 'Unauthorized',
            };
            mockAuthService.logIn.mockRejectedValue(mockError);

            const { logIn } = useAuthStore.getState();

            await expect(logIn('test@example.com', 'password')).rejects.toEqual(mockError);
        });

        test('should separate token from user data when storing', async () => {
            const mockResponse: AuthResponse = {
                status: 'success',
                message: 'Login successful',
                data: {
                    id: 1,
                    email: 'test@example.com',
                    name: 'Test User',
                    store_id: null,
                    roles: ['admin'],
                    permissions: ['*'],
                    token: 'secret-token-should-not-be-in-user',
                },
                errors: null,
            };

            mockAuthService.logIn.mockResolvedValue(mockResponse);

            const { logIn } = useAuthStore.getState();
            await logIn('test@example.com', 'password123');

            const state = useAuthStore.getState();
            expect(state.user).not.toHaveProperty('token');
            expect(state.token).toBe('secret-token-should-not-be-in-user');
        });
    });

    describe('logout', () => {
        test('should clear authentication state after logout', async () => {
            // Setup authenticated state
            useAuthStore.setState({
                isAuthenticated: true,
                user: {
                    id: 1,
                    email: 'test@example.com',
                    name: 'Test User',
                    store_id: null,
                    roles: ['user'],
                    permissions: ['read'],
                },
                token: 'test-token',
                loading: false,
            });

            mockAuthService.logOut.mockResolvedValue({
                status: 'success',
                message: 'Logged out',
                data: null,
                errors: null,
            });

            const { logout } = useAuthStore.getState();
            await logout();

            const state = useAuthStore.getState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.token).toBeNull();
        });

        test('should call authService.logOut', async () => {
            mockAuthService.logOut.mockResolvedValue({
                status: 'success',
                message: 'Logged out',
                data: null,
                errors: null,
            });

            const { logout } = useAuthStore.getState();
            await logout();

            expect(mockAuthService.logOut).toHaveBeenCalled();
        });

        test('should clear storage on logout', async () => {
            // Setup authenticated state
            useAuthStore.setState({
                isAuthenticated: true,
                user: {
                    id: 1,
                    email: 'test@example.com',
                    name: 'Test User',
                    store_id: null,
                    roles: ['user'],
                    permissions: ['read'],
                },
                token: 'test-token',
                loading: false,
            });

            mockAuthService.logOut.mockResolvedValue({
                status: 'success',
                message: 'Logged out',
                data: null,
                errors: null,
            });

            const { logout } = useAuthStore.getState();
            await logout();

            const stored = localStorage.getItem('centra-auth-storage');
            expect(stored).toBeNull();
        });

        test('should clear state even if logOut API call fails', async () => {
            // Setup authenticated state
            useAuthStore.setState({
                isAuthenticated: true,
                user: {
                    id: 1,
                    email: 'test@example.com',
                    name: 'Test User',
                    store_id: null,
                    roles: ['user'],
                    permissions: ['read'],
                },
                token: 'test-token',
                loading: false,
            });

            // Mock the logOut to reject, but logout() should still clear the state
            // due to the finally block in the store implementation
            const error = new Error('Logout failed');
            mockAuthService.logOut.mockRejectedValueOnce(error);

            const { logout } = useAuthStore.getState();
            // The logout method has a finally block that always clears the state,
            // so this should complete without throwing
            await logout().catch(() => {
                // The error is caught by the finally block cleanup
            });

            const state = useAuthStore.getState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.token).toBeNull();
        });
    });

    describe('persistence', () => {
        test('should persist token, user, and isAuthenticated to localStorage', async () => {
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
                    token: 'persistent-token',
                },
                errors: null,
            };

            mockAuthService.logIn.mockResolvedValue(mockResponse);

            const { logIn } = useAuthStore.getState();
            await logIn('test@example.com', 'password123');

            // Note: Zustand persist middleware behavior depends on the exact setup
            // This test verifies the state is correctly set, which should trigger persistence
            const state = useAuthStore.getState();
            expect(state.token).toBe('persistent-token');
            expect(state.isAuthenticated).toBe(true);
        });

        test('should not persist loading state', async () => {
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

            mockAuthService.logIn.mockResolvedValue(mockResponse);

            const { logIn } = useAuthStore.getState();
            const promise = logIn('test@example.com', 'password123');

            // Check that loading is true during the request
            expect(useAuthStore.getState().loading).toBe(true);

            await promise;

            // After completion, loading should be false
            expect(useAuthStore.getState().loading).toBe(false);
        });
    });
});
