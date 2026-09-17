import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommercialProductDetail } from '../interfaces/commercial-product.interface';
import type { OrderEditability } from '../interfaces/order.interface';

export interface OrderProductDraftItem {
    product_id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    original_quantity: number;
    quantity: number;
    minimum_quantity: number;
    delivered_quantity: number;
    active_committed_quantity: number;
    price?: number;
    available_stock?: number;
    is_new: boolean;
}

const initialDraft = (editability: OrderEditability | null): OrderProductDraftItem[] =>
    (editability?.items ?? []).map((item) => ({
        product_id: item.product_id,
        name: item.product_name ?? 'Producto sin nombre',
        sku: null,
        barcode: null,
        original_quantity: item.current_quantity,
        quantity: item.current_quantity,
        minimum_quantity: item.minimum_quantity,
        delivered_quantity: item.delivered_quantity,
        active_committed_quantity: item.active_committed_quantity,
        is_new: false,
    }));

export const useOrderProductDraft = (editability: OrderEditability | null) => {
    const [draft, setDraft] = useState<OrderProductDraftItem[]>(() => initialDraft(editability));

    useEffect(() => {
        setDraft(initialDraft(editability));
    }, [editability]);

    const updateQuantity = useCallback((productId: string, value: number | null) => {
        // Ant Design emits null while the user temporarily clears the field.
        // That is an editing state, not an instruction to remove the product.
        if (value === null || !Number.isFinite(value)) return;

        setDraft((current) =>
            current.map((item) => {
                if (item.product_id !== productId) return item;

                const requestedQuantity = Math.floor(value);
                // Reaching zero is intentionally reserved for the explicit
                // remove action and its confirmation flow.
                const minimum = Math.max(item.minimum_quantity, 1);
                const stockMaximum = item.is_new ? (item.available_stock ?? 0) : Number.MAX_SAFE_INTEGER;

                return {
                    ...item,
                    quantity: Math.max(minimum, Math.min(stockMaximum, requestedQuantity)),
                };
            })
        );
    }, []);

    const addProduct = useCallback((product: CommercialProductDetail) => {
        if (product.available_stock < 1) return false;

        setDraft((current) => {
            const existing = current.find((item) => item.product_id === product.id);

            if (existing) {
                return current.map((item) =>
                    item.product_id === product.id
                        ? {
                              ...item,
                              quantity: item.is_new
                                  ? Math.min(item.quantity + 1, item.available_stock ?? item.quantity)
                                  : item.quantity + 1,
                          }
                        : item
                );
            }

            return [
                ...current,
                {
                    product_id: product.id,
                    name: product.name,
                    sku: product.sku,
                    barcode: product.barcode,
                    original_quantity: 0,
                    quantity: 1,
                    minimum_quantity: 0,
                    delivered_quantity: 0,
                    active_committed_quantity: 0,
                    price: product.price,
                    available_stock: product.available_stock,
                    is_new: true,
                },
            ];
        });

        return true;
    }, []);

    const removeProduct = useCallback((productId: string) => {
        setDraft((current) =>
            current.map((item) =>
                item.product_id === productId
                    ? {
                          ...item,
                          quantity: 0,
                      }
                    : item
            )
        );
    }, []);

    const finalItems = useMemo(
        () =>
            draft
                .filter((item) => item.quantity > 0)
                .map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        [draft]
    );

    const isDirty = useMemo(
        () =>
            draft.length !== (editability?.items.length ?? 0) ||
            draft.some((item) => item.quantity !== item.original_quantity),
        [draft, editability?.items.length]
    );

    return {
        draft,
        finalItems,
        isDirty,
        updateQuantity,
        addProduct,
        removeProduct,
    };
};
