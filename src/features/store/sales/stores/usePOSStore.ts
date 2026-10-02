import { create } from 'zustand';
import {
  addDecimalStrings,
  compareDecimalStrings,
  isMultipleOfDecimalStrings,
  isPositiveDecimal,
  normalizeDecimalString,
} from '@/utils/quantity';
import type { POSItem, POSPayment, AddItemPayload, POSStore } from '../interfaces/sale.interface';

const initialItems: POSItem[] = [];
const initialPayments: POSPayment[] = [];

export const usePOSStore = create<POSStore>()((set, get) => ({
  items: initialItems,
  type: 'sale',
  customer: null,
  customer_display_name: null,
  requested_delivery_date: null,
  payments: initialPayments,

  addItem: (payload: AddItemPayload) => {
    const { items } = get();
    const step = normalizeDecimalString(payload.sale_quantity_step ?? '1.0000');
    const commercialMaximum = normalizeDecimalString(
      payload.commercial_available_quantity ?? payload.available_stock ?? '0.0000',
    );

    const existing = items.find((item) => item.product_id === payload.id);

    if (existing) {
      const newQuantity = addDecimalStrings(existing.quantity, existing.sale_quantity_step);
      if (compareDecimalStrings(newQuantity, existing.commercial_available_quantity) > 0) {
        return;
      }
      set({
        items: items.map((item) =>
          item.product_id === payload.id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: Number(newQuantity) * item.price,
              }
            : item
        ),
      });
    } else {
      if (!isPositiveDecimal(commercialMaximum) || compareDecimalStrings(commercialMaximum, step) < 0) {
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
            quantity: step,
            price: payload.price,
            subtotal: Number(step) * payload.price,
            sale_quantity_step: step,
            commercial_available_quantity: commercialMaximum,
            stock_measurement_unit_symbol: payload.stock_measurement_unit_symbol ?? null,
          },
        ],
      });
    }
  },

  updateQuantity: (product_id: string, quantity) => {
    const normalizedQuantity = normalizeDecimalString(quantity);
    const item = get().items.find((candidate) => candidate.product_id === product_id);
    if (!item || !isPositiveDecimal(normalizedQuantity) ||
        !isMultipleOfDecimalStrings(normalizedQuantity, item.sale_quantity_step) ||
        compareDecimalStrings(normalizedQuantity, item.commercial_available_quantity) > 0) {
      return;
    }
    set({
      items: get().items.map((item) =>
        item.product_id === product_id
          ? { ...item, quantity: normalizedQuantity, subtotal: Number(normalizedQuantity) * item.price }
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
      customer_display_name: type === 'sale' ? get().customer_display_name : null,
      requested_delivery_date: type === 'sale' ? null : get().requested_delivery_date,
    });
  },

  setCustomer: (customer) =>
    set({
      customer,
      customer_display_name: customer ? null : get().customer_display_name,
    }),

  setCustomerDisplayName: (customer_display_name) =>
    set({
      customer_display_name,
      customer: customer_display_name ? null : get().customer,
    }),

  setRequestedDeliveryDate: (date) => set({ requested_delivery_date: date }),

  setPayments: (payments) => set({ payments }),

  resetPOS: () =>
    set({
      items: [],
      type: 'sale',
      customer: null,
      customer_display_name: null,
      requested_delivery_date: null,
      payments: [],
    }),
}));
