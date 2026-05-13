import api from '@/api/api.config';
import { AuthResponse, LoginPayload, LogoutResponse } from '../interfaces/auth.interface';

export const authService = {
    logIn: async (email: string, password: string): Promise<AuthResponse> => {
        const payload: LoginPayload = { email, password };
        const { data } = await api.post<AuthResponse>('v1/login', payload);
        return data;
    },
    logOut: async (): Promise<LogoutResponse> => {
        const { data } = await api.post<LogoutResponse>('v1/logout');
        return data;
    },
};
