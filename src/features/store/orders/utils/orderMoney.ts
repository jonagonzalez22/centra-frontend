import type { OrderItem } from '../interfaces/order.interface';

/**
 * The API exposes persisted line components, rather than a separate line total.
 * This is used only to present that final line amount; order-level totals remain
 * the backend-provided authoritative values.
 */
export const getOrderItemTotal = (item: Pick<OrderItem, 'subtotal' | 'tax_amount' | 'discount_amount'>): number =>
    Math.max(0, item.subtotal + item.tax_amount - item.discount_amount);
