import api from '@/api/api.config';
export type Supplier = {
    id: string;
    business_name: string;
    tax_id: string | null;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};
export const SuppliersService = {
    getAll: async (p: { search?: string; is_active?: boolean } = {}) => {
        const { is_active, ...rest } = p;
        const { data } = await api.get('/v1/store/suppliers', {
            params: {
                per_page: 100,
                ...rest,
                ...(is_active === undefined ? {} : { is_active: is_active ? 1 : 0 }),
            },
        });
        return data.data.items as Supplier[];
    },
    getById: async (id: string) => {
        const { data } = await api.get(`/v1/store/suppliers/${id}`);
        return data.data as Supplier;
    },
    create: (p: Partial<Supplier>) => api.post('/v1/store/suppliers', p),
    update: (id: string, p: Partial<Supplier>) => api.put(`/v1/store/suppliers/${id}`, p),
    delete: (id: string) => api.delete(`/v1/store/suppliers/${id}`),
};
