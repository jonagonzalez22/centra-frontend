import { LoginPayload, AuthResponse } from "./types";

const USE_MOCKS = true;

export const login = async (credentials: LoginPayload): Promise<AuthResponse> => {
    if(USE_MOCKS) {
        return mockLogin(credentials);
    }

    //TODO: IMPLEMENTAR LLAMADA REAL
    throw new Error('Real API login no implemented yet');

};

const mockLogin = (credentials: LoginPayload): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const { email } = credentials;

            if (email === 'admin@centra.com') {
                return resolve({
                    status: 'success',
                    message: 'Login successful',
                    data: {
                        id: 1,
                        name: 'Admin User',
                        email,
                        store_id: null,
                        roles: ['SUPER_ADMIN'],
                        permissions: ['all'],
                        token: 'fake-jwt-admin-token',
                    },
                    errors: null,
                });
            }

            if (email === 'tienda@test.com') {
                return resolve({
                    status: 'success',
                    message: 'Login successful',
                    data: {
                        id: 2,
                        name: 'Store Admin',
                        email,
                        store_id: 1,
                        roles: ['STORE_ADMIN'],
                        permissions: ['view_pos', 'manage_stock'],
                        token: 'fake-jwt-store-token',
                    },
                    errors: null,
                });
            }

            // Error (usuario no válido)
            return resolve({
                status: 'error',
                message: 'Invalid credentials',
                data: null,
                errors: {
                    email: ['User not found'],
                },
            });
        }, 800); // delay simulado
    });
};