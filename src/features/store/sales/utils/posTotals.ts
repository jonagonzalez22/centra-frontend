import type { POSItem } from '../interfaces/sale.interface';

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateLineSubtotal = (quantity: string, price: number) =>
  roundMoney(Number(quantity) * price);

export const calculateLineDiscount = (subtotal: number, discountPercentage: number) =>
  Math.min(subtotal, Math.max(0, roundMoney(subtotal * discountPercentage / 100)));

export const calculatePOSTotals = (items: POSItem[]) => {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
  const discount = roundMoney(items.reduce((sum, item) => sum + item.discount_amount, 0));

  return { subtotal, discount, total: Math.max(0, roundMoney(subtotal - discount)) };
};
