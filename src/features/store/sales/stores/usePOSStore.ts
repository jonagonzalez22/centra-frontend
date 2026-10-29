import { create } from 'zustand';
import {
  addDecimalStrings,
  compareDecimalStrings,
  isMultipleOfDecimalStrings,
  isPositiveDecimal,
  normalizeDecimalString,
} from '@/utils/quantity';
import type { POSItem, POSPayment, AddItemPayload, POSStore } from '../interfaces/sale.interface';
import type { PriceList } from '@/features/store/price-lists/types/priceList.types';

const getDiscountAmount = (subtotal: number, discountPercentage: number) =>
  Math.min(subtotal, Math.max(0, Math.round(subtotal * discountPercentage / 100)));

const initialItems: POSItem[] = [];
const initialPayments: POSPayment[] = [];

export const usePOSStore = create<POSStore>()((set, get) => ({
  items: initialItems,
  type: 'sale',
  customer: null,
  customer_display_name: null,
  requested_delivery_date: null,
  payments: initialPayments,
  selected_price_list_id: null,
  selected_price_list_name: null,
  selected_discount_percentage: 0,
  available_price_lists: [],

  addItem: (payload: AddItemPayload) => {
    const { items } = get();
    const step = normalizeDecimalString(payload.sale_quantity_step ?? '1.0000');
    const commercialMaximum = normalizeDecimalString(
      payload.commercial_available_quantity ?? payload.available_stock ?? '0.0000',
    );

    const priceListId = get().selected_price_list_id;
    const lineKey = `${payload.id}:${priceListId ?? 'common'}`;
    const existing = items.find((item) => item.line_key === lineKey);

    if (existing) {
      const newQuantity = addDecimalStrings(existing.quantity, existing.sale_quantity_step);
      if (compareDecimalStrings(newQuantity, existing.commercial_available_quantity) > 0) {
        return;
      }
      set({
        items: items.map((item) =>
          item.line_key === lineKey
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: Number(newQuantity) * item.price,
                discount_amount: getDiscountAmount(Number(newQuantity) * item.price, item.discount_percentage),
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
            line_key: lineKey,
            product_id: payload.id,
            name: payload.name,
            sku: payload.sku,
            barcode: payload.barcode,
            quantity: step,
            price: payload.price,
            price_list_id: priceListId,
            price_list_name: get().selected_price_list_name,
            discount_percentage: get().selected_discount_percentage,
            discount_amount: getDiscountAmount(Number(step) * payload.price, get().selected_discount_percentage),
            subtotal: Number(step) * payload.price,
            sale_quantity_step: step,
            commercial_available_quantity: commercialMaximum,
            stock_measurement_unit_symbol: payload.stock_measurement_unit_symbol ?? null,
          },
        ],
      });
    }
  },

  updateQuantity: (line_key: string, quantity) => {
    const normalizedQuantity = normalizeDecimalString(quantity);
    const item = get().items.find((candidate) => candidate.line_key === line_key);
    if (!item || !isPositiveDecimal(normalizedQuantity) ||
        !isMultipleOfDecimalStrings(normalizedQuantity, item.sale_quantity_step) ||
        compareDecimalStrings(normalizedQuantity, item.commercial_available_quantity) > 0) {
      return;
    }
    set({
      items: get().items.map((item) =>
        item.line_key === line_key
          ? {
              ...item,
              quantity: normalizedQuantity,
              subtotal: Number(normalizedQuantity) * item.price,
              discount_amount: getDiscountAmount(Number(normalizedQuantity) * item.price, item.discount_percentage),
            }
          : item
      ),
    });
  },

  removeItem: (line_key: string) => {
    set({ items: get().items.filter((item) => item.line_key !== line_key) });
  },

  setSelectedPriceListId: (selected_price_list_id, selected_price_list_name = null, selected_discount_percentage = 0) => set({ selected_price_list_id, selected_price_list_name, selected_discount_percentage }),
  setAvailablePriceLists: (available_price_lists: PriceList[]) => set({ available_price_lists }),
  changeItemPriceList: (line_key, price_list_id, price_list_name, discount_percentage) => {
    const source = get().items.find((item) => item.line_key === line_key);
    if (!source) return;
    const nextKey = `${source.product_id}:${price_list_id ?? 'common'}`;
    const collision = get().items.find((item) => item.line_key === nextKey && item.line_key !== line_key);
    if (collision) {
      const quantity = addDecimalStrings(collision.quantity, source.quantity);
      const subtotal = Number(quantity) * collision.price;
      set({ items: get().items.filter((item) => item.line_key !== line_key).map((item) => item.line_key === nextKey ? {
        ...item,
        quantity,
        price_list_id,
        price_list_name,
        discount_percentage,
        subtotal,
        discount_amount: getDiscountAmount(subtotal, discount_percentage),
      } : item) });
      return;
    }
    const subtotal = Number(source.quantity) * source.price;
    set({ items: get().items.map((item) => item.line_key === line_key ? {
      ...item,
      line_key: nextKey,
      price_list_id,
      price_list_name,
      discount_percentage,
      subtotal,
      discount_amount: getDiscountAmount(subtotal, discount_percentage),
    } : item) });
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
      selected_price_list_id: null,
      selected_price_list_name: null,
      selected_discount_percentage: 0,
    }),
}));
