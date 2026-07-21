import type { Customer } from '@features/store/customers/types/customer.types';

export interface POSItem {
  product_id: string;
  name: string;
  sku: string;
  barcode: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface POSPayment {
  store_payment_method_id: string;
  amount: number;
  reference?: string;
}

export interface CreateOperationDTO {
  type: 'sale' | 'order';
  customer_id?: string | null;
  requested_delivery_date?: string | null;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
  payments: POSPayment[];
}

export interface AddItemPayload {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  available_stock: number;
}

export interface OperationResponse {
  id: string;
  operation_number: string;
  type: 'sale' | 'order';
  status: string;
  total: number;
  created_at: string;
}

export interface POSState {
  items: POSItem[];
  type: 'sale' | 'order';
  customer: Customer | null;
  requested_delivery_date: string | null;
  payments: POSPayment[];
}

export interface POSActions {
  addItem: (payload: AddItemPayload) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  removeItem: (product_id: string) => void;
  setType: (type: 'sale' | 'order') => void;
  setCustomer: (customer: Customer | null) => void;
  setRequestedDeliveryDate: (date: string | null) => void;
  setPayments: (payments: POSPayment[]) => void;
  resetPOS: () => void;
}

export type POSStore = POSState & POSActions;
