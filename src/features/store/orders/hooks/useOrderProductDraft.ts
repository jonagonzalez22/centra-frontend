import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommercialProductDetail } from '../interfaces/commercial-product.interface';
import type { OrderEditability } from '../interfaces/order.interface';
import type { DecimalString } from '@/types/decimal';
import { addDecimalStrings, compareDecimalStrings, isMultipleOfDecimalStrings, maxDecimalStrings, normalizeDecimalString } from '@/utils/quantity';

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
    sale_quantity_step: DecimalString;
    commercial_available_quantity: DecimalString;
    maximum_editable_quantity: DecimalString;
    stock_measurement_unit_symbol: string | null;
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
        sale_quantity_step: item.sale_quantity_step,
        commercial_available_quantity: item.commercial_available_quantity,
        maximum_editable_quantity: item.maximum_editable_quantity,
        stock_measurement_unit_symbol: item.stock_measurement_unit?.symbol ?? null,
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
                if (!isMultipleOfDecimalStrings(requestedQuantity, item.sale_quantity_step)) return item;
                // Reaching zero is intentionally reserved for the explicit
                // remove action and its confirmation flow.
                const minimum = maxDecimalStrings(item.minimum_quantity, item.sale_quantity_step);
                const stockMaximum = item.is_new
                    ? item.commercial_available_quantity
                    : item.maximum_editable_quantity;

                return {
                    ...item,
                    quantity: compareDecimalStrings(requestedQuantity, minimum) < 0 ||
                        compareDecimalStrings(requestedQuantity, stockMaximum) > 0
                        ? item.quantity
                        : requestedQuantity,
                };
            })
        );
    }, []);

    const addProduct = useCallback((product: CommercialProductDetail) => {
        if (compareDecimalStrings(product.commercial_available_quantity, product.sale_quantity_step) < 0) return false;

        setDraft((current) => {
            const existing = current.find((item) => item.product_id === product.id);

            if (existing) {
                return current.map((item) =>
                    item.product_id === product.id
                        ? {
                              ...item,
                              quantity: compareDecimalStrings(
                                  addDecimalStrings(item.quantity, item.sale_quantity_step),
                                  item.maximum_editable_quantity,
                              ) <= 0
                                  ? addDecimalStrings(item.quantity, item.sale_quantity_step)
                                  : item.quantity,
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
                    quantity: product.sale_quantity_step,
                    minimum_quantity: '0.0000',
                    delivered_quantity: '0.0000',
                    active_committed_quantity: '0.0000',
                    price: product.price,
                    available_stock: product.available_stock,
                    sale_quantity_step: product.sale_quantity_step,
                    commercial_available_quantity: product.commercial_available_quantity,
                    maximum_editable_quantity: product.commercial_available_quantity,
                    stock_measurement_unit_symbol: product.stock_measurement_unit?.symbol ?? null,
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
