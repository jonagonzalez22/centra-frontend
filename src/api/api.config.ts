import axios from 'axios';

export type ApiError = {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const raw = localStorage.getItem('entra-auth-storage');
    const token = raw ? JSON.parse(raw)?.state?.token : null;
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
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
                localStorage.removeItem('token');
                // TODO: optional redirect.
                // window.location.href = '/login';
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
