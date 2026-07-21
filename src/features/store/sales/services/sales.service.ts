import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import type { StorePaymentMethod } from '@features/store/payment-methods/interfaces/store-payment-method.interface';
import type { Product } from '@features/store/products/interfaces/product.interface';
import type { CreateOperationDTO, OperationResponse } from '../interfaces/sale.interface';

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
};
