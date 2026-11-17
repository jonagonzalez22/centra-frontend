import { create } from 'zustand';
import { message } from 'antd';
import { OrdersService } from '../services/orders.service';
import type { OrderFilters, OrdersState } from '../interfaces/order.interface';
import { getCurrentSessionGeneration, isCurrentSession } from '@/security/sessionContext';

const INITIAL_FILTERS: OrderFilters = {
    date: null,
    status: undefined,
    operation_number: undefined,
    customer_name: undefined,
    locality: undefined,
    has_pending_balance: undefined,
    page: 1,
    per_page: 20,
};

let latestOrdersRequest = 0;
let latestOrderDetailRequest = 0;

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
        const requestId = ++latestOrdersRequest;
        const sessionGeneration = getCurrentSessionGeneration();
        set({ loading: true });
        try {
            const result = await OrdersService.getAll({
                ...filters,
                page: pagination.current,
                per_page: 20,
            });
            if (requestId !== latestOrdersRequest || !isCurrentSession(sessionGeneration)) return;
            set({
                orders: result.items,
                pagination: {
                    ...pagination,
                    total: result.total,
                    current: result.current_page,
                },
            });
        } catch (err) {
            if (requestId !== latestOrdersRequest || !isCurrentSession(sessionGeneration)) return;
            const apiError = err as { message?: string };
            message.error(apiError.message || 'Error al cargar los pedidos.');
        } finally {
            if (requestId === latestOrdersRequest && isCurrentSession(sessionGeneration)) {
                set({ loading: false });
            }
        }
    },

    fetchOrderDetail: async (id: string) => {
        const requestId = ++latestOrderDetailRequest;
        const sessionGeneration = getCurrentSessionGeneration();
        set({ loadingDetail: true });
        try {
            const detail = await OrdersService.getById(id);
            if (requestId !== latestOrderDetailRequest || !isCurrentSession(sessionGeneration)) return;
            set({ selectedOrder: detail });
        } catch (err) {
            if (requestId !== latestOrderDetailRequest || !isCurrentSession(sessionGeneration)) return;
            const apiError = err as { message?: string };
            message.error(apiError.message || 'Error al cargar el detalle del pedido.');
        } finally {
            if (requestId === latestOrderDetailRequest && isCurrentSession(sessionGeneration)) {
                set({ loadingDetail: false });
            }
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

    resetOrders: () => {
        latestOrdersRequest += 1;
        latestOrderDetailRequest += 1;
        set({
            orders: [],
            selectedOrder: null,
            filters: { ...INITIAL_FILTERS },
            pagination: { current: 1, total: 0, perPage: 20 },
            loading: false,
            loadingDetail: false,
            drawerOpen: false,
        });
    },

    rescheduleOrder: async (id, payload) => {
        const sessionGeneration = getCurrentSessionGeneration();
        try {
            const updated = await OrdersService.reschedule(id, payload);
            if (!isCurrentSession(sessionGeneration)) return;
            set({ selectedOrder: updated });
            message.success('Pedido reprogramado exitosamente.');
            get().fetchOrders();
        } catch (err) {
            if (!isCurrentSession(sessionGeneration)) return;
            const apiError = err as { message?: string };
            message.error(apiError.message || 'Error al reprogramar el pedido.');
            throw err;
        }
    },

    cancelOrder: async (id, payload) => {
        const sessionGeneration = getCurrentSessionGeneration();
        try {
            const updated = await OrdersService.cancel(id, payload);
            if (!isCurrentSession(sessionGeneration)) return;
            set({ selectedOrder: updated });
            message.success('Pedido cancelado exitosamente.');
            get().fetchOrders();
        } catch (err) {
            if (!isCurrentSession(sessionGeneration)) return;
            const apiError = err as { message?: string };
            message.error(apiError.message || 'Error al cancelar el pedido.');
            throw err;
        }
    },

    cancelPendingDelivery: async (id, payload) => {
        const sessionGeneration = getCurrentSessionGeneration();
        try {
            const updated = await OrdersService.cancelPendingDelivery(id, payload);
            if (!isCurrentSession(sessionGeneration)) return;
            set({ selectedOrder: updated });
            message.success('Mercadería pendiente cancelada exitosamente.');
            await get().fetchOrders();
        } catch (err) {
            if (!isCurrentSession(sessionGeneration)) return;
            const apiError = err as { message?: string };
            message.error(apiError.message || 'Error al cancelar la mercadería pendiente.');
            throw err;
        }
    },

    registerPayment: async (id, payload) => {
        const sessionGeneration = getCurrentSessionGeneration();
        try {
            const updated = await OrdersService.registerPayment(id, payload);
            if (!isCurrentSession(sessionGeneration)) return;
            set({ selectedOrder: updated });
            message.success('Pago registrado exitosamente.');
            await get().fetchOrders();
        } catch (err) {
            if (!isCurrentSession(sessionGeneration)) return;
            const apiError = err as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            message.error(
                apiError.response?.data?.message ||
                    apiError.message ||
                    'Error al registrar el pago.'
            );
            throw err;
        }
    },
}));
