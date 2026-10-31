import { useMemo } from 'react';
import type { OrderDetail, OrderEditability } from '../interfaces/order.interface';
import type { DecimalString } from '@/types/decimal';
import { addDecimalStrings, compareDecimalStrings, maxDecimalStrings, subtractDecimalStrings } from '@/utils/quantity';

export interface OrderProductDraftItem {
    operation_item_id: string;
    line_key: string;
    product_id: string;
    name: string;
    sku: string | null;
    original_quantity: DecimalString;
    quantity: DecimalString;
    minimum_quantity: DecimalString;
    delivered_quantity: DecimalString;
    active_committed_quantity: DecimalString;
    sale_quantity_step: DecimalString;
    commercial_available_quantity: DecimalString;
    maximum_editable_quantity: DecimalString;
    stock_measurement_unit_symbol: string | null;
    price: number;
    subtotal: number;
    discount_amount: number;
    price_list_id: string | null;
    price_list_name: string | null;
    discount_percentage: number;
}

export const useOrderProductDraft = (
    order: OrderDetail | null,
    editability: OrderEditability | null
) => useMemo(() => {
    if (!order) return [];

    return order.items.map((line) => {
        const productState = editability?.items.find((item) => item.product_id === line.product_id);
        const deliverySummaryItem = order.delivery_summary.items.find(
            (item) => item.product_id === line.product_id
        );
        const otherLinesQuantity = order.items
            .filter((other) => other.product_id === line.product_id && other.id !== line.id)
            .reduce((sum, other) => addDecimalStrings(sum, other.quantity), '0.0000' as DecimalString);
        const productMinimum = productState?.minimum_quantity ?? '0.0000';
        const productMaximum = productState?.maximum_editable_quantity ?? line.quantity;

        return {
            operation_item_id: line.id,
            line_key: line.id,
            product_id: line.product_id,
            name: line.product_name,
            sku: deliverySummaryItem?.sku ?? null,
            original_quantity: line.quantity,
            quantity: line.quantity,
            minimum_quantity: maxDecimalStrings(subtractDecimalStrings(productMinimum, otherLinesQuantity), '0.0000'),
            delivered_quantity: productState?.delivered_quantity ?? '0.0000',
            active_committed_quantity: productState?.active_committed_quantity ?? '0.0000',
            sale_quantity_step: line.sale_quantity_step ?? productState?.sale_quantity_step ?? '1.0000',
            commercial_available_quantity: productState?.commercial_available_quantity ?? '0.0000',
            maximum_editable_quantity: maxDecimalStrings(
                subtractDecimalStrings(productMaximum, otherLinesQuantity),
                line.quantity
            ),
            stock_measurement_unit_symbol: line.stock_measurement_unit?.symbol ?? productState?.stock_measurement_unit?.symbol ?? null,
            price: line.price,
            subtotal: line.subtotal,
            discount_amount: line.discount_amount,
            price_list_id: line.price_list_id ?? null,
            price_list_name: line.price_list_name ?? null,
            discount_percentage: line.discount_percentage ?? 0,
        };
    }).filter((item) => compareDecimalStrings(item.quantity, '0.0000') > 0);
}, [editability, order]);
