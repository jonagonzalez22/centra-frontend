import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommercialProductDetail } from '../interfaces/commercial-product.interface';
import type { OrderEditability } from '../interfaces/order.interface';
import type { DecimalString } from '@/types/decimal';
import { addDecimalStrings, compareDecimalStrings, minDecimalStrings, normalizeDecimalString } from '@/utils/quantity';

export interface OrderProductDraftItem {
    product_id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    original_quantity: DecimalString;
    quantity: DecimalString;
    minimum_quantity: DecimalString;
    delivered_quantity: DecimalString;
    active_committed_quantity: DecimalString;
    price?: number;
    available_stock?: DecimalString;
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

    const updateQuantity = useCallback((productId: string, value: DecimalString | null) => {
        // Ant Design emits null while the user temporarily clears the field.
        // That is an editing state, not an instruction to remove the product.
        if (value === null) return;

        setDraft((current) =>
            current.map((item) => {
                if (item.product_id !== productId) return item;

                const requestedQuantity = normalizeDecimalString(value);
                // Reaching zero is intentionally reserved for the explicit
                // remove action and its confirmation flow.
                const minimum = compareDecimalStrings(item.minimum_quantity, '1.0000') > 0 ? item.minimum_quantity : '1.0000';
                const stockMaximum = item.is_new ? (item.available_stock ?? requestedQuantity) : requestedQuantity;

                return {
                    ...item,
                    quantity: item.is_new
                        ? (compareDecimalStrings(minDecimalStrings(stockMaximum, requestedQuantity), minimum) < 0 ? minimum : minDecimalStrings(stockMaximum, requestedQuantity))
                        : (compareDecimalStrings(requestedQuantity, minimum) < 0 ? minimum : requestedQuantity),
                };
            })
        );
    }, []);

    const addProduct = useCallback((product: CommercialProductDetail) => {
        if (compareDecimalStrings(product.available_stock, '1.0000') < 0) return false;

        setDraft((current) => {
            const existing = current.find((item) => item.product_id === product.id);

            if (existing) {
                return current.map((item) =>
                    item.product_id === product.id
                        ? {
                              ...item,
                              quantity: item.is_new
                                  ? minDecimalStrings(addDecimalStrings(item.quantity, '1'), item.available_stock ?? item.quantity)
                                  : addDecimalStrings(item.quantity, '1'),
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
                    original_quantity: '0.0000',
                    quantity: '1.0000',
                    minimum_quantity: '0.0000',
                    delivered_quantity: '0.0000',
                    active_committed_quantity: '0.0000',
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
                          quantity: '0.0000',
                      }
                    : item
            )
        );
    }, []);

    const finalItems = useMemo(
        () =>
            draft
                .filter((item) => compareDecimalStrings(item.quantity, '0.0000') > 0)
                .map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        [draft]
    );

    const isDirty = useMemo(
        () =>
            draft.length !== (editability?.items.length ?? 0) ||
            draft.some((item) => compareDecimalStrings(item.quantity, item.original_quantity) !== 0),
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
