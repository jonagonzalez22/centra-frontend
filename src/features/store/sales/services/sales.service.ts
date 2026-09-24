import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { StorePaymentMethod } from '@features/store/payment-methods/interfaces/store-payment-method.interface';
import type { Product } from '@features/store/products/interfaces/product.interface';
import type {
  CancelSaleDTO,
  CreateOperationDTO,
  OperationResponse,
  PaginatedSales,
  ReceiptData,
  SaleDetail,
  SalesFilters,
} from '../interfaces/sale.interface';

interface PaymentMethodsListData {
  items: StorePaymentMethod[];
}

interface ProductsListData {
  items: Product[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export const SalesService = {
  getHistory: async (filters: SalesFilters): Promise<PaginatedSales> => {
    const { data } = await api.get<ApiListResponse<PaginatedSales>>(API_ENDPOINTS.STORE.SALES.URL, {
      params: { ...filters, per_page: filters.per_page ?? 15, page: filters.page ?? 1 },
    });
    if (data.status === 'error') throw { status: 0, message: data.message, errors: data.errors ?? undefined } as ApiError;
    return data.data;
  },

  getSaleById: async (id: string): Promise<SaleDetail> => {
    const { data } = await api.get<ApiListResponse<SaleDetail>>(API_ENDPOINTS.STORE.SALES.DETAIL(id));
    if (data.status === 'error') throw { status: 0, message: data.message, errors: data.errors ?? undefined } as ApiError;
    return data.data;
  },

  getSalesReceipt: async (id: string): Promise<ReceiptData> => {
    const { data } = await api.get<ApiListResponse<ReceiptData>>(API_ENDPOINTS.STORE.SALES.RECEIPT(id));
    if (data.status === 'error') throw { status: 0, message: data.message, errors: data.errors ?? undefined } as ApiError;
    return data.data;
  },

  cancelSale: async (id: string, payload: CancelSaleDTO): Promise<SaleDetail> => {
    const { data } = await api.put<ApiListResponse<SaleDetail>>(
      API_ENDPOINTS.STORE.SALES.CANCEL(id),
      payload
    );
    if (data.status === 'error') {
      throw { status: 0, message: data.message, errors: data.errors ?? undefined } as ApiError;
    }
    return data.data;
  },
  getPaymentMethods: async (): Promise<StorePaymentMethod[]> => {
    const { data } = await api.get<ApiListResponse<PaymentMethodsListData>>(
      API_ENDPOINTS.STORE.PAYMENT_METHODS.LIST.URL
    );

    if (data.status === 'error') {
      const error: ApiError = {
        status: 0,
        message: data.message,
        errors: data.errors ?? undefined,
      };
      throw error;
    }

    return data.data.items.filter((pm) => pm.is_enabled);
  },

  searchByBarcode: async (barcode: string): Promise<Product | null> => {
    const { data } = await api.get<ApiListResponse<ProductsListData>>(
      API_ENDPOINTS.STORE.PRODUCTS.URL,
      { params: { barcode, is_active: true } }
    );

    if (data.status === 'error') {
      const error: ApiError = {
        status: 0,
        message: data.message,
        errors: data.errors ?? undefined,
      };
      throw error;
    }

    return data.data.items.length > 0 ? data.data.items[0] : null;
  },

  getProductById: async (id: string): Promise<Product> => {
    const { data } = await api.get<ApiListResponse<Product>>(
      `${API_ENDPOINTS.STORE.PRODUCTS.URL}/${id}`
    );

    if (data.status === 'error') {
      const error: ApiError = {
        status: 0,
        message: data.message,
        errors: data.errors ?? undefined,
      };
      throw error;
    }

    return data.data;
  },

  createOperation: async (payload: CreateOperationDTO): Promise<OperationResponse> => {
    const { data } = await api.post<ApiListResponse<OperationResponse>>(
      API_ENDPOINTS.STORE.OPERATIONS.URL,
      payload
    );

    if (data.status === 'error') {
      const error: ApiError = {
        status: 0,
        message: data.message,
        errors: data.errors ?? undefined,
      };
      throw error;
    }

    return data.data;
  },

  getReceipt: async (operationId: string): Promise<ReceiptData> => {
    const { data } = await api.get<ApiListResponse<ReceiptData>>(
      API_ENDPOINTS.STORE.OPERATIONS.RECEIPT(operationId)
    );

    if (data.status === 'error') {
      const error: ApiError = {
        status: 0,
        message: data.message,
        errors: data.errors ?? undefined,
      };
      throw error;
    }

    return data.data;
  },
};
