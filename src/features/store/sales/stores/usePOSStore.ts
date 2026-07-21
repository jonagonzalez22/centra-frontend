import { create } from 'zustand';
import type { POSItem, POSPayment, AddItemPayload, POSStore } from '../interfaces/sale.interface';

const initialItems: POSItem[] = [];
const initialPayments: POSPayment[] = [];

export const usePOSStore = create<POSStore>()((set, get) => ({
  items: initialItems,
  type: 'sale',
  customer: null,
  requested_delivery_date: null,
  payments: initialPayments,

  addItem: (payload: AddItemPayload) => {
    const { items } = get();

    const existing = items.find((item) => item.product_id === payload.id);

    if (existing) {
      const newQuantity = existing.quantity + 1;
      if (newQuantity > payload.available_stock) {
        return;
      }
      set({
        items: items.map((item) =>
          item.product_id === payload.id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: newQuantity * item.price,
              }
            : item
        ),
      });
    } else {
      if (payload.available_stock < 1) {
        return;
      }
      set({
        items: [
          ...items,
          {
            product_id: payload.id,
            name: payload.name,
            sku: payload.sku,
            barcode: payload.barcode,
            quantity: 1,
            price: payload.price,
            subtotal: payload.price,
          },
        ],
      });
    }
  },

  updateQuantity: (product_id: string, quantity: number) => {
    if (quantity < 1) {
      get().removeItem(product_id);
      return;
    }
    set({
      items: get().items.map((item) =>
        item.product_id === product_id
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      ),
    });
  },

  removeItem: (product_id: string) => {
    set({ items: get().items.filter((item) => item.product_id !== product_id) });
  },

  setType: (type) => {
    set({
      type,
      customer: type === 'sale' ? get().customer : get().customer,
      requested_delivery_date: type === 'sale' ? null : get().requested_delivery_date,
    });
  },

  setCustomer: (customer) => set({ customer }),

  setRequestedDeliveryDate: (date) => set({ requested_delivery_date: date }),

  setPayments: (payments) => set({ payments }),

  resetPOS: () =>
    set({
      items: [],
      type: 'sale',
      customer: null,
      requested_delivery_date: null,
      payments: [],
    }),
}));
