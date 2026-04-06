import { User } from '../../entities/User';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}