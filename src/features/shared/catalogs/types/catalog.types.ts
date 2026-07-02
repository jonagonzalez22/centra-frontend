export interface CatalogApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data: {
        items: T[];
    };
    errors: unknown;
}
