import { Store, User } from '../../../entities/User';

export interface LoginPayload {
    email: string;
    password: string;
}

interface IData {
    token: string;
    user: User;
    store: Store;
}

export interface AuthResponse {
    status: 'success' | 'error';
    message: string;
    data: IData;
    errors: Record<string, string[]> | null;
}

export interface LogoutResponse {
    status: string;
    message: string;
    data: null;
    errors: null;
}
