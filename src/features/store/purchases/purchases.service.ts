import api from '@/api/api.config';

export type PurchaseType = 'order' | 'direct';
export type PurchaseStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'closed' | 'cancelled';

export interface PurchaseSupplierSnapshot { id: string; business_name: string; tax_id: string | null; }
export interface PurchaseListItem { id: string; purchase_number: string; purchase_type: PurchaseType; status: PurchaseStatus; supplier: PurchaseSupplierSnapshot; total: string; ordered_at: string | null; cancelled_at: string | null; closed_at?: string | null; created_at: string; }
export interface PurchaseItem { id: string; product_id: string; product_name: string; product_sku: string; supplier_code: string | null; supplier_product_name: string | null; measurement_unit_code: string; measurement_unit_symbol: string; quantity_ordered: string; quantity_received: string; quantity_pending: string; unit_price: string; subtotal: string; }
export interface PurchaseReceiptItem { id: string; purchase_item_id: string; product_id: string; product_name: string; product_sku: string; measurement_unit_code: string; measurement_unit_symbol: string; quantity_received: string; }
export interface PurchaseReceipt { id: string; receipt_number: string; received_at: string | null; notes: string | null; created_at: string | null; created_by?: { id: string; name: string }; items: PurchaseReceiptItem[]; }
export interface PurchaseDetail extends PurchaseListItem { notes: string | null; items: PurchaseItem[]; receipts?: PurchaseReceipt[]; }
export interface PurchaseListResponse { items: PurchaseListItem[]; total: number; per_page: number; current_page: number; last_page: number; }
export interface PurchaseParams { search?: string; status?: PurchaseStatus; purchase_type?: PurchaseType; supplier_id?: string; page?: number; per_page?: number; }
export interface PurchaseDraftItemPayload { product_id: string; quantity: string; unit_price: string; }
export interface PurchaseDraftPayload { supplier_id: string; purchase_type: PurchaseType; notes?: string | null; items: PurchaseDraftItemPayload[]; }
export interface CreatePurchaseReceiptPayload { notes?: string | null; items: Array<{ purchase_item_id: string; quantity: string }>; }

export const PurchasesService = {
    async getAll(params: PurchaseParams = {}): Promise<PurchaseListResponse> {
        const { data } = await api.get('/v1/store/purchases', { params });
        return data.data as PurchaseListResponse;
    },
    async getById(id: string): Promise<PurchaseDetail> { const { data } = await api.get(`/v1/store/purchases/${id}`); return data.data as PurchaseDetail; },
    async create(payload: PurchaseDraftPayload): Promise<PurchaseDetail> { const { data } = await api.post('/v1/store/purchases', payload); return data.data as PurchaseDetail; },
    async update(id: string, payload: PurchaseDraftPayload): Promise<PurchaseDetail> { const { data } = await api.put(`/v1/store/purchases/${id}`, payload); return data.data as PurchaseDetail; },
    async order(id: string): Promise<PurchaseDetail> { const { data } = await api.post(`/v1/store/purchases/${id}/order`); return data.data as PurchaseDetail; },
    async cancel(id: string): Promise<PurchaseDetail> { const { data } = await api.post(`/v1/store/purchases/${id}/cancel`); return data.data as PurchaseDetail; },
    async close(id: string): Promise<PurchaseDetail> { const { data } = await api.post(`/v1/store/purchases/${id}/close`); return data.data as PurchaseDetail; },
    async createReceipt(id: string, payload: CreatePurchaseReceiptPayload): Promise<PurchaseReceipt> { const { data } = await api.post(`/v1/store/purchases/${id}/receipts`, payload); return data.data as PurchaseReceipt; },
};

export const purchaseTypeLabel = (type: PurchaseType) => type === 'order' ? 'Orden de compra' : 'Compra directa';
export const purchaseStatusLabel = (status: PurchaseStatus) => ({ draft: 'Borrador', ordered: 'Ordenada', partially_received: 'Parcialmente recibida', received: 'Recibida', closed: 'Cerrada', cancelled: 'Cancelada' })[status];
