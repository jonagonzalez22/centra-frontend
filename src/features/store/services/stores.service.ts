import api from '../../../api/api.config';
import { Store, CreateStoreDto } from '../types/store.types';

export const StoresService = {
  getAll: async (): Promise<Store[]> => {
    const { data } = await api.get<Store[]>('/stores');
    return data;
  },

  getById: async (id: number): Promise<Store> => {
    const { data } = await api.get<Store>(`/stores/${id}`);
    return data;
  },

  create: async (storeData: CreateStoreDto): Promise<Store> => {
    const { data } = await api.post<Store>('/stores', storeData);
    return data;
  },
};
