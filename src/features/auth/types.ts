import { User } from '../../entities/User';

export interface LoginPayload {
    email: string;
    password: string;
}

interface IData extends User {
    token: string;
}

export interface AuthResponse {
    status: 'success' | 'error';
    message: string;
    data: IData | null ;
    errors: Record<string, string[]> | null;
}