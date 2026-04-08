import { User } from '../../entities/User';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data: T;
    errors: Record<string, string[]> | null;
}


export interface AuthData {
    token: string;
    user: User;
}


export type AuthResponse = ApiResponse<AuthData>;