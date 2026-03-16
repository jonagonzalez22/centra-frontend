export interface Store {
  id: number;
  name: string;
  email: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CreateStoreDto {
  name: string;
  email?: string;
  status: 'active' | 'inactive';
}
