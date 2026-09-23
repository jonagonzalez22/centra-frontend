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
  customer_display_name?: string | null;
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
  customer_display_name: string | null;
  created_at: string;
}

export interface SaleListItem extends OperationResponse {
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  created_by?: { id: string; name: string | null };
  customer?: { id: string; name: string | null } | null;
}

export interface SaleDetail extends SaleListItem {
  items: Array<{ id: string; product_name: string; quantity: number; price: number; subtotal: number; tax_amount: number; discount_amount: number }>;
  payments: Array<{ id: string; amount: number; store_payment_method?: { name: string | null } | null }>;
}

export interface SalesFilters {
  operation_number?: string;
  status?: 'confirmed' | 'cancelled';
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at';
  sort_direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface PaginatedSales {
  items: SaleListItem[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ReceiptStore {
  name: string | null;
  cuit: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  timezone: string;
}

export interface ReceiptCashier {
  id: string;
  name: string;
}

export interface ReceiptOperation {
  id: string;
  operation_number: string;
  type: 'sale';
  status: string;
  occurred_at: string | null;
  cashier: ReceiptCashier | null;
}

export interface ReceiptCustomer {
  display_name: string;
}

export interface ReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
}

export interface ReceiptTotals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paid_amount: number;
  pending_amount: number;
}

export interface ReceiptPayment {
  method_name: string | null;
  amount: number;
}

export interface ReceiptData {
  store: ReceiptStore;
  operation: ReceiptOperation;
  customer: ReceiptCustomer | null;
  items: ReceiptItem[];
  totals: ReceiptTotals;
  payments: ReceiptPayment[];
}

export interface POSState {
  items: POSItem[];
  type: 'sale' | 'order';
  customer: Customer | null;
  customer_display_name: string | null;
  requested_delivery_date: string | null;
  payments: POSPayment[];
}

export interface POSActions {
  addItem: (payload: AddItemPayload) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  removeItem: (product_id: string) => void;
  setType: (type: 'sale' | 'order') => void;
  setCustomer: (customer: Customer | null) => void;
  setCustomerDisplayName: (name: string | null) => void;
  setRequestedDeliveryDate: (date: string | null) => void;
  setPayments: (payments: POSPayment[]) => void;
  resetPOS: () => void;
}

export type POSStore = POSState & POSActions;
