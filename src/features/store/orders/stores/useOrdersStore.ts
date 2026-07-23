import { create } from 'zustand';
import { message } from 'antd';
import { OrdersService } from '../services/orders.service';
import type { OrderFilters, OrdersState } from '../interfaces/order.interface';

const INITIAL_FILTERS: OrderFilters = {
    date: null,
    status: 'open,confirmed',
    operation_number: undefined,
    customer_name: undefined,
    locality: undefined,
    page: 1,
    per_page: 20,
};

export const useOrdersStore = create<OrdersState>()((set, get) => ({
    orders: [],
    selectedOrder: null,
    filters: { ...INITIAL_FILTERS },
    pagination: { current: 1, total: 0, perPage: 20 },
    loading: false,
    loadingDetail: false,
    drawerOpen: false,

    fetchOrders: async () => {
        const { filters, pagination } = get();
        set({ loading: true });
        try {
            const result = await OrdersService.getAll({
                ...filters,
                page: pagination.current,
                per_page: 20,
            });
            set({
                orders: result.items,
                pagination: {
                    ...pagination,
                    total: result.total,
                    current: result.current_page,
                },
            });
        } catch (err) {
            const apiError = err as { message?: string };
            message.error(apiError.message || 'Error al cargar los pedidos.');
        } finally {
            set({ loading: false });
        }
    },

    fetchOrderDetail: async (id: string) => {
        set({ loadingDetail: true });
        try {
            const detail = await OrdersService.getById(id);
            set({ selectedOrder: detail });
        } catch (err) {
            const apiError = err as { message?: string };
            message.error(apiError.message || 'Error al cargar el detalle del pedido.');
        } finally {
            set({ loadingDetail: false });
        }
    },

    setFilters: (newFilters: Partial<OrderFilters>) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters, page: 1 },
            pagination: { ...state.pagination, current: 1 },
        }));
        get().fetchOrders();
    },

    resetFilters: () => {
        set({
            filters: { ...INITIAL_FILTERS },
            pagination: { current: 1, total: 0, perPage: 20 },
        });
        get().fetchOrders();
    },

    openDrawer: async (id: string) => {
        set({ drawerOpen: true });
        await get().fetchOrderDetail(id);
    },

    closeDrawer: () => {
        set({ drawerOpen: false, selectedOrder: null });
    },
}));
