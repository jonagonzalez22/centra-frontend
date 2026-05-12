export interface ApiError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
}

export interface ApiListResponse<T> {
    status: 'success' | 'error';
    message: string;
    data: T;
    errors: null;
}