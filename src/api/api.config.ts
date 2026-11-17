import { ApiError } from '@/interfaces/ApiErrors.interface';
import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import {
    getSessionForRequest,
    handleUnauthorizedResponse,
} from '@/security/sessionContext';

type SessionAwareRequestConfig = {
    centraSessionGeneration?: number;
};

export type CentraRequestConfig = InternalAxiosRequestConfig & {
    centraPublicAuth?: boolean;
    centraSessionGeneration?: number;
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config: CentraRequestConfig) => {
    if (config.centraPublicAuth) {
        // Public auth endpoints must never inherit a credential from a previous
        // identity, but remain callable while there is no active session.
        delete config.headers.Authorization;
        delete config.centraSessionGeneration;
        return config;
    }

    const { session, blocked } = getSessionForRequest();
    if (blocked) {
        return Promise.reject(new Error('La identidad activa cambió en otra pestaña.'));
    }

    if (session) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${session.token}`;
        (config as SessionAwareRequestConfig).centraSessionGeneration = session.generation;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const apiError: ApiError = {
                status: error.response.status,
                message: error.response.data?.message || 'Error inesperado',
                errors: error.response.data?.errors,
            };

            if (error.response.status === 401) {
                const requestGeneration = (error.config as SessionAwareRequestConfig | undefined)
                    ?.centraSessionGeneration;
                handleUnauthorizedResponse(requestGeneration);
            }

            return Promise.reject(apiError);
        }

        const networkError: ApiError = {
            status: 0,
            message: 'Error de conexión con el servidor',
        };

        return Promise.reject(networkError);
    }
);

export default api;
