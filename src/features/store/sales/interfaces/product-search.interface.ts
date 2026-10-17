import type { DecimalString } from '@/types/decimal';

export interface ProductSearchItem {
  id: string;
  name: string;
  sku: string;
  commercial_available_quantity: DecimalString;
}
